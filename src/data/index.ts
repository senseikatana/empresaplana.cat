import type {
	Contact,
	PopularLine,
	QuoteForm,
	ServiceDetail,
	ServiceIntro,
	ServicesData,
	SiteLocale,
} from "@/data/types";
import contactData from "./contact.json";
import popularLinesData from "./popular-lines.json";
import quoteFormData from "./quote-form.json";
import servicesData from "./services.json";

export type {
	Contact,
	ContactPhone,
	PopularLine,
	PopularLinesData,
	QuoteField,
	QuoteFieldGroup,
	QuoteFieldType,
	QuoteForm,
	QuoteReason,
	ServiceDetail,
	ServiceDetailLocale,
	ServiceIntro,
	ServicesData,
	SiteLocale,
} from "@/data/types";

export const POPULAR_LINES: PopularLine[] = popularLinesData.lines;

export const SERVICES: ServiceDetail[] = servicesData.services;

export const SERVICES_INTRO: Partial<Record<SiteLocale, ServiceIntro>> =
	servicesData.intro;

export const SERVICES_DATA: ServicesData = servicesData;

export const QUOTE_FORM: QuoteForm = quoteFormData as unknown as QuoteForm;

export const CONTACT: Contact = contactData;
