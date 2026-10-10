export interface DiscretionaryIntro {
	title: string;
	subtitle: string;
	linkLabel: string;
}
export interface DiscretionaryHero {
	title: string;
	subtitle: string;
	cta: string;
}
export interface DiscretionaryProfessionals {
	title: string;
	subtitle: string;
	bullets: string[];
}
export interface DiscretionaryServiceCard {
	tag?: string;
	title: string;
	desc: string;
}
export interface DiscretionaryServices {
	title: string;
	subtitle: string;
	cards: {
		transfers: DiscretionaryServiceCard;
		weddings: DiscretionaryServiceCard;
		adapted: DiscretionaryServiceCard;
		mice: DiscretionaryServiceCard;
		companies: DiscretionaryServiceCard;
		school: DiscretionaryServiceCard;
		endOfYearTrips: DiscretionaryServiceCard;
		touristTrips: DiscretionaryServiceCard;
		internationalExcursions: DiscretionaryServiceCard;
	};
	moreInfo: string;
	viewDetails: string;
}
export interface DiscretionaryCta {
	title: string;
	contactTitle: string;
	subtitle: string;
	areaTarragona: string;
	areaBarcelona: string;
	phoneTarragona: string;
	phoneBarcelona: string;
	submit: string;
}
export interface Discretionary {
	title: string;
	intro: DiscretionaryIntro;
	hero: DiscretionaryHero;
	professionals: DiscretionaryProfessionals;
	services: DiscretionaryServices;
	cta: DiscretionaryCta;
}
