export interface HomeScreen {
	label: string;
	desc: string;
}
export interface HomeScreens {
	routes: HomeScreen;
	locations: HomeScreen;
	discretionary: HomeScreen;
	variant1: HomeScreen;
	variant2: HomeScreen;
	mobile: HomeScreen;
	locationsMobile: HomeScreen;
	tracking: HomeScreen;
}
export interface Home {
	title: string;
	subtitle: string;
	screens: HomeScreens;
}

export interface HomeValueProp {
	title: string;
	desc: string;
}

export interface HomeContent {
	valueProps: {
		title: string;
		items: Record<string, HomeValueProp>;
	};
	airportPromo: {
		tag: string;
		title: string;
		subtitle: string;
		cta: string;
	};
	coachRental: {
		title: string;
		subtitle: string;
		quoteCta: string;
	};
	fundedBy: {
		title: string;
		items: string[];
	};
}
