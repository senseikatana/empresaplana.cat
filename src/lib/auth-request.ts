import { z } from "zod";
import type { InsForgeError } from "@insforge/sdk";
import { ENV } from "@/config/config.env";
export const localeSchema = z.enum(["ca", "es", "en", "fr"]).default("es");
export function appOrigin(request: Request): string {
	return new URL(ENV.appUrl || request.url).origin;
}
export async function authBody(request: Request): Promise<unknown> {
	const origin = request.headers.get("Origin");
	if (origin && origin !== new URL(request.url).origin)
		throw new Error("invalid_origin");
	if (!request.headers.get("Content-Type")?.startsWith("application/json"))
		throw new Error("invalid_body");
	const text = await request.text();
	if (text.length > 16000) throw new Error("invalid_body");
	return JSON.parse(text);
}
export function authFailure(error: InsForgeError): Response {
	const status =
		error.statusCode >= 400 && error.statusCode <= 599 ? error.statusCode : 503;
	console.warn("InsForge auth request failed", { status, error: error.error });
	return Response.json(
		{ error: error.error, message: error.message },
		{ status },
	);
}
export function invalidAuthBody(error: unknown): Response {
	if (error instanceof z.ZodError)
		return Response.json(
			{
				error: "validation_failed",
				issues: error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			},
			{ status: 400 },
		);
	if (
		error instanceof SyntaxError ||
		(error instanceof Error &&
			["invalid_origin", "invalid_body"].includes(error.message))
	) {
		return Response.json(
			{ error: error instanceof SyntaxError ? "invalid_body" : error.message },
			{
				status:
					error instanceof Error && error.message === "invalid_origin"
						? 403
						: 400,
			},
		);
	}
	console.error(
		"Authentication request failed",
		error instanceof Error ? error.name : typeof error,
	);
	return Response.json({ error: "auth_unavailable" }, { status: 503 });
}
