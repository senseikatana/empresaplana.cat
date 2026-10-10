import type { APIRoute } from "astro";
import { z } from "zod";
import {
	appOrigin,
	authBody,
	authFailure,
	invalidAuthBody,
	localeSchema,
} from "@/lib/auth-request";
import { nativeAuthActions } from "@/lib/insforge-auth";
export const prerender = false;
export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const input = z
			.object({
				provider: z.enum(["google", "github"]),
				locale: localeSchema,
				redirect: z.string().max(2048).default(""),
			})
			.strict()
			.parse(await authBody(request));
		const { data, error } = await nativeAuthActions(cookies).signInWithOAuth(
			input.provider,
			{
				redirectTo: new URL("/api/auth/exchange", appOrigin(request)).href,
				skipBrowserRedirect: true,
			},
		);
		if (error) return authFailure(error);
		if (!data?.url || !data.codeVerifier)
			return Response.json({ error: "auth_unavailable" }, { status: 503 });
		const options = {
			path: "/",
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: "lax" as const,
			maxAge: 600,
		};
		cookies.set("insforge_code_verifier", data.codeVerifier, options);
		cookies.set("ep_oauth_locale", input.locale, options);
		cookies.set("ep_oauth_next", input.redirect, options);
		return Response.json({ url: data.url });
	} catch (error) {
		return invalidAuthBody(error);
	}
};
