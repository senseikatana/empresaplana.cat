import type { APIRoute } from "astro";
import { getLocale, localizedPath } from "@/config/i18n/routing";
import { nativeAuthActions, clearNativeSession } from "@/lib/insforge-auth";
import { resolveNativeUser } from "@/lib/auth";
import { postLoginDestination } from "@/lib/acl";
export const prerender = false;
export const GET: APIRoute = async ({ cookies, url, redirect }) => {
	const locale = getLocale(cookies.get("ep_oauth_locale")?.value);
	const destination = cookies.get("ep_oauth_next")?.value;
	const verifier = cookies.get("insforge_code_verifier")?.value;
	const code = url.searchParams.get("insforge_code");
	for (const name of [
		"insforge_code_verifier",
		"ep_oauth_locale",
		"ep_oauth_next",
	])
		cookies.delete(name, { path: "/" });
	const failure = localizedPath("/dashboard/login?oauth=failed", locale);
	if (!code || !verifier || url.searchParams.has("error"))
		return redirect(failure, 302);
	try {
		const { data, error } = await nativeAuthActions(cookies).exchangeOAuthCode(
			code,
			verifier,
		);
		if (error || !data?.user) {
			console.warn("InsForge OAuth exchange rejected", error?.statusCode);
			clearNativeSession(cookies);
			return redirect(failure, 302);
		}
		const user = await resolveNativeUser(data.user);
		return redirect(postLoginDestination(user.role, destination, locale), 302);
	} catch (error) {
		console.error(
			"InsForge OAuth callback failed",
			error instanceof Error ? error.name : typeof error,
		);
		clearNativeSession(cookies);
		return redirect(failure, 302);
	}
};
