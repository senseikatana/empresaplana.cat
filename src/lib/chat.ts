import type { SessionUser } from "@/interfaces/auth";
import { prisma } from "@/lib/db";

/**
 * Check if a session user can access a given conversation.
 * Admin can access all; others must be a participant.
 */
export async function canAccessConversation(
	session: SessionUser,
	conversationId: number,
): Promise<boolean> {
	if (session.role === "admin") return true;

	const participant = await prisma().conversationParticipant.findUnique({
		where: {
			conversationId_userId: { conversationId, userId: session.id },
		},
	});
	return participant !== null;
}

/**
 * Ensure the user is a participant (or admin). Throws 403-like error if not.
 */
export async function ensureParticipant(
	session: SessionUser,
	conversationId: number,
): Promise<void> {
	const allowed = await canAccessConversation(session, conversationId);
	if (!allowed) {
		throw new Error("not_participant");
	}
}

/**
 * Create a message in a conversation and update the conversation timestamp.
 */
export async function createMessage(
	session: SessionUser,
	conversationId: number,
	body: string,
) {
	const message = await prisma().message.create({
		data: {
			conversationId,
			senderId: session.id,
			senderRole: session.role,
			body,
		},
	});

	await prisma().conversation.update({
		where: { id: conversationId },
		data: { updatedAt: new Date() },
	});

	return message;
}
