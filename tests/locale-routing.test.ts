import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	getLocale,
	isLocale,
	localizedPath,
	unlocalizedPath,
} from "../src/config/i18n/routing";

describe("locale filesystem routing", () => {
	it("creates home and nested paths for every supported locale", () => {
		assert.equal(localizedPath("/", "es"), "/");
		assert.equal(
			localizedPath("/dashboard/gestion/usuarios", "es"),
			"/dashboard/gestion/usuarios",
		);
		for (const locale of ["ca", "en", "fr"] as const) {
			assert.equal(localizedPath("/", locale), `/${locale}`);
			assert.equal(
				localizedPath("/dashboard/gestion/usuarios", locale),
				`/${locale}/dashboard/gestion/usuarios`,
			);
		}
	});
	it("switches the prefix while preserving unrelated queries and anchors", () => {
		assert.equal(
			localizedPath("/es/rutas-horarios?filter=direct&lang=en#results", "fr"),
			"/fr/rutas-horarios?filter=direct#results",
		);
		assert.equal(localizedPath("/es?lang=es", "en"), "/en");
		assert.equal(
			unlocalizedPath("/es/dashboard/gestion"),
			"/dashboard/gestion",
		);
		assert.equal(unlocalizedPath("/es"), "/");
		assert.equal(localizedPath("/ca/rutas-horarios?lang=ca#r", "es"), "/rutas-horarios#r");
		assert.equal(localizedPath("/en", "es"), "/");
	});
	it("leaves API, assets, external links and fragments unchanged", () => {
		for (const path of [
			"/api/auth/login",
			"/favicon.svg",
			"/images/bus.jpg",
			"https://example.com",
			"//example.com",
			"#results",
			"tel:+34977553680",
		]) {
			assert.equal(localizedPath(path, "es"), path);
		}
	});
	it("validates supported languages and falls back to Spanish by default", () => {
		assert.equal(isLocale("de"), false);
		assert.equal(getLocale("ES"), "es");
		assert.equal(getLocale("de"), "es");
	});
});
