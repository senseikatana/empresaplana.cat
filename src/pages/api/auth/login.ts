import type { APIRoute } from "astro";
import { z } from "zod";
import { nativeAuthActions } from "@/lib/insforge-auth";
import { resolveNativeUser } from "@/lib/auth";
import { postLoginDestination } from "@/lib/acl";
import {
	authBody,
	authFailure,
	invalidAuthBody,
	localeSchema,
} from "@/lib/auth-request";
export const prerender = false;
const schema = z
	.object({
		email: z.email(),
		password: z.string().min(1).max(128),
		locale: localeSchema,
		redirect: z.string().max(2048).optional(),
	})
	.strict();
export const POST: APIRoute = async ({ request, cookies }) => {
	try {
		const input = schema.parse(await authBody(request));
		const { data, error } = await nativeAuthActions(cookies).signInWithPassword(
			{ email: input.email, password: input.password },
		);
		if (error) return authFailure(error);
		if (!data?.user)
			return Response.json({ error: "invalid_credentials" }, { status: 401 });
		const user = await resolveNativeUser(data.user);
		return Response.json({
			user,
			next: postLoginDestination(user.role, input.redirect, input.locale),
		});
	} catch (error) {
		return invalidAuthBody(error);
	}
};
