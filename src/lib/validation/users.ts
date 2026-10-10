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
		.max(254, "Email demasiado largo")
		.transform((value) => value.toLowerCase()),
	passkey: z
		.string()
		.min(12, "La contraseña debe tener al menos 12 caracteres")
		.max(128, "La contraseña no puede superar 128 caracteres"),
	username: z
		.string()
		.trim()
		.regex(
			/^[a-zA-Z0-9_.]{3,15}$/,
			"Username: 3-15 caracteres (letras, números, punto o guion bajo)",
		),
	role: roleSchema.default("client"),
});

export const updateUserSchema = createUserSchema
	.partial()
	.refine((data) => Object.keys(data).length > 0, "Nada que actualizar");

export const loginSchema = z.object({
	username: z.string().trim().min(1, "Username obligatorio"),
	passkey: z.string().min(1, "Passkey obligatorio"),
	redirect: z.string().max(2048).optional(),
	locale: z.enum(["ca", "es", "en", "fr"]).optional(),
});

export function formatValidationError(error: z.ZodError) {
	return {
		error: "validation_failed",
		issues: error.issues.map((issue) => ({
			path: issue.path.join("."),
			message: issue.message,
		})),
	};
}
