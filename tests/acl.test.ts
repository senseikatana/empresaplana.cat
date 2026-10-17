import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	canAccessDashboardPath,
	dashboardHomeForRole,
	isCompanyRole,
	postLoginDestination,
	ROLES,
} from "../src/lib/acl";

describe("company dashboard access", () => {
	it("only company managers and admins qualify for the dashboard", () => {
		assert.equal(isCompanyRole("manager"), true);
		assert.equal(isCompanyRole("admin"), true);
		assert.equal(isCompanyRole("client"), false);
		assert.equal(isCompanyRole("worker"), false);
	});

	it("managers are blocked from user management and integrations", () => {
		assert.equal(canAccessDashboardPath("manager", "/dashboard/gestion"), true);
		assert.equal(
			canAccessDashboardPath("manager", "/dashboard/gestion/mapa"),
			true,
		);
		assert.equal(
			canAccessDashboardPath("manager", "/dashboard/gestion/usuarios"),
			false,
		);
		assert.equal(
			canAccessDashboardPath("manager", "/dashboard/gestion/integraciones"),
			false,
		);
		assert.equal(
			canAccessDashboardPath("admin", "/dashboard/gestion/usuarios"),
			true,
		);
	});

	it("non-company roles cannot access company dashboard routes", () => {
		assert.equal(canAccessDashboardPath("client", "/dashboard/gestion"), false);
		assert.equal(
			canAccessDashboardPath("worker", "/dashboard/gestion/rutas"),
			false,
		);
		assert.equal(canAccessDashboardPath("admin", "/dashboard/cliente"), false);
		assert.equal(
			canAccessDashboardPath("admin", "/dashboard/trabajador"),
			false,
		);
	});

	it("opens each role-owned section to its owner and to nobody else", () => {
		// Regresión: la tabla anterior (`ROLE_SPECIFIC_PATHS`) negaba estas
		// rutas a todos los roles, así que las páginas de cliente y de empleado
		// quedaban construidas pero inalcanzables.
		assert.equal(canAccessDashboardPath("client", "/dashboard/cliente"), true);
		assert.equal(
			canAccessDashboardPath("client", "/dashboard/cliente/favoritas"),
			true,
		);
		assert.equal(
			canAccessDashboardPath("worker", "/dashboard/trabajador"),
			true,
		);
		assert.equal(
			canAccessDashboardPath("worker", "/dashboard/trabajador/incidencias"),
			true,
		);
		// La raíz del dashboard es común a cualquier rol con sesión.
		assert.equal(canAccessDashboardPath("client", "/dashboard"), true);
		assert.equal(canAccessDashboardPath("worker", "/dashboard"), true);
	});

	it("keeps roles out of sections that do not belong to them", () => {
		// Un empleado no ve las rutas del cliente ni al revés, y los de la
		// compañía tampoco entran en secciones de rol.
		assert.equal(canAccessDashboardPath("worker", "/dashboard/cliente"), false);
		assert.equal(
			canAccessDashboardPath("client", "/dashboard/trabajador"),
			false,
		);
		assert.equal(
			canAccessDashboardPath("manager", "/dashboard/trabajador"),
			false,
		);
		assert.equal(
			canAccessDashboardPath("manager", "/dashboard/cliente"),
			false,
		);
		// Y abrir la sección de empleado no abre la de gestión.
		assert.equal(
			canAccessDashboardPath("worker", "/dashboard/gestion/rutas"),
			false,
		);
	});

	it("keeps the four dashboard sections aligned with the capability table", () => {
		// Regresión: `isCompanyRole` excluía a cliente y empleado, pero los cuatro
		// roles tienen `dashboard:access` en `ROLE_CAPABILITIES`.
		for (const role of ROLES) {
			assert.equal(canAccessDashboardPath(role, "/dashboard"), true);
		}
		// Y el chat: `chat:access` existe para los cuatro, así que la sección
		// tiene que ser alcanzable o la capability es decorativa.
		for (const role of ROLES) {
			assert.equal(canAccessDashboardPath(role, "/dashboard/mensajes"), true);
		}
	});

	it("still refuses an unknown or missing role", () => {
		assert.equal(canAccessDashboardPath("root", "/dashboard"), false);
		assert.equal(canAccessDashboardPath(undefined, "/dashboard"), false);
		assert.equal(canAccessDashboardPath(null, "/dashboard/trabajador"), false);
		assert.equal(
			canAccessDashboardPath("client", "/dashboard/trabajador"),
			false,
		);
	});
});

describe("post-login destinations", () => {
	it("sends each role to its correct starting page", () => {
		assert.equal(dashboardHomeForRole("manager"), "/dashboard/gestion");
		assert.equal(dashboardHomeForRole("admin"), "/dashboard/gestion");
		// Cada rol entra por su propia sección, no por un perfil genérico.
		assert.equal(dashboardHomeForRole("client"), "/dashboard/cliente");
		assert.equal(dashboardHomeForRole("worker"), "/dashboard/trabajador");
		// Y un cliente que pide gestión al iniciar sesión aterriza en su
		// dashboard, sin conservar la ruta que no le corresponde.
		assert.equal(
			postLoginDestination("client", "/dashboard/gestion"),
			"/dashboard/cliente",
		);
	});

	it("preserves safe requested paths only for authorized company roles", () => {
		assert.equal(
			postLoginDestination("manager", "/dashboard/gestion/mapa?lang=ca"),
			"/dashboard/gestion/mapa",
		);
		assert.equal(
			postLoginDestination("manager", "/dashboard/gestion/usuarios"),
			"/dashboard/gestion",
		);
		assert.equal(
			postLoginDestination("admin", "https://attacker.example"),
			"/dashboard/gestion",
		);
		assert.equal(
			postLoginDestination("admin", "//attacker.example"),
			"/dashboard/gestion",
		);
	});
	it("preserves locale and authorization on prefixed paths", () => {
		assert.equal(
			canAccessDashboardPath("manager", "/es/dashboard/gestion/usuarios"),
			false,
		);
		assert.equal(
			canAccessDashboardPath("manager", "/fr/dashboard/gestion/mapa"),
			true,
		);
		assert.equal(canAccessDashboardPath("admin", "/es/perfil"), false);
		assert.equal(
			postLoginDestination("manager", "/es/dashboard/gestion/usuarios", "es"),
			"/dashboard/gestion",
		);
		assert.equal(
			postLoginDestination(
				"admin",
				"/es/dashboard/gestion/mapa?filter=active#map",
				"es",
			),
			"/dashboard/gestion/mapa?filter=active#map",
		);
		assert.equal(
			postLoginDestination("worker", "/es/dashboard", "es"),
			"/dashboard/trabajador",
		);
		assert.equal(
			postLoginDestination("worker", "/es/dashboard/trabajador/lineas", "es"),
			"/dashboard/trabajador",
		);
	});
});
