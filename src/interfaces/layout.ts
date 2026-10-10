import type { Locale } from "@/interfaces/common";

export interface SiteInfoProps {
	title: string;
	description?: string;
	lang?: Locale;
	bodyClass?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	ogType?: string;
	canonicalUrl?: string;
	author?: string;
	keywords?: string[];
	themeColor?: string;
}
