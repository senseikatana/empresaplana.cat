import { expect, test } from "@playwright/test";

test("Spanish routes render without redirects and have public canonical URLs", async ({
	page,
}) => {
	const errors: string[] = [];
	page.on("pageerror", (error) => errors.push(error.message));
	for (const path of ["/", "/rutas-horarios", "/donde-estamos"]) {
		const response = await page.goto(path);
		expect(response?.status()).toBe(200);
		expect(response?.request().redirectedFrom()).toBeNull();
		await expect(page.locator("html")).toHaveAttribute("lang", "es");
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			`https://empresaplana.cat${path}`,
		);
		await expect(page.locator("main")).toBeVisible();
	}
	expect(errors).toEqual([]);
});

test("legacy Spanish and query-language URLs redirect correctly", async ({
	request,
}) => {
	for (const [path, location] of [
		["/es", "/"],
		["/es/rutas-horarios?filter=direct", "/rutas-horarios?filter=direct"],
		[
			"/rutas-horarios?lang=ca&filter=direct",
			"/ca/rutas-horarios?filter=direct",
		],
	]) {
		const response = await request.get(path, { maxRedirects: 0 });
		expect(response.status()).toBe(308);
		const target = new URL(response.headers().location, response.url());
		expect(target.pathname + target.search).toBe(location);
	}
});

test("other languages preserve their prefixes and canonical URLs", async ({
	page,
}) => {
	for (const locale of ["ca", "en", "fr"]) {
		expect((await page.goto(`/${locale}/rutas-horarios`))?.status()).toBe(200);
		await expect(page.locator("html")).toHaveAttribute("lang", locale);
		await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
			"href",
			`https://empresaplana.cat/${locale}/rutas-horarios`,
		);
	}
});

test("language dropdown switches the current page and closes with Escape", async ({
	page,
}) => {
	await page.goto("/rutas-horarios?filter=direct");
	const menu = page
		.locator("[data-header-menu]")
		.filter({ has: page.locator("a[hreflang]") })
		.first();
	await menu.locator("summary").click();
	await expect(menu.locator('a[hreflang="ca"]')).toBeVisible();
	await page.keyboard.press("Escape");
	await expect(menu).not.toHaveAttribute("open", "");
	await menu.locator("summary").click();
	await menu.locator('a[hreflang="ca"]').click();
	await expect(page).toHaveURL(/\/ca\/rutas-horarios\?filter=direct$/);
	await expect(page.locator("html")).toHaveAttribute("lang", "ca");
});

test("theme changes persist across reloads", async ({ page }) => {
	await page.goto("/");
	const menu = page
		.locator("[data-header-menu]")
		.filter({ has: page.locator("[data-theme-mode]") })
		.first();
	await menu.locator("summary").click();
	await menu.locator('[data-theme-mode="dark"]').click();
	await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
	await page.reload();
	await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
	await menu.locator("summary").click();
	await menu.locator('[data-theme-mode="light"]').click();
	await expect(page.locator("html")).toHaveCSS("color-scheme", "light");
});

test("protected pages and APIs reject anonymous access", async ({
	request,
}) => {
	for (const path of [
		"/dashboard/gestion",
		"/perfil",
		"/ca/dashboard/gestion",
	]) {
		const response = await request.get(path, { maxRedirects: 0 });
		expect(response.status()).toBe(302);
		const target = new URL(response.headers().location, response.url());
		expect(target.pathname).toBe(
			path.startsWith("/ca/") ? "/ca/dashboard/login" : "/dashboard/login",
		);
		expect(target.searchParams.get("redirect")).toBe(path);
	}
	for (const path of [
		"/api/auth/me",
		"/api/management/autobuses",
		"/api/chat",
	]) {
		const response = await request.get(path);
		expect(response.status()).toBe(401);
		expect(await response.json()).toMatchObject({ error: "unauthorized" });
	}
	expect((await request.get("/xx")).status()).toBe(404);
});

test("login displays rejected credentials and re-enables submission", async ({
	page,
}) => {
	await page.goto("/dashboard/login?redirect=%2Fdashboard%2Fgestion");
	await expect(page.locator("#login-form")).toBeVisible();
	let payload: unknown;
	await page.route("**/api/auth/login", async (route) => {
		payload = route.request().postDataJSON();
		await route.fulfill({
			status: 401,
			json: { error: "invalid_credentials" },
		});
	});
	await page.locator("#username").fill("e2e@example.invalid");
	await page.locator("#passkey").fill("invalid-e2e-password");
	await page.locator('#login-form button[type="submit"]').click();
	await expect(page.locator("#login-error")).toBeVisible();
	await expect(page.locator('#login-form button[type="submit"]')).toBeEnabled();
	expect(payload).toMatchObject({
		email: "e2e@example.invalid",
		locale: "es",
		redirect: "/dashboard/gestion",
	});
});

test("registration requires a valid email and a 12-character password", async ({
	page,
}) => {
	await page.goto("/dashboard/register");
	await page.locator("#name").fill("E2E");
	await page.locator("#email").fill("invalid");
	await page.locator("#passkey").fill("short");
	expect(
		await page
			.locator("#register-form")
			.evaluate((form) => (form as HTMLFormElement).checkValidity()),
	).toBe(false);
	await page.locator("#email").fill("e2e@example.invalid");
	await page.locator("#passkey").fill("valid-e2e-password");
	expect(
		await page
			.locator("#register-form")
			.evaluate((form) => (form as HTMLFormElement).checkValidity()),
	).toBe(true);
});
