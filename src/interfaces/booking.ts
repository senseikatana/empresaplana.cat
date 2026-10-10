export interface BookingTabs {
	booking: string;
	destination: string;
	passengers: string;
}
export interface HomeVariant1Booking {
	tabs: BookingTabs;
	origin: string;
	destination: string;
	date: string;
	passengers: string;
	originPlaceholder: string;
	destinationPlaceholder: string;
	datePlaceholder: string;
	passengersPlaceholder: string;
	search: string;
}
export interface RouteCard {
	name: string;
	desc: string;
}
export interface HomeVariant1Routes {
	title: string;
	startingFrom: string;
	price: string;
	cards: { barcelona: RouteCard; salou: RouteCard; tarragona: RouteCard };
}
export interface HomeVariant1Footer {
	services: string;
	routesSchedules: string;
	privateServices: string;
	contact: string;
	social: string;
	legal: string;
}
export interface HomeVariant1 {
	title: string;
	booking: HomeVariant1Booking;
	routes: HomeVariant1Routes;
	footer: HomeVariant1Footer;
}
export interface HomeVariant2Brand {
	name: string;
	suffix: string;
}
export interface HomeVariant2Nav {
	routesSchedules: string;
	privateServices: string;
	aboutUs: string;
	contact: string;
}
export interface HomeVariant2Booking {
	tabs: BookingTabs;
	origin: string;
	destination: string;
	date: string;
	passengers: string;
	originPlaceholder: string;
	destinationPlaceholder: string;
	datePlaceholder: string;
	oneAdult: string;
	twoAdults: string;
	search: string;
}
export interface HomeVariant2Routes {
	title: string;
	startingFrom: string;
	price: string;
	cards: { barcelona: RouteCard; salou: RouteCard; tarragona: RouteCard };
}
export interface HomeVariant2Footer {
	services: string;
	contact: string;
	social: string;
	legal: string;
	email: string;
}
export interface HomeVariant2 {
	title: string;
	brand: HomeVariant2Brand;
	nav: HomeVariant2Nav;
	booking: HomeVariant2Booking;
	routes: HomeVariant2Routes;
	footer: HomeVariant2Footer;
}
