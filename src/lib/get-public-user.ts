import type { PublicUser } from "@/interfaces/users";
import { prisma } from "@/lib/db";

export async function getPublicUser(userId: number): Promise<PublicUser | null> {
	const row = await prisma().user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			fullName: true,
			email: true,
			username: true,
			role: true,
			createdAt: true,
			phone: true,
		},
	});
	if (!row) return null;
	return { ...row, role: row.role as PublicUser["role"] } as PublicUser;
}
