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

import {
	DEFAULT_LOCALE,
	localizedPath,
	unlocalizedPath,
} from "@/config/i18n/routing";
import type { Locale } from "@/interfaces/common";

export const ROLES = ["client", "worker", "manager", "admin"] as const;
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
	manager: [
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

export function isCompanyRole(role: unknown): role is "manager" | "admin" {
	return role === "manager" || role === "admin";
}

const ADMIN_ONLY_PATHS = [
	"/dashboard/gestion/usuarios",
	"/dashboard/gestion/integraciones",
];

/**
 * Secciones que tienen un dueño: el rol indicado y solo él.
 *
 * Antes esta tabla se usaba al revés, para *negar*: `ROLE_SPECIFIC_PATHS`
 * devolvía `false` para todo el mundo, así que `/dashboard/cliente` y
 * `/dashboard/trabajador` no las alcanzaba ningún rol. Junto con el gate
 * `isCompanyRole` de entrada, dejaba las cuatro páginas de empleado como
 * rutas muertas.
 */
const ROLE_OWNED_SECTIONS: ReadonlyArray<readonly [string, Role]> = [
	["/dashboard/cliente", "client"],
	["/dashboard/trabajador", "worker"],
];

/**
 * Secciones abiertas a cualquier rol con sesión.
 *
 * El chat estaba aquí porerror: los cuatro roles reciben `chat:access` y
 * `chat:create` en `ROLE_CAPABILITIES`, y `mensajes.astro` solo pide sesión, así
 * que la capability era inalcanzable para cliente y empleado.
 */
const SHARED_SECTIONS = ["/dashboard/mensajes"];

export function canAccessDashboardPath(
	role: unknown,
	pathname: string,
): boolean {
	pathname = unlocalizedPath(pathname);
	if (!isRole(role)) return false;
	if (pathname !== "/dashboard" && !pathname.startsWith("/dashboard/"))
		return false;

	// La raíz no decide nada: `dashboard/index.astro` redirige según el rol.
	// Dejarla pasar evita un doble redirect cuando el rol no tiene sección.
	if (pathname === "/dashboard") return true;

	// Sección común a los cuatro roles.
	if (
		SHARED_SECTIONS.some(
			(path) => pathname === path || pathname.startsWith(`${path}/`),
		)
	) {
		return true;
	}

	const owned = ROLE_OWNED_SECTIONS.find(
		([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
	// Sección con dueño: ni managers ni admins entran en la de otro rol.
	if (owned) return owned[1] === role;

	// El resto del dashboard (gestión, mensajes, IA) es de la compañía.
	if (!isCompanyRole(role)) return false;

	if (
		role !== "admin" &&
		ADMIN_ONLY_PATHS.some(
			(path) => pathname === path || pathname.startsWith(`${path}/`),
		)
	) {
		return false;
	}
	return true;
}

export function dashboardHomeForRole(role: Role): string {
	// Cada rol aterriza en su propia sección: cliente y empleado en su mini
	// dashboard, compañía en gestión.
	if (role === "client") return "/dashboard/cliente";
	if (role === "worker") return "/dashboard/trabajador";
	return "/dashboard/gestion";
}

export function postLoginDestination(
	role: Role,
	requestedPath: string | null | undefined,
	locale: Locale = DEFAULT_LOCALE,
): string {
	if (!isCompanyRole(role) || !requestedPath) {
		return localizedPath(dashboardHomeForRole(role), locale);
	}

	try {
		const target = new URL(requestedPath, "https://empresaplana.invalid");
		if (
			target.origin === "https://empresaplana.invalid" &&
			canAccessDashboardPath(role, target.pathname)
		) {
			return localizedPath(
				`${target.pathname}${target.search}${target.hash}`,
				locale,
			);
		}
	} catch {
		return localizedPath(dashboardHomeForRole(role), locale);
	}

	return localizedPath(dashboardHomeForRole(role), locale);
}
