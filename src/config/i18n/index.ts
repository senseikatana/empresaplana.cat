import type { I18nDictionary, Locale } from "@/interfaces";
import ca from "./ca.json";
import en from "./en.json";
import es from "./es.json";
import fr from "./fr.json";

export type {
	DictionaryProps,
	I18nDictionary,
	Locale,
	LocalizedPageProps,
} from "@/interfaces";

export {
	DEFAULT_LOCALE,
	LOCALES,
	isLocale,
	getLocale,
	localizedPath,
	unlocalizedPath,
} from "./routing";

const dictionaries: Record<Locale, I18nDictionary> = { ca, en, es, fr };

export function getDictionary(locale: Locale): I18nDictionary {
	return dictionaries[locale];
}

export type DictionaryKey = string;

export function t(locale: Locale, key: DictionaryKey): string {
	const parts = key.split(".");
	let node: unknown = dictionaries[locale];

	for (const part of parts) {
		if (
			node &&
			typeof node === "object" &&
			part in (node as Record<string, unknown>)
		) {
			node = (node as Record<string, unknown>)[part];
		} else {
			return key;
		}
	}

	return typeof node === "string" ? node : key;
}
