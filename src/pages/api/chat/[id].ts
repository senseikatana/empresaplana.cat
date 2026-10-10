import type { APIRoute } from "astro";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const prerender = false;

// ── GET /api/chat/:id ───────────────────────────────────────────────────────
export const GET: APIRoute = async ({ params, cookies }) => {
	const { user, response } = await authorize(cookies);
	if (response) return response;

	const convId = Number(params.id);
	if (!Number.isInteger(convId) || convId <= 0) {
		return Response.json({ error: "invalid_id" }, { status: 400 });
	}

	// Verify participation (or admin)
	const participant = await prisma().conversationParticipant.findUnique({
		where: {
			conversationId_userId: { conversationId: convId, userId: user.id },
		},
	});
	if (!participant && user.role !== "admin") {
		return Response.json({ error: "not_participant" }, { status: 403 });
	}

	const messages = await prisma().message.findMany({
		where: { conversationId: convId },
		orderBy: { createdAt: "asc" },
		select: {
			id: true,
			conversationId: true,
			senderId: true,
			senderRole: true,
			body: true,
			readAt: true,
			createdAt: true,
		},
	});

	// Mark unread messages as read
	await prisma().message.updateMany({
		where: {
			conversationId: convId,
			senderId: { not: user.id },
			readAt: null,
		},
		data: { readAt: new Date() },
	});

	return Response.json({ messages });
};
