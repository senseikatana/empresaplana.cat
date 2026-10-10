import { z } from "zod";

const USUARIO_ROLES = ["client", "worker", "manager", "admin"] as const;

export const roleSchema = z.enum(USUARIO_ROLES);

export const createUserSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Nombre obligatorio")
		.max(60, "Máximo 60 caracteres"),
	fullName: z
		.string()
		.trim()
		.min(1, "Nombre completo obligatorio")
		.max(30, "Máximo 30 caracteres"),
	phone: z
		.string()
		.trim()
		.regex(/^\+?[0-9\s-]{6,20}$/, "Teléfono inválido"),
	email: z
		.email("Email inválido")
		.max(200, "Email demasiado largo")
		.transform((value) => value.toLowerCase()),
	username: z
		.string()
		.trim()
		.regex(
			/^[a-zA-Z0-9_.]{3,15}$/,
			"Username: 3-15 caracteres (letras, números, punto o guion bajo)",
		),
	role: roleSchema.default("client"),
}).strict();

export const updateUserSchema = createUserSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, "Nada que actualizar");

export function formatValidationError(error: z.ZodError) {
	return {
		error: "validation_failed",
		issues: error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})),
	};
}
