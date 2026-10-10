import type { MiddlewareHandler } from "astro";
import { getSession } from "@/lib/auth";
import { updateSession } from "@insforge/sdk/ssr/middleware";
import { authCookieStore, insforgeConfig } from "@/lib/insforge-auth";
import {
	DEFAULT_LOCALE,
	getLocale,
	isLocale,
	localizedPath,
	unlocalizedPath,
} from "@/config/i18n/routing";
import { canAccessDashboardPath, dashboardHomeForRole } from "@/lib/acl";

/**
 * Astro middleware — locale redirects and dashboard/profile auth guard.
 *
 * The default locale (Spanish) is served without prefix: `/rutas-horarios` is
 * rewritten internally to `/es/rutas-horarios`, and `/es/...` redirects (308)
 * to the unprefixed URL. Other locales keep their prefix (/ca, /en, /fr).
 * APIs and assets are left untouched.
 * Skips non-dashboard/profile routes and public auth paths
 * (login / register). If no valid session cookie is found, redirects
 * to /[lang]/dashboard/login with a `redirect` query param so the user lands
 * back where they intended after logging in.
 *
 * Per-page capability checks are NOT done here — each page handles
 * its own authorization via `hasCapability()` from `@/lib/acl`.
 */

const DASHBOARD_PATTERN = /^\/dashboard(?:\/|$)/;

const PUBLIC_AUTH_PATHS = new Set([
	"/dashboard/login",
	"/dashboard/register",
	"/dashboard/verify",
	"/dashboard/reset",
]);

function isPublicAuthPath(pathname: string): boolean {
	return PUBLIC_AUTH_PATHS.has(pathname);
}

export const onRequest: MiddlewareHandler = async (context, next) => {
	let firstSegment = context.url.pathname.split("/")[1];
	let rewriteTo: string | undefined;
	const isApi = firstSegment === "api";
	const isAsset =
		firstSegment === "_astro" || /\.[^/]+$/.test(context.url.pathname);
	if (!isApi && !isAsset) {
		if (!isLocale(firstSegment)) {
			if (/^[a-z]{2}$/i.test(firstSegment)) {
				return new Response("Not found", { status: 404 });
			}
			if (context.url.searchParams.has("lang")) {
				return context.redirect(
					localizedPath(
						`${context.url.pathname}${context.url.search}`,
						getLocale(context.url.searchParams.get("lang")),
					),
					308,
				);
			}
			rewriteTo = `/${DEFAULT_LOCALE}${context.url.pathname === "/" ? "" : context.url.pathname}${context.url.search}`;
			firstSegment = DEFAULT_LOCALE;
		} else if (
			firstSegment === DEFAULT_LOCALE ||
			context.url.searchParams.has("lang")
		) {
			return context.redirect(
				localizedPath(
					`${context.url.pathname}${context.url.search}`,
					firstSegment,
				),
				308,
			);
		}
	}
	context.locals.user = null;
	if (!isAsset && context.url.pathname !== "/api/auth/refresh") {
		const store = authCookieStore(context.cookies);
		const result = await updateSession({
			...insforgeConfig(),
			requestCookies: store,
			responseCookies: store,
		});
		if (
			result.error &&
			result.error.statusCode !== 401 &&
			result.error.statusCode !== 403
		) {
			console.error("InsForge session refresh failed", result.error.statusCode);
			return new Response("Authentication service unavailable", {
				status: 503,
			});
		}
	}

	const proceed = () => (rewriteTo ? next(rewriteTo) : next());
	const pathname = unlocalizedPath(context.url.pathname);
	const locale = getLocale(firstSegment);
	const isProfilePath = pathname === "/perfil";

	if (!DASHBOARD_PATTERN.test(pathname) && !isProfilePath) {
		return proceed();
	}

	// Public auth routes are always accessible
	if (isPublicAuthPath(pathname)) {
		return proceed();
	}

	const session = await getSession(context.cookies);
	context.locals.user = session;

	if (!session) {
		const redirect = encodeURIComponent(
			context.url.pathname + context.url.search + context.url.hash,
		);
		return context.redirect(
			localizedPath(`/dashboard/login?redirect=${redirect}`, locale),
		);
	}

	if (
		DASHBOARD_PATTERN.test(pathname) &&
		!canAccessDashboardPath(session.role, pathname)
	) {
		return context.redirect(
			localizedPath(dashboardHomeForRole(session.role), locale),
		);
	}

	return proceed();
};
