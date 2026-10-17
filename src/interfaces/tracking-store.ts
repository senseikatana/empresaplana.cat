export type ReportAction =
	| "passed"
	| "onTime"
	| "late"
	| "early"
	| "notPassed"
	| "cancelled";

/**
 * `stopId` es la clave de la parada dentro de la línea; `stopName` es el texto
 * visible, que viene del read model público y por tanto es desnormalizado.
 */
export interface BusReport {
	id: string;
	lineId: string;
	stopName: string;
	stopId?: string;
	action: ReportAction;
	minutesLate?: number;
	comment?: string;
	createdAt: string;
}

export interface BusStoreReview {
	id: string;
	lineId: string;
	stars: number;
	comment?: string;
	createdAt: string;
}

export type EscalationStatus = "open" | "acknowledged" | "resolved";

export interface Escalation {
	id: string;
	lineId: string;
	serviceDate?: string;
	threshold: number;
	negativeCount: number;
	status: EscalationStatus;
	/** Reportes que dispararon el escalado: la evidencia de la reclamación. */
	reportIds?: string[];
	createdAt: string;
}

export interface LineStats {
	lineId: string;
	/** Día de servicio evaluado, en formato YYYY-MM-DD. */
	serviceDate: string;
	total: number;
	negative: number;
	punctual: number;
	/**
	 * Porcentaje de reportes marcados como "a tiempo" sobre el total.
	 *
	 * OJO: es un indicador de OPPINIÓN, no una medición. Se calcula sobre lo que
	 * reporta la gente, así que un día con pocos reportes no significa puntual.
	 * La interfaz debe mostrar siempre el denominador junto al porcentaje.
	 */
	onTimeRate: number;
	threshold: number;
	remaining: number;
	escalated: boolean;
}

export interface AddReportInput {
	lineId: string;
	stopId?: string;
	stopName?: string;
	action: ReportAction;
	minutesLate?: number;
	comment?: string;
	reporterKey?: string;
	serviceDate?: Date;
}

export interface AddReviewInput {
	lineId: string;
	stars: number;
	comment?: string;
}
