export interface BusTrackingActions {
	passed: string;
	passedTitle: string;
	onTime: string;
	late: string;
	early: string;
	notPassed: string;
	cancelled: string;
}
export interface BusTrackingFeedback {
	failure: string;
	thanks: string;
	thanksDesc: string;
	confirm: string;
	cancel: string;
	alreadyReported: string;
	selectIssue: string;
	minutesLate: string;
	comment: string;
	commentPlaceholder: string;
	send: string;
}
export interface BusTrackingAlerts {
	threshold: number;
	thresholdLabel: string;
	notifiedTitle: string;
	notifiedBody: string;
	coordinatorNotified: string;
	companyNotified: string;
	strikesLeft: string;
	resolved: string;
}
export interface BusTrackingStats {
	punctuality: string;
	reports: string;
	onTimeRate: string;
	sample: string;
	/** Aclara que el porcentaje es una opinión, no una medición de flota. */
	basis: string;
}
/** Cuadro de mando público de puntualidad agregada por línea y día. */
export interface BusTrackingPanel {
	title: string;
	subtitle: string;
	line: string;
	date: string;
	onTimeRate: string;
	negative: string;
	sample: string;
	/** Último día de servicio con reporte de esa línea, dentro de la ventana. */
	lastSeen: string;
	status: string;
	ok: string;
	escalated: string;
	empty: string;
	/** Aviso cuando la consulta falla. Diferente de `empty`: no es "no hay datos". */
	unavailable: string;
	disclaimer: string;
	/** Plantilla con marcador `{days}`. */
	window: string;
}
export interface BusTrackingStatus {
	pending: string;
	reported: string;
	reviewed: string;
	escalated: string;
}
export interface BusReview {
	title: string;
	subtitle: string;
	stars: string;
	driver: string;
	bus: string;
	punctuality: string;
	comfort: string;
	cleanliness: string;
	submit: string;
	thanks: string;
}
export interface BusTracking {
	title: string;
	subtitle: string;
	scheduled: string;
	stop: string;
	line: string;
	actions: BusTrackingActions;
	feedback: BusTrackingFeedback;
	alerts: BusTrackingAlerts;
	stats: BusTrackingStats;
	status: BusTrackingStatus;
	review: BusReview;
	panel: BusTrackingPanel;
}
