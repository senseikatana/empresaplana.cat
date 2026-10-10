import type { MiddlewareHandler } from "astro";
import { getSession } from "@/lib/auth";

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

	// Only guard dashboard routes
	if (!DASHBOARD_PATTERN.test(pathname)) {
		return next();
	}

	// Public auth routes are always accessible
	if (isPublicAuthPath(pathname)) {
		return next();
	}

	// Check session
	const session = await getSession(context.cookies);

	if (!session) {
		const redirect = encodeURIComponent(pathname + context.url.search);
		return context.redirect(`/dashboard/login?redirect=${redirect}`);
	}

	// Attach session to locals so pages can access it without re-verifying
	context.locals.session = session;

	return next();
};
