import type { APIRoute } from "astro";
import { z } from "zod";
import { authorize } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatValidationError } from "@/lib/validation/users";

export const prerender = false;

const messageSchema = z.object({
	conversationId: z.number().int().positive().optional(),
	body: z.string().trim().min(1, "Mensaje vacío").max(2000),
});

// ── GET /api/chat ───────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ cookies }) => {
	const { user, response } = await authorize(cookies);
	if (response) return response;

	const isAdmin = user.role === "admin";

	// Staff sees all conversations; clients see only their own
	const conversations = isAdmin
		? await prisma().conversation.findMany({
				orderBy: { updatedAt: "desc" },
				include: { participants: true },
			})
		: await prisma().conversation.findMany({
				where: {
					participants: { some: { userId: user.id } },
				},
				orderBy: { updatedAt: "desc" },
				include: { participants: true },
			});

	// Collect unique userIds across all conversations to batch-fetch users
	const allParticipantUserIds = new Set<number>();
	for (const conv of conversations) {
		for (const p of conv.participants) {
			allParticipantUserIds.add(p.userId);
		}
	}

	const participantUsers =
		allParticipantUserIds.size > 0
			? await prisma().user.findMany({
					where: { id: { in: [...allParticipantUserIds] } },
					select: { id: true, username: true, name: true },
				})
			: [];
	const userMap = new Map(
		participantUsers.map((u) => [u.id, { username: u.username, name: u.name }]),
	);

	// Enrich with last message
	const result = await Promise.all(
		conversations.map(async (conv) => {
			const lastMessage = await prisma().message.findFirst({
				where: { conversationId: conv.id },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					body: true,
					senderId: true,
					senderRole: true,
					createdAt: true,
				},
			});

			const unreadCount = await prisma().message.count({
				where: {
					conversationId: conv.id,
					senderId: { not: user.id },
					readAt: null,
				},
			});

			return {
				...conv,
				participants: conv.participants.map((p) => {
					const info = userMap.get(p.userId);
					return {
						userId: p.userId,
						role: p.role,
						username: info?.username ?? "",
						name: info?.name ?? "",
					};
				}),
				lastMessage,
				unreadCount,
			};
		}),
	);

	return Response.json({ conversations: result });
};

// ── POST /api/chat ──────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request, cookies }) => {
	const { user, response } = await authorize(cookies);
	if (response) return response;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = messageSchema.safeParse(body);
	if (!parsed.success) {
		return Response.json(formatValidationError(parsed.error), { status: 400 });
	}

	const { conversationId, body: msgBody } = parsed.data;

	let conversation;
	if (conversationId) {
		// Verify participation
		const participant = await prisma().conversationParticipant.findUnique({
			where: {
				conversationId_userId: { conversationId, userId: user.id },
			},
		});
		if (!participant) {
			return Response.json(
				{ error: "not_participant" },
				{ status: 403 },
			);
		}
		conversation = await prisma().conversation.findUnique({
			where: { id: conversationId },
		});
	} else {
		// Create new conversation (client → staff)
		conversation = await prisma().conversation.create({
			data: {
				type: "support",
				participants: {
					create: [
						{ userId: user.id, role: user.role },
					],
				},
			},
			include: { participants: true },
		});
	}

	if (!conversation) {
		return Response.json({ error: "conversation_not_found" }, { status: 404 });
	}

	const message = await prisma().message.create({
		data: {
			conversationId: conversation.id,
			senderId: user.id,
			senderRole: user.role,
			body: msgBody,
		},
	});

	await prisma().conversation.update({
		where: { id: conversation.id },
		data: { updatedAt: new Date() },
	});

	return Response.json(
		{ message, conversationId: conversation.id },
		{ status: 201 },
	);
};
