import type { MiddlewareHandler } from "astro";
import { getSession } from "@/lib/auth";
import { auth } from "@/config/auth.config";
import {
	getLocale,
	isLocale,
	localizedPath,
	unlocalizedPath,
} from "@/config/i18n/routing";
import { canAccessDashboardPath, dashboardHomeForRole } from "@/lib/acl";

/**
 * Astro middleware — locale redirects and dashboard/profile auth guard.
 *
 * Normalizes legacy UI URLs to /[lang] while leaving APIs and assets untouched.
 * Skips non-dashboard/profile routes and public auth paths
 * (login / register). If no valid session cookie is found, redirects
 * to /[lang]/dashboard/login with a `redirect` query param so the user lands
 * back where they intended after logging in.
 *
 * Per-page capability checks are NOT done here — each page handles
 * its own authorization via `hasCapability()` from `@/lib/acl`.
 */

const DASHBOARD_PATTERN = /^\/dashboard(?:\/|$)/;

const PUBLIC_AUTH_PATHS = new Set(["/dashboard/login", "/dashboard/register"]);

function isPublicAuthPath(pathname: string): boolean {
	return PUBLIC_AUTH_PATHS.has(pathname);
}

export const onRequest: MiddlewareHandler = async (context, next) => {
	const firstSegment = context.url.pathname.split("/")[1];
	const isApi = firstSegment === "api";
	const isAsset =
		firstSegment === "_astro" || /\.[^/]+$/.test(context.url.pathname);
	if (!isApi && !isAsset) {
		if (!isLocale(firstSegment)) {
			if (/^[a-z]{2}$/i.test(firstSegment)) {
				return new Response("Not found", { status: 404 });
			}
			return context.redirect(
				localizedPath(
					`${context.url.pathname}${context.url.search}`,
					getLocale(context.url.searchParams.get("lang")),
				),
				308,
			);
		}
		if (context.url.searchParams.has("lang")) {
			return context.redirect(
				localizedPath(
					`${context.url.pathname}${context.url.search}`,
					firstSegment,
				),
				308,
			);
		}
	}
	const betterAuthSession = await auth.api.getSession({
		headers: context.request.headers,
	});
	context.locals.user = betterAuthSession?.user ?? null;
	context.locals.session = betterAuthSession?.session ?? null;

	const pathname = unlocalizedPath(context.url.pathname);
	const locale = getLocale(firstSegment);
	const isProfilePath = pathname === "/perfil";

	if (!DASHBOARD_PATTERN.test(pathname) && !isProfilePath) {
		return next();
	}

	// Public auth routes are always accessible
	if (isPublicAuthPath(pathname)) {
		return next();
	}

	const session = await getSession(context.cookies);

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

	return next();
};
