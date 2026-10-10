import { Resend } from "resend";
import { ENV } from "@/config/config.env";

// Resend is a development-only tool; production auth emails use InsForge.
function devResend(): Resend {
	if (process.env.NODE_ENV === "production") {
		throw new Error("Resend is development-only and disabled in production.");
	}
	if (!ENV.resendApiKey) {
		throw new Error("RESEND_API_KEY must be configured.");
	}
	return new Resend(ENV.resendApiKey);
}

function unwrap<T>(
	result: { data: T | null; error: { message: string } | null },
	action: string,
): T {
	if (result.error)
		throw new Error(`Resend ${action} failed: ${result.error.message}`);
	if (!result.data) throw new Error(`Resend ${action} returned no data.`);
	return result.data;
}

export async function sendTransactionalEmail(input: {
	to: string;
	subject: string;
	text: string;
}): Promise<string> {
	if (!ENV.emailFrom) throw new Error("AUTH_EMAIL_FROM must be configured.");
	const data = unwrap(
		await devResend().emails.send({
			from: ENV.emailFrom,
			to: input.to,
			subject: input.subject,
			text: input.text,
		}),
		"send",
	);
	if (!data.id)
		throw new Error("Resend did not return an email delivery identifier.");
	return data.id;
}

export async function listSentEmails(limit = 20) {
	return unwrap(await devResend().emails.list({ limit }), "list").data;
}

export async function getSentEmail(id: string) {
	return unwrap(await devResend().emails.get(id), "get");
}

export async function cancelScheduledEmail(id: string) {
	return unwrap(await devResend().emails.cancel(id), "cancel");
}

export async function shareSentEmail(id: string) {
	return unwrap(await devResend().emails.share(id), "share").url;
}
