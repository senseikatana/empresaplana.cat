/**
 * ACL estilo WordPress: los roles son paquetes nombrados de **capabilities**
 * (permisos primitivos). La autorización pregunta por capability, no por rol:
 *
 *   // mal:  if (role === "admin" || role === "worker")
 *   // bien: if (hasCapability(role, "chat:staff"))
 *
 * Así, reasignar permisos entre roles no obliga a tocar los endpoints.
 *
 * Integración:
 * - Servidor: `can()` / `requireCapability()` en server API routes.
 * - Cliente: este módulo está en `lib/` para guards de ruta o visibilidad
 *   de UI cuando haga falta.
 *
 * Futuro (a lo WordPress): capabilities extra por usuario vía
 * `CapabilityOverrides` (allow/deny puntuales sobre lo que da su rol).
 */

export const ROLES = ["client", "worker", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const CAPABILITIES = [
	"dashboard:access",
	"profile:edit",
	"chat:access",
	"chat:create",
	"chat:staff",
	"fleet:view",
	"fleet:manage",
	"budgets:view",
	"budgets:manage",
	"content:manage",
	"users:manage",
	"system:manage",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

/** Mapeo rol → capabilities. admin recibe todas (equivale a manage_options). */
export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
	client: ["dashboard:access", "profile:edit", "chat:access", "chat:create"],
	worker: [
		"dashboard:access",
		"profile:edit",
		"chat:access",
		"chat:staff",
		"fleet:view",
		"budgets:view",
	],
	admin: CAPABILITIES,
};

/** Grants/denies puntuales por usuario (aún no persistidos; preparado). */
export interface CapabilityOverrides {
	allow?: readonly Capability[];
	deny?: readonly Capability[];
}

export function isRole(value: unknown): value is Role {
	return (
		typeof value === "string" && (ROLES as readonly string[]).includes(value)
	);
}

export function hasCapability(
	role: Role,
	capability: Capability,
	overrides?: CapabilityOverrides,
): boolean {
	// deny gana a allow; allow gana al rol (orden inspirado en WP).
	if (overrides?.deny?.includes(capability)) return false;
	if (overrides?.allow?.includes(capability)) return true;
	return ROLE_CAPABILITIES[role].includes(capability);
}

/** Capabilities efectivas de un rol (para mostrar en un futuro panel admin). */
export function capabilitiesForRole(role: Role): readonly Capability[] {
	return ROLE_CAPABILITIES[role];
}
