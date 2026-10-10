export interface Stop {
	town: string;
	name: string;
	time: string;
	lat: number | null;
	lon: number | null;
}

export interface Departure {
	departureTime: string;
	arrivalTime: string;
}

export interface LineSummary {
	id: number;
	name: string;
	pdfUrl: string;
	origin: string;
	destination: string;
	stops: Stop[];
	departures: Departure[];
	departureCount: number;
	firstDeparture: string;
	lastDeparture: string;
}

export interface TransferOption {
	hub: string;
	firstLeg: LineSummary;
	secondLeg: LineSummary;
}

export interface ThroughPair {
	firstDeparture: string;
	arriveAtConnection: string;
	secondDeparture: string;
	arriveAtDestination: string;
	wait: string;
}

export interface ThroughJourney {
	connectionStop: string;
	waitWindow: number;
	firstLeg: LineSummary;
	secondLeg: LineSummary;
	pairs: ThroughPair[];
}

export interface SearchResults {
	direct: LineSummary[];
	transfers: TransferOption[];
	through: ThroughJourney[];
}
