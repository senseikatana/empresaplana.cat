import type { MiddlewareHandler } from "astro";
import { getSession } from "@/lib/auth";
import {
	canAccessDashboardPath,
	dashboardHomeForRole,
} from "@/lib/acl";

/**
 * Astro middleware — dashboard auth guard.
 *
 * Wraps every request. Skips non-dashboard routes and public auth paths
 * (login / register). If no valid session cookie is found, redirects
 * to /dashboard/login with a `redirect` query param so the user lands
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
	const { pathname } = context.url;
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
			pathname + context.url.search + context.url.hash,
		);
		return context.redirect(`/dashboard/login?redirect=${redirect}`);
	}

	context.locals.session = session;

	if (
		DASHBOARD_PATTERN.test(pathname) &&
		!canAccessDashboardPath(session.role, pathname)
	) {
		return context.redirect(dashboardHomeForRole(session.role));
	}

	return next();
};
