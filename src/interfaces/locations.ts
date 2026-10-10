export interface LocationsHero {
	title: string;
	subtitle: string;
}
export interface LocationsCentral {
	title: string;
	tag: string;
	address1: string;
	address2: string;
	city: string;
}
export interface LocationBase {
	name: string;
	address: string;
	city: string;
}
export interface LocationsDelegations {
	title: string;
	label: string;
	bases: {
		tarragona: LocationBase;
		reus: LocationBase;
		garraf: LocationBase;
		calafell: LocationBase;
		barcelona: LocationBase;
		hospitalet: LocationBase;
	};
}
export interface Locations {
	title: string;
	hero: LocationsHero;
	mapBadge: string;
	central: LocationsCentral;
	delegations: LocationsDelegations;
	experience: { title: string; subtitle: string };
}
export interface LocationMobileBase {
	name: string;
	area: string;
}
export interface LocationsMobileDelegations {
	title: string;
	bases: {
		tarragona: LocationMobileBase;
		reus: LocationMobileBase;
		garraf: LocationMobileBase;
		calafell: LocationMobileBase;
		barcelona: LocationMobileBase;
		hospitalet: LocationMobileBase;
	};
}
export interface LocationsMobileNav {
	routes: string;
	tickets: string;
	locations: string;
	services: string;
}
export interface LocationsMobile {
	title: string;
	appbar: { title: string };
	hero: { title: string };
	central: { title: string; address: string };
	delegations: LocationsMobileDelegations;
	nav: LocationsMobileNav;
}
