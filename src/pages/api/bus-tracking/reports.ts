import type { APIRoute } from "astro";
import { z } from "zod";
import {
	clientKey,
	consume,
	DEFAULT_BURST,
	DEFAULT_BURST_WINDOW_MS,
	READ_BUDGET,
	READ_WINDOW_MS,
	tooManyRequests,
} from "@/lib/rate-limit";
import {
	addReport,
	DailyReportLimitError,
	getEscalation,
	getLineStats,
	listReports,
	MAX_LINE_ID,
	MAX_REPORTS_PER_DAY,
	REPORT_ACTIONS,
	startOfServiceDay,
} from "@/lib/tracking-store";

export const prerender = false;

const MAX_LIST_LIMIT = 200;

const createSchema = z
	.object({
		lineId: z.string().trim().min(1).max(MAX_LINE_ID),
		stopId: z.string().trim().min(1).max(MAX_LINE_ID).optional(),
		stopName: z.string().trim().max(200).optional(),
		action: z.enum(REPORT_ACTIONS),
		minutesLate: z.number().int().min(0).max(1440).optional(),
		comment: z.string().trim().max(500).optional(),
	})
	.strict();

const dateParam = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/)
	.optional()
	.transform((value) =>
		value ? new Date(`${value}T00:00:00.000Z`) : undefined,
	);

// ── GET /api/bus-tracking/reports ───────────────────────────────────────────
// Lista acotada y estadísticas de una línea. El límite es obligatorio: sin él
// este endpoint creaba una respuesta sin tope a partir de datos de terceros.
export const GET: APIRoute = async ({ request, url }) => {
	const budget = consume(clientKey(request), READ_BUDGET, READ_WINDOW_MS);
	if (!budget.allowed) return tooManyRequests(budget);

	const parsed = z
		.object({
			lineId: z.string().trim().min(1).max(MAX_LINE_ID).optional(),
			serviceDate: dateParam,
			limit: z.coerce.number().int().min(1).max(MAX_LIST_LIMIT).default(50),
		})
		.safeParse({
			lineId: url.searchParams.get("lineId") ?? undefined,
			serviceDate: url.searchParams.get("serviceDate") ?? undefined,
			limit: url.searchParams.get("limit") ?? undefined,
		});

	if (!parsed.success) {
		return Response.json({ error: "invalid_query" }, { status: 400 });
	}

	const { lineId, serviceDate, limit } = parsed.data;
	// El día por defecto se resuelve UNA vez y se pasa explícito a las dos lecturas.
	// Antes `stats` era de hoy mientras `escalation` lacked el filtro de fecha y
	// devolvía el escalado abierto más antiguo de la historia junto a las
	// estadísticas de hoy.
	const day = serviceDate ?? startOfServiceDay(new Date());

	return Response.json({
		reports: await listReports(lineId, { serviceDate: serviceDate, limit }),
		stats: lineId ? await getLineStats(lineId, day) : null,
		escalation: lineId ? ((await getEscalation(lineId, day)) ?? null) : null,
	});
};

// ── POST /api/bus-tracking/reports ──────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
	if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
		return Response.json({ error: "invalid_content_type" }, { status: 415 });
	}

	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = createSchema.safeParse(raw);
	if (!parsed.success) {
		return Response.json(
			{
				error: "validation_failed",
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			},
			{ status: 400 },
		);
	}

	const reporterKey = clientKey(request);

	const burst = consume(reporterKey, DEFAULT_BURST, DEFAULT_BURST_WINDOW_MS);
	if (!burst.allowed) return tooManyRequests(burst);

	const input = parsed.data;

	try {
		const result = await addReport({ ...input, reporterKey });
		return Response.json(
			{ ...result, dailyLimit: MAX_REPORTS_PER_DAY },
			{
				status: 201,
				headers: { "X-RateLimit-Remaining": String(burst.remaining) },
			},
		);
	} catch (error) {
		if (error instanceof DailyReportLimitError) {
			return Response.json(
				{ error: "daily_report_limit", limit: error.limit },
				{ status: 429 },
			);
		}
		if (error instanceof TypeError && error.message === "invalid_action") {
			return Response.json({ error: "invalid_action" }, { status: 400 });
		}
		console.error("Unable to store bus tracking report", error);
		return Response.json({ error: "tracking_unavailable" }, { status: 503 });
	}
};
