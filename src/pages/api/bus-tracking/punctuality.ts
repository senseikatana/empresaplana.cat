import type { APIRoute } from "astro";
import { z } from "zod";
import {
	clientKey,
	consume,
	READ_BUDGET,
	READ_WINDOW_MS,
	tooManyRequests,
} from "@/lib/rate-limit";
import { getPunctuality } from "@/lib/tracking-store";

export const prerender = false;

const MAX_DAYS = 90;
const DEFAULT_DAYS = 7;
const MAX_BUCKETS = 500;
const CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=600";

/**
 * Serie de puntualidad por línea y día de servicio.
 *
 * Público y de solo lectura: es la transparencia que sostiene la reclamación.
 * Tres defensas, porque es la lectura más cara del sistema y corre sin
 * autenticación: la agregación ocurre en la base (`groupBy`) en lugar de traer
 * filas a Node; el número de cubos está acotado; y hay presupuesto de
 * peticiones por cliente más caché HTTP.
 */
export const GET: APIRoute = async ({ request, url }) => {
	const parsed = z
		.object({
			lineId: z.string().trim().min(1).max(40).optional(),
			days: z.coerce.number().int().min(1).max(MAX_DAYS).default(DEFAULT_DAYS),
		})
		.safeParse({
			lineId: url.searchParams.get("lineId") ?? undefined,
			days: url.searchParams.get("days") ?? undefined,
		});

	if (!parsed.success) {
		return Response.json({ error: "invalid_query" }, { status: 400 });
	}

	const budget = consume(clientKey(request), READ_BUDGET, READ_WINDOW_MS);
	if (!budget.allowed) return tooManyRequests(budget);

	const { lineId, days } = parsed.data;
	const buckets = await getPunctuality({ lineId, days });

	return Response.json(
		{
			days,
			buckets: buckets.slice(0, MAX_BUCKETS),
			truncated: buckets.length > MAX_BUCKETS,
			// Se declara explícitamente que esto NO es una medición de flota.
			// El cliente está obligado a mostrarlo junto a los porcentajes.
			basis: "citizen-reports",
		},
		{ headers: { "Cache-Control": CACHE_CONTROL } },
	);
};
