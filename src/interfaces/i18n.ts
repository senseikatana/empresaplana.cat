import type { About } from "@/interfaces/about";
import type { HomeVariant1, HomeVariant2 } from "@/interfaces/booking";
import type { BusTracking } from "@/interfaces/bus-tracking";
import type { Common, Locale } from "@/interfaces/common";
import type { Discretionary } from "@/interfaces/discretionary";
import type { Home, HomeContent } from "@/interfaces/home";
import type { Legal } from "@/interfaces/legal";
import type { Locations, LocationsMobile } from "@/interfaces/locations";
import type { MobileApp } from "@/interfaces/mobile-app";
import type { Routes } from "@/interfaces/routes";
export interface I18nDictionary {
	management: {
		entities: Record<string, string>;
		fields: Record<string, string>;
		errors: Record<string, string>;
		common: Record<string, string>;
	};
	ai: {
		title: string;
		description: string;
		notice: string;
		prompt: string;
		submit: string;
		result: string;
		invalid: string;
		notConfigured: string;
		rateLimit: string;
		upstream: string;
	};
	meta: {
		title: string;
		description: string;
	};
	common: Common;
	home: Home;
	homeContent: HomeContent;
	routes: Routes;
	mobileApp: MobileApp;
	locations: Locations;
	homeVariant1: HomeVariant1;
	locationsMobile: LocationsMobile;
	homeVariant2: HomeVariant2;
	discretionary: Discretionary;
	about: About;
	legal: Legal;
	busTracking: BusTracking;
	app: Record<string, any>;
}
export interface LocalizedPageProps {
	locale: Locale;
}
export interface DictionaryProps {
	dict: I18nDictionary;
}
