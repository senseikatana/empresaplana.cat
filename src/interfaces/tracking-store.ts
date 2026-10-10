export type ReportAction =
	| "passed"
	| "onTime"
	| "late"
	| "early"
	| "notPassed"
	| "cancelled";

export interface BusReport {
	id: string;
	lineId: string;
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

export interface Escalation {
	id: string;
	lineId: string;
	threshold: number;
	createdAt: string;
	resolved?: boolean;
}

export interface LineStats {
	lineId: string;
	total: number;
	negative: number;
	onTimeRate: number;
	threshold: number;
	remaining: number;
	escalated: boolean;
}

export interface AddReportInput {
	lineId: string;
	stopId?: string;
	action: ReportAction;
	minutesLate?: number;
	comment?: string;
}

export interface AddReviewInput {
	lineId: string;
	stars: number;
	comment?: string;
}
