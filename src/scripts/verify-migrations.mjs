#!/usr/bin/env node
/**
 * Control de deriva esquema → producción.
 *
 * Implementa los controles documentados en
 * `docs/architecture/decisions/migration-mapping.md`.
 *
 * Comprobación 1 (offline, siempre corre): ¿`prisma.config.ts` apunta al
 *   directorio de migraciones que existe de verdad?
 * Comprobación 2 (offline, siempre corre): ¿el DDL que Prisma derivaría del
 *   modelo coincide con el SQL escrito a mano?
 * Comprobación 3 (requiere DSN): ¿los ficheros `.sql` están realmente
 *   aplicados en la base de destino?
 *
 * No escribe nada: solo lee catálogo y difumina texto. Sale con código 1 si
 * algo del control falla, 2 si no se pudo ejecutar el control.
 *
 * Uso: bun run db:drift
 */

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

// El repo no carga `.env` solo fuera de Astro: es la convención del proyecto.
import "dotenv/config";

const ROOT = process.cwd();
const SCHEMA = path.join(ROOT, "prisma", "schema.prisma");
const CONFIG = path.join(ROOT, "prisma.config.ts");

const findings = [];
const fail = (id, msg) => findings.push({ id, level: "fail", msg });
const warn = (id, msg) => findings.push({ id, level: "warn", msg });
const ok = (id, msg) => findings.push({ id, level: "ok", msg });

// ── 1. ¿Dónde mira Prisma? ──────────────────────────────────────────────────
const configuredPath = (() => {
	const raw = readFileSync(CONFIG, "utf8");
	// Hay comentarios dentro del bloque, así que no se puede anclar a `\s*`.
	const m = raw.match(/migrations:\s*\{[\s\S]*?\bpath:\s*"([^"]+)"/);
	return m ? m[1] : null;
})();
const actualDirs = ["migrations", "prisma/migrations"].filter((d) =>
	existsSync(path.join(ROOT, d)),
);

if (!configuredPath) {
	warn("config.migrations_path", "prisma.config.ts no declara migrations.path");
} else if (!existsSync(path.join(ROOT, configuredPath))) {
	fail(
		"config.migrations_path",
		`prisma.config.ts apunta a "${configuredPath}" pero ese directorio NO existe. ` +
			`prisma migrate no encontraría ninguna migración. ` +
			`Directorios con SQL real: ${actualDirs.join(", ") || "ninguno"}.`,
	);
} else {
	ok("config.migrations_path", `prisma.config.ts → ${configuredPath}`);
}

const sqlDir = actualDirs[0];
if (!sqlDir) {
	fail(
		"sql.present",
		"No hay ningún directorio de migraciones SQL en el repo.",
	);
} else {
	const files = readdirSync(path.join(ROOT, sqlDir))
		.filter((f) => f.endsWith(".sql"))
		.sort();
	if (files.length === 0) {
		fail("sql.present", `${sqlDir} está vacío.`);
	} else {
		ok("sql.present", `${sqlDir}: ${files.length} ficheros`);
	}

	// ── 2. Cobertura entre modelo y SQL (offline) ────────────────────────────
	// Se comparan NOMBRES de tabla, no texto de DDL. Comparar el DDL completo
	// daba un check permanente y ruidoso: `db push` redacta `CREATE TABLE` de
	// forma distinta al SQL escrito a mano, y las migraciones posteriores
	// alteran columnas en lugar de recrear la tabla.
	//
	// Los `auth_*` se excluyen deliberadamente: son de InsForge, este repo no
	// los modela y no deben aparecer como "faltantes".
	const INSFORGE_OWNED = /^auth_/;

	// Excepción declarada, no un hueco. `service_alerts` se crea en una
	// migración y vive en producción, pero ningún fichero del código la lee ni
	// la escribe: es una tabla huérfana de una función que nunca se completó.
	// Se avisa en la salida (nivel warn) en lugar de bloquear, para que siga
	// visible sin convertir el control en algo que siempre está en rojo y se
	// aprende a ignorar. Si se decide usarla, hay que añadir el modelo a
	// `prisma/schema.prisma` y quitarla de esta lista; si no, se retira con una
	// migración. Ver `docs/architecture/decisions/migration-mapping.md`.
	const KNOWN_SQL_ONLY = new Set(["service_alerts"]);
	// Nombres de tabla. Se toma el último segmento: los ficheros escritos a
	// mano usan `CREATE TABLE public.service_alerts` y el modelo usa `"Line"`,
	// y capturar solo el primer identificador devolvía `public` como si fuera
	// una tabla.
	const tablesIn = (sql) =>
		new Set(
			[
				...sql.matchAll(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([^(\s]+)\s*\(/gi),
			].map((m) => {
				const name = m[1].replace(/["`]/g, "");
				const last = name.split(".").pop() ?? "";
				return last;
			}),
		);

	if (files.length === 0) {
		warn("drift.tables", `${sqlDir} sin ficheros: no se puede comparar.`);
	} else {
		if (!files.some((f) => f.includes("initial-prisma-schema"))) {
			warn(
				"drift.initial_sql",
				"No encuentro la migración inicial; la comparación sigue con el resto.",
			);
		}
		try {
			const derived = execFileSync(
				"npx",
				[
					"prisma",
					"migrate",
					"diff",
					"--from-empty",
					"--to-schema",
					SCHEMA,
					"--script",
				],
				{
					cwd: ROOT,
					encoding: "utf8",
					maxBuffer: 32 * 1024 * 1024,
					stdio: ["ignore", "pipe", "ignore"],
				},
			);
			// Se concatenan TODOS los ficheros, no solo el inicial: `Report`,
			// `Escalation` y `Review` los añaden migraciones posteriores.
			const written = files
				.map((f) => readFileSync(path.join(ROOT, sqlDir, f), "utf8"))
				.join("\n");

			const model = tablesIn(derived);
			const sql = tablesIn(written);

			// Modelo sin tabla creada: Prisma la exigiría y `db push` la crearía
			// sin los CHECK ni los índices parciales que solo existen en SQL.
			const modelOnly = [...model].filter((t) => !sql.has(t));
			// Tabla en SQL que el modelo no conoce y no es de InsForge.
			const unknownSql = [...sql].filter(
				(t) =>
					!model.has(t) && !INSFORGE_OWNED.test(t) && !KNOWN_SQL_ONLY.has(t),
			);
			const declaredSqlOnly = [...sql].filter((t) => KNOWN_SQL_ONLY.has(t));

			if (modelOnly.length === 0 && unknownSql.length === 0) {
				ok(
					"drift.tables",
					`Cobertura completa: ${model.size} tablas del modelo, ${sql.size} en SQL.`,
				);
			} else {
				fail(
					"drift.tables",
					`Modelo sin migración: ${modelOnly.join(", ") || "ninguno"}. ` +
						`SQL sin modelo (excluyendo auth_*): ${unknownSql.join(", ") || "ninguno"}.`,
				);
			}
			if (declaredSqlOnly.length > 0) {
				warn(
					"drift.tables_orphan",
					`Tablas en producción sin modelo Prisma (excepción declarada): ${declaredSqlOnly.join(", ")}. ` +
						`Ningún código las usa.`,
				);
			}
		} catch (error) {
			warn(
				"drift.tables",
				`No se pudo ejecutar prisma migrate diff: ${error.message}`,
			);
		}
	}

	// Los CHECK e índices parciales no son expresables en Prisma: si existen
	// solo en SQL y la base no los tiene, `db push` los habría perdido.
	const checkCount = files.reduce((n, f) => {
		const sql = readFileSync(path.join(ROOT, sqlDir, f), "utf8");
		return n + (sql.match(/\bCHECK\s*\(/gi) || []).length;
	}, 0);
	ok(
		"sql.check_constraints",
		`${checkCount} restricciones CHECK declaradas en SQL (Prisma no las genera).`,
	);
}

// ── 1b. Lista declarada vs disco vs MIGRATION_ORDER ─────────────────────────
// Tres fuentes que tienen que decir exactamente lo mismo: `prisma/migrations_path`
// (legible), `MIGRATION_ORDER` en prisma.config.ts (datos) y `migrations/`
// (realidad). Si discrepan, alguien metió un SQL por el medio sin que se note.
async function declaredListMatches() {
	const listFile = path.join(ROOT, "prisma", "migrations_path");
	if (!existsSync(listFile)) {
		fail(
			"declared.file",
			"prisma/migrations_path no existe: no hay lista declarada.",
		);
		return;
	}
	const declared = readFileSync(listFile, "utf8")
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.startsWith("migrations/") && l.endsWith(".sql"));

	let order = [];
	try {
		// `prisma.config.ts` es TypeScript y este script corre en node, que no
		// carga TS: se extrae el array con un patrón en lugar de importarlo.
		const cfg = readFileSync(path.join(ROOT, "prisma.config.ts"), "utf8");
		const block = cfg.match(/MIGRATION_ORDER\s*=\s*\[([\s\S]*?)\]/);
		if (block) {
			order = [...block[1].matchAll(/"(migrations\/[^"]+\.sql)"/g)].map(
				(m) => m[1],
			);
		}
		if (order.length === 0) {
			warn(
				"declared.order",
				"MIGRATION_ORDER vacío o con formato no reconocido.",
			);
		}
	} catch (error) {
		warn("declared.order", `No se pudo leer MIGRATION_ORDER: ${error.message}`);
	}

	const onDisk = readdirSync(path.join(ROOT, sqlDir ?? "migrations"))
		.filter((f) => f.endsWith(".sql"))
		.sort()
		.map((f) => `migrations/${f}`);

	const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
	if (same(declared, onDisk)) {
		ok("declared.disk", `${declared.length} ficheros declarados = disco.`);
	} else {
		const missing = onDisk.filter((f) => !declared.includes(f));
		const extra = declared.filter((f) => !onDisk.includes(f));
		fail(
			"declared.disk",
			`prisma/migrations_path y migrations/ no coinciden. ` +
				`En disco sin declarar: ${missing.join(", ") || "ninguno"}. ` +
				`Declarados sin fichero: ${extra.join(", ") || "ninguno"}.`,
		);
	}
	if (order.length === 0) {
		warn("declared.order", "MIGRATION_ORDER vacío o ilegible.");
	} else if (same(order, declared)) {
		ok("declared.order", "MIGRATION_ORDER coincide con migrations_path.");
	} else {
		fail(
			"declared.order",
			"El orden de MIGRATION_ORDER (prisma.config.ts) no coincide con prisma/migrations_path. " +
				"El orden de aplicación no está definido en un solo sitio.",
		);
	}
	if (!declared.some((f) => f.includes("tracking-persistence"))) {
		fail(
			"declared.tracking",
			"Falta la migración de persistencia de reportes: sin ella la evidencia de la reclamación desaparece en cada despliegue.",
		);
	}
}

// ── 3. ¿Están aplicadas? (requiere DSN, es tolerante a fallos) ──────────────
async function appliedState() {
	if (!process.env.DATABASE_URL) {
		warn("applied.state", "Sin DATABASE_URL: no se puede comprobar la base.");
		return;
	}
	let pg;
	try {
		pg = (await import("pg")).default;
	} catch {
		warn("applied.state", "Módulo pg ausente: no se puede comprobar la base.");
		return;
	}
	const client = new pg.Client({
		connectionString: process.env.DATABASE_URL,
		ssl: { rejectUnauthorized: false },
	});
	try {
		await client.connect();
		const { rows } = await client.query(`
			SELECT c.relname AS name
			FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
			WHERE n.nspname = 'public' AND c.relkind = 'r'
			ORDER BY 1;
		`);
		const names = new Set(rows.map((r) => r.name));
		for (const model of ["Report", "Escalation", "Review"]) {
			if (names.has(model))
				ok(`applied.${model}`, `${model} existe en la base.`);
			else
				fail(
					`applied.${model}`,
					`${model} NO existe: la migración no se aplicó.`,
				);
		}
		const { rows: idx } = await client.query(`
			SELECT indexname FROM pg_indexes
			WHERE indexname IN ('Escalation_open_window_unique', 'Report_serviceDate_idx');
		`);
		const found = new Set(idx.map((r) => r.indexname));
		for (const want of [
			"Escalation_open_window_unique",
			"Report_serviceDate_idx",
		]) {
			if (found.has(want)) ok(`applied.${want}`, `${want} presente.`);
			else
				fail(
					`applied.${want}`,
					`${want} ausente: el control de duplicados no existe.`,
				);
		}
		const { rows: checks } = await client.query(`
			SELECT conname FROM pg_constraint
			WHERE contype = 'c' AND conrelid = '"Report"'::regclass;
		`);
		if (checks.length > 0) {
			ok("applied.report_checks", `${checks.length} CHECK en Report.`);
		} else {
			warn(
				"applied.report_checks",
				"Sin CHECK en Report: se aplicó solo db push.",
			);
		}
	} catch (error) {
		warn(
			"applied.state",
			`Base no consultable: ${error.message.split("\n")[0]}`,
		);
	} finally {
		await client.end().catch(() => {});
	}
}

await declaredListMatches();
await appliedState();

// ── Salida ─────────────────────────────────────────────────────────────────
const icon = { ok: "✅", warn: "⚠️ ", fail: "❌" };
for (const f of findings) console.log(`${icon[f.level]} ${f.id}: ${f.msg}`);

const fails = findings.filter((f) => f.level === "fail");
console.log(
	`\n${fails.length === 0 ? "✅ control sin fallos" : `❌ ${fails.length} fallos de control`}`,
);
process.exit(fails.length === 0 ? 0 : 1);
