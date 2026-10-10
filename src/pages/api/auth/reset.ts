import type { APIRoute } from "astro";
import { z } from "zod";
import { nativeAuthClient, clearNativeSession } from "@/lib/insforge-auth";
import { localizedPath } from "@/config/i18n/routing";
import { appOrigin, authBody, authFailure, invalidAuthBody, localeSchema } from "@/lib/auth-request";
export const prerender = false;
export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const input = z.object({ email: z.email(), otp: z.string().regex(/^\d{6}$/).optional(), newPassword: z.string().min(12).max(128).optional(), locale: localeSchema }).strict()
			.refine((value) => Boolean(value.otp) === Boolean(value.newPassword), "Code and password must be submitted together")
			.parse(await authBody(request));
		const client = nativeAuthClient(cookies);
		if (input.otp && input.newPassword) {
			const exchange = await client.auth.exchangeResetPasswordToken({ email: input.email, code: input.otp });
			if (exchange.error) return authFailure(exchange.error);
			if (!exchange.data?.token) return Response.json({ error: "auth_unavailable" }, { status: 503 });
			const { error } = await client.auth.resetPassword({ otp: exchange.data.token, newPassword: input.newPassword });
			if (!error) clearNativeSession(cookies);
			return error ? authFailure(error) : Response.json({ next: localizedPath("/dashboard/login", input.locale) });
		}
		const { error } = await client.auth.sendResetPasswordEmail({
			email: input.email, redirectTo: new URL(localizedPath("/dashboard/reset", input.locale), appOrigin(request)).href,
		});
		return error ? authFailure(error) : Response.json({ ok: true });
	} catch (error) { return invalidAuthBody(error); }
};
