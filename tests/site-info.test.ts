import { describe, expect, test } from "bun:test";
import {
	getCanonicalUrl,
	getSiteInfo,
	SITE_INFO,
} from "../src/config/site-info";

describe("canonical URLs", () => {
	test("removes the internal Spanish prefix from rewritten routes", () => {
		for (const path of ["/", "/rutas-horarios", "/dashboard/login"]) {
			const internalPath = path === "/" ? "/es" : `/es${path}`;
			expect(getCanonicalUrl(internalPath)).toBe(`${SITE_INFO.baseUrl}${path}`);
			expect(getCanonicalUrl(path)).toBe(`${SITE_INFO.baseUrl}${path}`);
		}
	});

	test("preserves the other language prefixes", () => {
		for (const locale of ["ca", "en", "fr"]) {
			const path = `/${locale}/rutas-horarios`;
			expect(getCanonicalUrl(path)).toBe(`${SITE_INFO.baseUrl}${path}`);
		}
	});

	test("normalizes relative paths without stripping non-locale segments", () => {
		expect(getCanonicalUrl("rutas-horarios")).toBe(
			`${SITE_INFO.baseUrl}/rutas-horarios`,
		);
		expect(getCanonicalUrl("/estaciones")).toBe(
			`${SITE_INFO.baseUrl}/estaciones`,
		);
	});

	test("defaults page metadata to Spanish and respects overrides", () => {
		expect(getSiteInfo().lang).toBe("es");
		expect(getSiteInfo({ lang: "ca", title: "Test" })).toMatchObject({
			lang: "ca",
			title: "Test",
		});
	});
});
