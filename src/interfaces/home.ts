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
