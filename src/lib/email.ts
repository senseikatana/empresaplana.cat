import { Resend } from "resend";
import { ENV } from "@/config/config.env";

export async function sendTransactionalEmail(input: {
	to: string;
	subject: string;
	text: string;
}): Promise<void> {
	if (!ENV.resendApiKey || !ENV.emailFrom) {
		throw new Error("RESEND_API_KEY and AUTH_EMAIL_FROM must be configured.");
	}

	const resend = new Resend(ENV.resendApiKey);
	const { data, error } = await resend.emails.send({
		from: ENV.emailFrom,
		to: input.to,
		subject: input.subject,
		text: input.text,
	});
	if (error) {
		throw new Error(`Resend email delivery failed: ${error.message}`);
	}
	if (!data?.id) {
		throw new Error("Resend did not return an email delivery identifier.");
	}
}
