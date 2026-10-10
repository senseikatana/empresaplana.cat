import { z } from "zod";
import { ENV } from "@/config/config.env";
import { sendTransactionalEmail } from "@/lib/email";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--dry-run")) {
	throw new Error("Usage: bun run email:test [--dry-run]");
}
const recipient = z.email().parse(process.env.RESEND_TEST_TO);
if (args.includes("--dry-run")) {
	console.log({
		to: recipient,
		from: ENV.emailFrom,
		apiKeyConfigured: Boolean(ENV.resendApiKey),
	});
} else {
	const id = await sendTransactionalEmail({
		to: recipient,
		subject: "Prueba de correo | Empresa Plana",
		text: "Este correo es una prueba del envío transaccional de Empresa Plana con Resend. Los correos de autenticación se gestionan en InsForge.",
	});
	console.log(`Resend accepted the test email (${id}). Inspect it with: bun run email:manage get ${id}`);
}
