import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	canAccessDashboardPath,
	dashboardHomeForRole,
	isCompanyRole,
	postLoginDestination,
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
	});
});

describe("post-login destinations", () => {
	it("sends each role to its correct starting page", () => {
		assert.equal(dashboardHomeForRole("manager"), "/dashboard/gestion");
		assert.equal(dashboardHomeForRole("admin"), "/dashboard/gestion");
		assert.equal(dashboardHomeForRole("client"), "/perfil");
		assert.equal(dashboardHomeForRole("worker"), "/perfil");
		assert.equal(
			postLoginDestination("client", "/dashboard/gestion"),
			"/perfil",
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
			"/perfil",
		);
	});
});
