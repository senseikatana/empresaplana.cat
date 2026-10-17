import { createHmac } from "node:crypto";

/**
 * Limitador de peticiones en memoria, de ventana fija.
 *
 * Alcance: **por instancia**. InsForge Compute escala a cero y corre N
 * réplicas, así que esto NO es una cuota distribuida: dos réplicas permiten el
 * doble. Es deliberado — el límite duro vive en la base (`MAX_REPORTS_PER_DAY`
 * sobre `Report.reporterKey`). Esta capa solo absorbe ráfagas.
 */

interface Bucket {
	count: number;
	resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;
let lastSweep = Date.now();

/**
 * Vaciado perezoso. El enfriamiento de 60 s es INCONDICIONAL: si dependiera
 * del tamaño, una avalancha que llena el mapa pagaría la iteración completa en
 * cada petición, y el coste sería del atacante.
 */
function sweep(now: number): void {
	if (now - lastSweep < 60_000) return;
	lastSweep = now;

	for (const [key, bucket] of buckets) {
		if (bucket.resetAt <= now) buckets.delete(key);
	}

	if (buckets.size >= MAX_TRACKED_KEYS) {
		// Se descarta lo que está a punto de expirar, no lo primero que se insertó
		// (orden de inserción no dice nada sobre utilidad).
		const live = [...buckets.entries()].filter(([, b]) => b.resetAt > now);
		live.sort((a, b) => a[1].resetAt - b[1].resetAt);
		buckets.clear();
		for (const [key, bucket] of live.slice(
			0,
			Math.floor(MAX_TRACKED_KEYS / 2),
		)) {
			buckets.set(key, bucket);
		}
	}
}

/**
 * Secreto de derivación del identificador de cliente.
 *
 * Falla en producción a propósito: con una constante pública, `reporterKey`
 * sería un hash sin sal de (IP + user-agent), reversible por fuerza bruta sobre
 * un espacio de búsqueda diminuto. Eso es dato personal recuperable, no un
 * pseudónimo, y contradice lo que el esquema afirma.
 */
function trackingSalt(): Buffer {
	const secret = process.env.TRACKING_HASH_SECRET;
	if (secret) return Buffer.from(secret, "utf8");
	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"TRACKING_HASH_SECRET is required in production; refusing to hash reporter keys with a public constant.",
		);
	}
	return Buffer.from("development-only-no-salt", "utf8");
}

const IP_PATTERN = /^[0-9a-f:.]{3,45}$/i;

/**
 * Dirección del cliente tomándola solo de cabeceras que escribe la plataforma.
 *
 * Un proxy AÑADE al `X-Forwarded-For`, así que el único valor que un proxy
 * respaldó es el ÚLTIMO. El primero lo elige el cliente y rotarlo bastaría para
 * evadir cualquier límite. Por eso la clave NO incluye el user-agent: también
 * lo elige quien llama.
 *
 * El despliegue va detrás de Cloudflare, que reescribe la cabecera de origen, y
 * de Fly, que publica la del cliente final.
 */
function clientIp(request: Request): string | undefined {
	const candidates = [
		request.headers.get("cf-connecting-ip"),
		request.headers.get("fly-client-ip"),
		(request.headers.get("x-forwarded-for") ?? "").split(",").at(-1)?.trim(),
	];
	for (const candidate of candidates) {
		const value = candidate?.trim();
		if (value && IP_PATTERN.test(value)) return value;
	}
	return undefined;
}

/**
 * Identificador estable y no reversible del cliente.
 *
 * Se usa HMAC-SHA256 y no `sha256(sal || ip)` a propósito. Un hash de forma
 * libre es reversible por enumeración: quien conoce (o fuerza) la sal puede
 * calcular `sha256(sal || candidato)` para todos los candidatos y comprobarlo
 * contra el valor observado, que es exactamente lo que el nuevo cliente espera.
 * Un HMAC exige la clave para evaluar la función, así que evaluar un candidato
 * solo devuelve `HMAC(k, candidato)` y no hay con qué compararlo.
 *
 * La cabecera `x-forwarded-for` es pública (cualquiera puede añadirla), pero no
 * actúa como sal del SHA256: allí el atacante necesita usar `HMAC("su valor
 * random", ip)` y validar contra el reporterKey que ve — que además se genera
 * con el `TRACKING_HASH_SECRET` real que nadie conoce. Con `sha256(sal||ip)` la
 * cabecera llegó a ser el candado que preveía el ataque. Con HMAC deja de serlo.
 */
export function clientKey(request: Request): string {
	const ip = clientIp(request);
	// Sin IP fiable no hay clave: mejor no limitar que aplicar un límite global
	// compartido a todo internet, que bloquearía a los usuarios legítimos.
	if (!ip) return "unidentified";
	return createHmac("sha256", trackingSalt())
		.update(ip)
		.digest("hex")
		.slice(0, 32);
}

/** Ventana por defecto para ráfagas de escritura. */
export const DEFAULT_BURST = 5;
export const DEFAULT_BURST_WINDOW_MS = 10 * 60 * 1000;

/** Presupuesto de lectura, bastante más alto que el de escritura. */
export const READ_BUDGET = 120;
export const READ_WINDOW_MS = 60 * 1000;

export interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds: number;
}

export function consume(
	key: string,
	limit: number,
	windowMs: number,
): RateLimitResult {
	const now = Date.now();
	sweep(now);

	const bucket = buckets.get(key);
	if (!bucket || bucket.resetAt <= now) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
	}

	if (bucket.count >= limit) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
		};
	}

	bucket.count += 1;
	return {
		allowed: true,
		remaining: limit - bucket.count,
		retryAfterSeconds: 0,
	};
}

export function tooManyRequests(result: RateLimitResult): Response {
	return Response.json(
		{ error: "rate_limited", retryAfterSeconds: result.retryAfterSeconds },
		{
			status: 429,
			headers: { "Retry-After": String(result.retryAfterSeconds) },
		},
	);
}
