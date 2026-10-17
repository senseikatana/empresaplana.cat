import "dotenv/config";
import type {
	AddReviewInput,
	BusReport,
	BusStoreReview,
	Escalation,
	LineStats,
	ReportAction,
} from "@/interfaces/tracking-store";
import { prisma } from "@/lib/db";
import type { PrismaClient } from "../../generated/prisma/client";

/**
 * Vocabulario canónico de acciones. Es `as const` para que `z.enum()` lo acepte
 * como tupla de literales y devuelva el tipo `ReportAction` en vez de `string`.
 * Fuente única: la API, la migración y el CHECK de Postgres dependen de estos
 * mismos seis valores.
 */
export const REPORT_ACTIONS = [
	"passed",
	"onTime",
	"late",
	"early",
	"notPassed",
	"cancelled",
] as const satisfies readonly ReportAction[];

export const NEGATIVE_ACTIONS: ReadonlySet<ReportAction> =
	new Set<ReportAction>(["late", "early", "notPassed", "cancelled"]);

export const ESCALATION_THRESHOLD = 3;

/** Tope de reportes por cliente y día de servicio. Frena el Filling de umbrales. */
export const MAX_REPORTS_PER_DAY = 12;

const MAX_COMMENT_LENGTH = 500;
const MAX_STOP_LENGTH = 200;
const MAX_MINUTES_LATE = 1440;
/** Ancho de la columna "lineId". Fuente única para API y store. */
export const MAX_LINE_ID = 40;

/** Violación de clave única (P2002). Se usa para tratar la carrera de escalados. */
function isUniqueViolation(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === "P2002"
	);
}

export type EscalationStatus = "open" | "acknowledged" | "resolved";

const NEGATIVE: ReportAction[] = [...NEGATIVE_ACTIONS];
const ALL_ACTIONS: ReportAction[] = [...REPORT_ACTIONS];

/** Zona horaria del servicio: un autobús de Tarragona no opera en UTC. */
const SERVICE_TZ = "Europe/Madrid";

/**
 * Inicio del día de servicio.
 *
 * La fecha sale del calendario de Madrid, así que un reporte hecho a las 00:30
 * en horario de verano pertenece al día de servicio de ese día y no al anterior.
 * La hora se fija en UTC y no en hora local: así el límite es el mismo instante
 * para todos los eventos de un mismo día de Madrid y no se desplaza con el
 * cambio de hora. Todo instante de ese día produce exactamente esta marca, que
 * es lo que exige que `serviceDate` (columna `DATE`) y la ventana
 * `windowStart`/`windowEnd` coincidan.
 */
export function startOfServiceDay(date: Date = new Date()): Date {
	const local = new Date(
		date.toLocaleString("en-US", { timeZone: SERVICE_TZ }),
	);
	return new Date(
		Date.UTC(local.getFullYear(), local.getMonth(), local.getDate(), 2, 0, 0),
	);
}

/** Ventana de un día de servicio. La comparten `windowStart`/`windowEnd`. */
export function serviceWindow(serviceDate: Date): { start: Date; end: Date } {
	const start = startOfServiceDay(serviceDate);
	return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function truncate(value: string, max: number): string | undefined {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed.slice(0, max) : undefined;
}

function toBusReport(row: {
	id: number;
	lineId: string;
	stop: string;
	stopId: string | null;
	action: string;
	minutesLate: number | null;
	comment: string | null;
	createdAt: Date;
}): BusReport {
	return {
		id: String(row.id),
		lineId: row.lineId,
		stopName: row.stop,
		stopId: row.stopId ?? undefined,
		action: row.action as ReportAction,
		minutesLate: row.minutesLate ?? undefined,
		comment: row.comment ?? undefined,
		createdAt: row.createdAt.toISOString(),
	};
}

/**
 * Estadísticas de una línea para un día de servicio concreto.
 *
 * El umbral se evalúa siempre contra la ventana del día, nunca contra el
 * histórico completo: así un mal día no escala la línea para siempre.
 */
export async function getLineStats(
	lineId: string,
	serviceDate: Date = startOfServiceDay(new Date()),
	client: PrismaClient = prisma(),
): Promise<LineStats> {
	const db = client;
	// `action` se acota en la propia consulta: una fila con un valor inesperado
	// queda fuera de numerador Y denominador, en lugar de falsear el porcentaje
	// sin dejar rastro.
	const scope = { lineId, serviceDate, action: { in: ALL_ACTIONS } };
	const [total, negative, punctual, openEscalation] = await Promise.all([
		db.report.count({ where: scope }),
		db.report.count({
			where: { ...scope, action: { in: NEGATIVE } },
		}),
		db.report.count({ where: { ...scope, action: "onTime" } }),
		db.escalation.findFirst({
			where: { lineId, serviceDate, status: { not: "resolved" } },
			orderBy: { id: "desc" },
		}),
	]);

	return {
		lineId,
		serviceDate: serviceDate.toISOString().slice(0, 10),
		total,
		negative,
		punctual,
		onTimeRate: total > 0 ? Math.round((punctual / total) * 100) : 100,
		threshold: ESCALATION_THRESHOLD,
		remaining: Math.max(0, ESCALATION_THRESHOLD - negative),
		escalated: openEscalation !== null,
	};
}

export async function listReports(
	lineId?: string,
	options: { serviceDate?: Date; limit?: number } = {},
): Promise<BusReport[]> {
	const rows = await prisma().report.findMany({
		where: {
			...(lineId ? { lineId } : {}),
			...(options.serviceDate ? { serviceDate: options.serviceDate } : {}),
		},
		orderBy: { id: "desc" },
		take: options.limit ?? 200,
	});
	return rows.map(toBusReport);
}

export async function listReviews(
	lineId?: string,
	options: { limit?: number } = {},
): Promise<BusStoreReview[]> {
	const rows = await prisma().review.findMany({
		where: lineId ? { lineId } : {},
		orderBy: { id: "desc" },
		take: options.limit ?? 200,
	});
	return rows.map((row) => ({
		id: String(row.id),
		lineId: row.lineId,
		stars: row.stars,
		comment: row.comment ?? undefined,
		createdAt: row.createdAt.toISOString(),
	}));
}

/**
 * Escalado sin resolver de una línea dentro de la ventana de servicio.
 *
 * Filtra por la ventana además de por `serviceDate`: son la misma condición
 * expresada en los dos sitios donde el esquema la guarda, y así los comentarios
 * del esquema describen comportamiento real en lugar de columnas decorativas.
 */
export async function getEscalation(
	lineId: string,
	serviceDate?: Date,
): Promise<Escalation | undefined> {
	const start = startOfServiceDay(serviceDate ?? new Date());
	const { start: windowStart, end: windowEnd } = serviceWindow(start);
	const row = await prisma().escalation.findFirst({
		where: {
			lineId,
			serviceDate: start,
			windowStart,
			windowEnd,
			status: { not: "resolved" },
		},
		orderBy: { id: "desc" },
		include: { reports: true },
	});
	if (!row) return undefined;
	return {
		id: String(row.id),
		lineId: row.lineId,
		serviceDate: row.serviceDate?.toISOString().slice(0, 10),
		threshold: row.threshold,
		negativeCount: row.negativeCount,
		status: row.status as EscalationStatus,
		reportIds: row.reports.map((report) => String(report.id)),
		createdAt: row.createdAt.toISOString(),
	};
}

export class DailyReportLimitError extends Error {
	constructor(readonly limit: number) {
		super("daily_report_limit_reached");
		this.name = "DailyReportLimitError";
	}
}

export async function addReport(input: {
	lineId: string;
	stopId?: string;
	stopName?: string;
	action: ReportAction;
	minutesLate?: number;
	comment?: string;
	reporterKey?: string;
	serviceDate?: Date;
}): Promise<{
	report: BusReport;
	stats: LineStats;
	escalation: Escalation | null;
}> {
	const db = prisma();
	const serviceDate = startOfServiceDay(input.serviceDate ?? new Date());
	const lineId = truncate(input.lineId, MAX_LINE_ID) as string;
	const { start: windowStart, end: windowEnd } = serviceWindow(serviceDate);
	const action = input.action;

	if (!REPORT_ACTIONS.includes(action)) {
		throw new TypeError("invalid_action");
	}

	const minutesLate =
		typeof input.minutesLate === "number" &&
		Number.isFinite(input.minutesLate) &&
		input.minutesLate >= 0
			? Math.min(MAX_MINUTES_LATE, Math.round(input.minutesLate))
			: undefined;

	if (input.reporterKey) {
		const todayCount = await db.report.count({
			where: {
				reporterKey: truncate(input.reporterKey, 64),
				serviceDate,
				source: "citizen",
			},
		});
		if (todayCount >= MAX_REPORTS_PER_DAY) {
			throw new DailyReportLimitError(MAX_REPORTS_PER_DAY);
		}
	}

	const row = await db.$transaction(
		async (tx) => {
			const created = await tx.report.create({
				data: {
					lineId,
					stop: truncate(input.stopName ?? "", MAX_STOP_LENGTH) ?? "",
					stopId: truncate(input.stopId ?? "", MAX_LINE_ID),
					action,
					minutesLate,
					comment: truncate(input.comment ?? "", MAX_COMMENT_LENGTH),
					source: "citizen",
					serviceDate,
					reporterKey: truncate(input.reporterKey ?? "", 64),
				},
			});

			// El conteo, el posible escalado y el alta del reporte van en la MISMA
			// transacción. Antes, un fallo al abrir el escalado devolvía 503 con el
			// reporte ya escrito: el cliente reintentaba y duplicaba la denuncia.
			const negative = await tx.report.count({
				where: { lineId, serviceDate, action: { in: NEGATIVE } },
			});

			const open = await tx.escalation.findFirst({
				where: {
					lineId,
					serviceDate,
					windowStart,
					windowEnd,
					status: { not: "resolved" },
				},
				orderBy: { id: "desc" },
				include: { reports: true },
			});

			// Solo se abre un escalado si no hay ya uno sin resolver para esta
			// ventana.
			if (negative >= ESCALATION_THRESHOLD && open === null) {
				const evidence = await tx.report.findMany({
					where: { lineId, serviceDate, action: { in: NEGATIVE } },
					orderBy: { id: "desc" },
					take: ESCALATION_THRESHOLD,
					select: { id: true },
				});

				try {
					await tx.escalation.create({
						data: {
							lineId,
							serviceDate,
							windowStart,
							windowEnd,
							threshold: ESCALATION_THRESHOLD,
							negativeCount: negative,
							status: "open",
							reports: {
								connect: evidence.map((report) => ({ id: report.id })),
							},
						},
					});
				} catch (createError) {
					// El índice único parcial "Escalation_open_window_unique" impide
					// dos escalados abiertos para la misma ventana. Bajo concurrencia
					// gana uno y el otro recibe la violación de clave: eso NO es un
					// fallo, es el resultado correcto. Cualquier otro error propaga.
					if (!isUniqueViolation(createError)) throw createError;
				}
			}

			return created;
		},
		{ isolationLevel: "Serializable" },
	);

	return {
		report: toBusReport(row),
		// Se relee fuera de la transacción para no alargar el lock, pero sobre el
		// mismo día de servicio, de modo que el resultado sea coherente.
		stats: await getLineStats(lineId, serviceDate),
		escalation: (await getEscalation(lineId, serviceDate)) ?? null,
	};
}

export async function addReview(
	input: AddReviewInput,
): Promise<BusStoreReview> {
	if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) {
		throw new TypeError("invalid_stars");
	}
	const row = await prisma().review.create({
		data: {
			lineId: input.lineId.slice(0, 40),
			stars: input.stars,
			comment: truncate(input.comment ?? "", MAX_COMMENT_LENGTH),
		},
	});
	return {
		id: String(row.id),
		lineId: row.lineId,
		stars: row.stars,
		comment: row.comment ?? undefined,
		createdAt: row.createdAt.toISOString(),
	};
}

/**
 * Cierra un escalado. Antes no existía ninguna forma de resetear el contador, y
 * una línea quedaba escalada para siempre.
 *
 * `resolvedBy` es la identidad de quien cierra, no texto libre del formulario:
 * esta tabla es la traza de auditoría que respalda la reclamación, y no puede
 * atribuirse a un nombre arbitrario.
 */
export async function resolveEscalation(
	id: string,
	resolvedBy: string,
	note?: string,
): Promise<Escalation | undefined> {
	const row = await prisma().escalation.update({
		where: { id: Number(id) },
		data: {
			status: "resolved",
			resolvedAt: new Date(),
			resolvedBy: truncate(resolvedBy, 120),
			...(note ? { note: truncate(note, 1000) } : {}),
		},
		include: { reports: true },
	});
	return {
		id: String(row.id),
		lineId: row.lineId,
		serviceDate: row.serviceDate?.toISOString().slice(0, 10),
		threshold: row.threshold,
		negativeCount: row.negativeCount,
		status: row.status as EscalationStatus,
		reportIds: row.reports.map((report) => String(report.id)),
		createdAt: row.createdAt.toISOString(),
	};
}

export interface PunctualityBucket {
	lineId: string;
	serviceDate: string;
	total: number;
	negative: number;
	punctual: number;
	onTimeRate: number;
	escalated: boolean;
}

/**
 * Serie de puntualidad por línea y día de servicio. Es el agregado que sostiene
 * la reclamación formal y el cuadro de mando público.
 *
 * La agregación ocurre EN LA BASE con `groupBy`. La versión anterior traía cada
 * fila a Node y sumaba en JavaScript: sin tope de lectura, sin índice útil y
 * sin caché, eso es un vector de amplificación contra una instancia de 512 MB
 * que escala a cero.
 */
export async function getPunctuality(
	options: { lineId?: string; days?: number } = {},
): Promise<PunctualityBucket[]> {
	const days = Math.min(Math.max(options.days ?? 30, 1), 180);
	const since = startOfServiceDay(
		new Date(Date.now() - (days - 1) * 86_400_000),
	);
	const scope = {
		...(options.lineId ? { lineId: options.lineId } : {}),
		serviceDate: { gte: since },
		action: { in: ALL_ACTIONS },
	};

	const grouped = await prisma().report.groupBy({
		by: ["lineId", "serviceDate", "action"],
		where: scope,
		_count: { _all: true },
	});

	// Solo se consulta el escalado si hay algo que agregar.
	const escalatedKeys = new Set<string>();
	if (grouped.length > 0) {
		const escalations = await prisma().escalation.findMany({
			where: {
				...(options.lineId ? { lineId: options.lineId } : {}),
				serviceDate: { gte: since },
				status: { not: "resolved" },
			},
			select: { lineId: true, serviceDate: true },
		});
		for (const row of escalations) {
			if (!row.serviceDate) continue;
			escalatedKeys.add(
				`${row.lineId}|${row.serviceDate.toISOString().slice(0, 10)}`,
			);
		}
	}

	const buckets = new Map<string, PunctualityBucket>();
	for (const row of grouped) {
		if (!row.serviceDate) continue;
		const day = row.serviceDate.toISOString().slice(0, 10);
		const key = `${row.lineId}|${day}`;
		let bucket = buckets.get(key);
		if (!bucket) {
			bucket = {
				lineId: row.lineId,
				serviceDate: day,
				total: 0,
				negative: 0,
				punctual: 0,
				onTimeRate: 100,
				escalated: escalatedKeys.has(key),
			};
			buckets.set(key, bucket);
		}
		bucket.total += row._count._all;
		if (NEGATIVE_ACTIONS.has(row.action as ReportAction)) {
			bucket.negative += row._count._all;
		}
		if (row.action === "onTime") bucket.punctual += row._count._all;
	}
	for (const bucket of buckets.values()) {
		bucket.onTimeRate =
			bucket.total > 0
				? Math.round((bucket.punctual / bucket.total) * 100)
				: 100;
	}

	return [...buckets.values()].sort((a, b) =>
		a.serviceDate === b.serviceDate
			? a.lineId.localeCompare(b.lineId)
			: a.serviceDate.localeCompare(b.serviceDate),
	);
}
