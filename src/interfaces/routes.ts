export interface RoutesHero {
	title: string;
	subtitle: string;
}
export interface RoutesSearch {
	title: string;
	originLabel: string;
	destinationLabel: string;
	dateLabel: string;
	timeLabel: string;
	originPlaceholder: string;
	destinationPlaceholder: string;
	anyTime: string;
	morning: string;
	afternoon: string;
	evening: string;
	direct: string;
	withTransfers: string;
	submit: string;
	disclaimer: string;
}

export interface RoutesResults {
	title: string;
	summaryLabel: string;
	directTitle: string;
	transfersTitle: string;
	hubLabel: string;
	legLabel: string;
	throughTitle: string;
	throughBadge: string;
	throughAtLabel: string;
	throughOriginHeader: string;
	throughConnectionHeader: string;
	throughWaitHeader: string;
	throughDepartHeader: string;
	throughDestinationHeader: string;
	firstDeparture: string;
	lastDeparture: string;
	departuresLabel: string;
	stopsLabel: string;
	downloadPdf: string;
	moreDepartures: string;
	emptyTitle: string;
	emptyBody: string;
	emptyHint: string;
	missingSelection: string;
	databaseError: string;
	searchingInfo: string;
}

export interface RoutesOrigins {
	barcelonaAirport: string;
	reusAirport: string;
	tarragona: string;
	salou: string;
	cambrils: string;
	portAventura: string;
}

export interface RoutesGroups {
	special: string;
	altCamp: string;
	baixCamp: string;
	baixEbre: string;
	baixPenedes: string;
	concaBarbera: string;
	montsia: string;
	priorat: string;
	riberaEbre: string;
	tarragones: string;
	terraAlta: string;
}

export interface RouteLineCard {
	route: string;
	stops: string;
	stopsNumber?: number | string;
	routeOrigin?: string;
	routeDestination?: string;
}

export interface RoutesLines {
	title: string;
	subtitle: string;
	downloadPdf: string;
	viewAll: string;
	cards: {
		barcelonaAirport: RouteLineCard;
		tarragonaBarcelona: RouteLineCard;
		costaDorada: RouteLineCard;
		reusSalou: RouteLineCard;
		estacioCamp: RouteLineCard;
		penedes: RouteLineCard;
	};
}

export interface RoutesBanner {
	title: string;
	body: string;
}

export interface Routes {
	title: string;
	hero: RoutesHero;
	search: RoutesSearch;
	results: RoutesResults;
	origins: RoutesOrigins;
	groups: RoutesGroups;
	lines: RoutesLines;
	banner: RoutesBanner;
}
