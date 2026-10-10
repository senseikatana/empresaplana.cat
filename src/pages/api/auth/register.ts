import type { APIRoute } from "astro";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { setSessionCookie, signSessionToken } from "@/lib/auth";
import { hashPasskey } from "@/lib/passkey";
import { publicUser } from "@/lib/users";
import { formatValidationError } from "@/lib/validation/users";

export const prerender = false;

const registerSchema = z.object({
	username: z
		.string()
		.trim()
		.regex(
			/^[a-zA-Z0-9_.]{3,15}$/,
			"Username: 3-15 caracteres (letras, números, punto o guion bajo)",
		),
	email: z
		.email("Email inválido")
		.max(254, "Email demasiado largo")
		.transform((v) => v.toLowerCase()),
	password: z
		.string()
		.regex(
			/^[A-Za-z0-9]{8}$/,
			"El passkey debe tener 8 caracteres alfanuméricos",
		),
	name: z
		.string()
		.trim()
		.min(1, "Nombre obligatorio")
		.max(60, "Máximo 60 caracteres"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = registerSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}
	const data = parsed.data;

	// Check existing user by email
	const existingEmail = await prisma().user.findUnique({
		where: { email: data.email },
	});
	if (existingEmail) {
		return Response.json(
			{ error: "conflict", field: "email" },
			{ status: 409 },
		);
	}

	// Check existing user by username
	const existingUsername = await prisma().user.findUnique({
		where: { username: data.username },
	});
	if (existingUsername) {
		return Response.json(
			{ error: "conflict", field: "username" },
			{ status: 409 },
		);
	}

	const created = await prisma().user.create({
		data: {
			name: data.name,
			fullName: data.name,
			email: data.email,
			username: data.username,
			passkey: hashPasskey(data.password),
			phone: "",
			role: "client",
		},
	});

	const token = await signSessionToken({
		id: created.id,
		username: created.username,
		role: created.role as "client",
	});
	setSessionCookie(cookies, token);

	return Response.json({ user: publicUser(created) }, { status: 201 });
};
