export type SiteLocale = "es" | "ca" | "en";

export interface PopularLine {
	id: string;
	icon?: string;
	name: string;
	origin: string;
	destination: string;
	pdfUrls: Record<SiteLocale, string>;
}

export interface PopularLinesData {
	lines: PopularLine[];
}

export interface ServiceIntro {
	title: string;
	body: string;
}

export interface ServiceDetailLocale {
	title: string;
	tagline: string;
	sectionTitle: string;
	body: string[];
	imageUrl: string;
	imageCaption: string;
}

export interface ServiceDetail {
	id: number;
	slug: string;
	locales: Partial<Record<SiteLocale, ServiceDetailLocale>>;
}

export interface ServicesData {
	intro: Partial<Record<SiteLocale, ServiceIntro>>;
	services: ServiceDetail[];
}

export type QuoteFieldType =
	| "text"
	| "email"
	| "tel"
	| "textarea"
	| "date"
	| "time"
	| "number"
	| "select";
export type QuoteFieldGroup = "contact" | "service";

export interface QuoteField {
	id: string;
	type: QuoteFieldType;
	required: boolean;
	group: QuoteFieldGroup;
	labels: Record<SiteLocale, string>;
	placeholder?: Record<SiteLocale, string>;
}

export interface QuoteReason {
	id: string;
	labels: Record<SiteLocale, string>;
}

export interface QuoteForm {
	title: Record<SiteLocale, string>;
	sections: {
		contact: Record<SiteLocale, string>;
		service: Record<SiteLocale, string>;
	};
	fields: QuoteField[];
	reasons: QuoteReason[];
	consent: Record<SiteLocale, string>;
	submit: Record<SiteLocale, string>;
	success: Record<SiteLocale, string>;
}

export interface ContactPhone {
	id: string;
	phone: string;
	area: Record<SiteLocale, string>;
}

export interface Contact {
	whatsapp: string;
	generalPhone: string;
	phones: ContactPhone[];
	social: {
		facebook: string;
		twitter: string;
		youtube: string;
		instagram: string;
	};
	conventionBureaus: { catalunya: string; costaDaurada: string };
}
