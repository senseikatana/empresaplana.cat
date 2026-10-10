export interface MobileAppHero {
	title: string;
}
export interface MobileAppSearch {
	fromPlaceholder: string;
	toPlaceholder: string;
	today: string;
	onePassenger: string;
	submit: string;
}
export interface MobileAppPopularCard {
	title: string;
	desc: string;
}
export interface MobileAppPopular {
	title: string;
	airport: { tag: string; title: string };
	excursions: MobileAppPopularCard;
	timetables: MobileAppPopularCard;
}
export interface MobileAppNav {
	search: string;
	tickets: string;
	stops: string;
	profile: string;
}
export interface MobileApp {
	title: string;
	hero: MobileAppHero;
	search: MobileAppSearch;
	popular: MobileAppPopular;
	nav: MobileAppNav;
}
