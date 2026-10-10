import type { APIRoute } from "astro";
import { z } from "zod";
import { localizedPath } from "@/config/i18n/routing";
import { postLoginDestination } from "@/lib/acl";
import { resolveNativeUser } from "@/lib/auth";
import {
	appOrigin,
	authBody,
	authFailure,
	invalidAuthBody,
	localeSchema,
} from "@/lib/auth-request";
import { nativeAuthActions, nativeAuthClient } from "@/lib/insforge-auth";
export const prerender = false;
export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const input = z
			.object({
				email: z.email(),
				otp: z
					.string()
					.regex(/^\d{6}$/)
					.optional(),
				resend: z.boolean().default(false),
				locale: localeSchema,
			})
			.strict()
			.parse(await authBody(request));
		if (input.resend) {
			const { error } = await nativeAuthClient(
				cookies,
			).auth.resendVerificationEmail({
				email: input.email,
				redirectTo: new URL(
					localizedPath("/dashboard/login?verified=1", input.locale),
					appOrigin(request),
				).href,
			});
			return error ? authFailure(error) : Response.json({ ok: true });
		}
		if (!input.otp)
			return Response.json({ error: "invalid_body" }, { status: 400 });
		const { data, error } = await nativeAuthActions(cookies).verifyEmail({
			email: input.email,
			otp: input.otp,
		});
		if (error) return authFailure(error);
		if (!data?.user)
			return Response.json({ error: "auth_unavailable" }, { status: 503 });
		const user = await resolveNativeUser(data.user);
		return Response.json({
			next: postLoginDestination(user.role, null, input.locale),
		});
	} catch (error) {
		return invalidAuthBody(error);
	}
};
