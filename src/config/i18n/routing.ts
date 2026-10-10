import type { Locale } from "@/interfaces/common";

export const DEFAULT_LOCALE: Locale = "ca";
export const LOCALES: readonly Locale[] = ["ca", "es", "en", "fr"];

export function isLocale(value: string | undefined | null): value is Locale {
	return LOCALES.some((locale) => locale === value);
}

export function getLocale(
	value: string | undefined | null,
	fallback: Locale = DEFAULT_LOCALE,
): Locale {
	const normalized = value?.toLowerCase();
	return isLocale(normalized) ? normalized : fallback;
}

export function unlocalizedPath(pathname: string): string {
	const [, language, ...segments] = pathname.split("/");
	return isLocale(language) ? `/${segments.join("/")}` : pathname;
}

export function localizedPath(path: string, locale: Locale): string {
	if (!path.startsWith("/") || path.startsWith("//")) return path;
	const url = new URL(path, "https://empresaplana.invalid");
	const pathname = unlocalizedPath(url.pathname);
	if (
		pathname === "/api" ||
		pathname.startsWith("/api/") ||
		/\.[^/]+$/.test(pathname)
	) {
		return path;
	}
	url.searchParams.delete("lang");
	return `/${locale}${pathname === "/" ? "" : pathname}${url.search}${url.hash}`;
}
