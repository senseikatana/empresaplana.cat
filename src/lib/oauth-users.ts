import { prisma } from "@/lib/db";

export async function ensureOAuthUser(
	email: string,
	providerName: string | null | undefined,
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
		await prisma().user.update({
			where: { id: matches[0].id },
			data: { emailVerified: true },
		});
		return matches[0].id;
	}

	const name =
		providerName?.trim().slice(0, 60) || normalizedEmail.split("@")[0];
	const prefix =
		normalizedEmail
			.split("@")[0]
			.replace(/[^a-z0-9_.]/gi, "")
			.slice(0, 8)
			.padEnd(3, "_") || "user";

	for (let attempt = 0; attempt < 8; attempt += 1) {
		const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
		const username = `${prefix}_${suffix}`.slice(0, 15);
		const usernameExists = await prisma().user.findUnique({
			where: { username },
			select: { id: true },
		});
		if (usernameExists) continue;

		const user = await prisma().user.create({
			data: {
				username,
				name,
				fullName: name.slice(0, 120),
				email: normalizedEmail,
				emailVerified: true,
				phone: "",
				role: "client",
			},
			select: { id: true },
		});
		return user.id;
	}

	throw new Error("Could not allocate a unique username for OAuth user.");
}
