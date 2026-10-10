import type { APIRoute } from "astro";
import { z } from "zod";
import { nativeAuthActions } from "@/lib/insforge-auth";
import { resolveNativeUser } from "@/lib/auth";
import { localizedPath } from "@/config/i18n/routing";
import {
	appOrigin,
	authBody,
	authFailure,
	invalidAuthBody,
	localeSchema,
} from "@/lib/auth-request";
export const prerender = false;
const schema = z
	.object({
		email: z.email().max(200),
		password: z.string().min(12).max(128),
		name: z.string().trim().min(1).max(60),
		locale: localeSchema,
	})
	.strict();
export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const input = schema.parse(await authBody(request));
		const { data, error } = await nativeAuthActions(cookies).signUp({
			email: input.email,
			password: input.password,
			name: input.name,
			redirectTo: new URL(
				localizedPath("/dashboard/login?verified=1", input.locale),
				appOrigin(request),
			).href,
		});
		if (error) return authFailure(error);
		if (!data)
			return Response.json({ error: "auth_unavailable" }, { status: 503 });
		if (data.requireEmailVerification)
			return Response.json(
				{
					requireEmailVerification: true,
					next: localizedPath(
						`/dashboard/verify?email=${encodeURIComponent(input.email)}`,
						input.locale,
					),
				},
				{ status: 201 },
			);
		if (!data.user)
			return Response.json({ error: "auth_unavailable" }, { status: 503 });
		const user = await resolveNativeUser(data.user);
		return Response.json(
			{ user, next: localizedPath("/perfil", input.locale) },
			{ status: 201 },
		);
	} catch (error) {
		return invalidAuthBody(error);
	}
};
