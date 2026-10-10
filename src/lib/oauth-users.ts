import { prisma } from "@/lib/db";

export async function ensureOAuthUser(
	email: string,
	providerName: string | null | undefined,
	emailVerified = true,
	username?: string | null,
): Promise<number> {
	const normalizedEmail = email.trim().toLowerCase();
	const matches = await prisma().user.findMany({
		where: { email: { equals: normalizedEmail, mode: "insensitive" } },
		select: { id: true },
		take: 2,
	});

	if (matches.length > 1) {
		throw new Error("Multiple application users share this verified email.");
	}
	if (matches[0]) {
		if (emailVerified) {
			await prisma().user.update({
				where: { id: matches[0].id },
				data: { emailVerified: true },
			});
		}
		return matches[0].id;
	}

	const name =
		providerName?.trim().slice(0, 60) || normalizedEmail.split("@")[0];
	const prefix = username?.trim() ||
		normalizedEmail
			.split("@")[0]
			.replace(/[^a-z0-9_.]/gi, "")
			.slice(0, 8)
			.padEnd(3, "_") || "user";

	const requestedUsernameExists = username
		? await prisma().user.findUnique({
				where: { username },
				select: { id: true },
			})
		: null;
	if (requestedUsernameExists) {
		throw new Error("Username is already in use.");
	}

	for (let attempt = 0; attempt < (username ? 1 : 8); attempt += 1) {
		const generatedUsername = username
			? prefix
			: `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 6)}`.slice(0, 15);

		const user = await prisma().user.create({
			data: {
				username: generatedUsername,
				name,
				fullName: name.slice(0, 120),
				email: normalizedEmail,
				emailVerified,
				phone: "",
				role: "client",
			},
			select: { id: true },
		});
		return user.id;
	}

	throw new Error("Could not allocate a unique username for OAuth user.");
}
