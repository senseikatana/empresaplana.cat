export type RouteAuth = { kind: "public" } | { kind: "session" };

export interface RouteDef {
	path: string;
	source: string;
	auth: RouteAuth;
	layout?: "BaseLayout" | "DashboardLayout";
}

export const router: RouteDef[] = [
	{
		path: "/",
		source: "src/pages/index.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/home-variant-1",
		source: "src/pages/home-variant-1.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/home-variant-2",
		source: "src/pages/home-variant-2.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/mobile",
		source: "src/pages/mobile.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/marketing-kit",
		source: "src/pages/marketing-kit.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/screens",
		source: "src/pages/screens.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},

	{
		path: "/rutas-horarios",
		source: "src/pages/rutas-horarios.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/rutas-horarios-sin-resultados",
		source: "src/pages/rutas-horarios-sin-resultados.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/rutas-horarios-mobile-app",
		source: "src/pages/rutas-horarios-mobile-app.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/servicios-discrecionales",
		source: "src/pages/servicios-discrecionales.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/servicios-discrecionales-mobile-app",
		source: "src/pages/servicios-discrecionales-mobile-app.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/servicios/[slug]",
		source: "src/pages/servicios/[slug].astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/solicitar-presupuesto",
		source: "src/pages/solicitar-presupuesto.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/solicitud-confirmada",
		source: "src/pages/solicitud-confirmada.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/rastreig",
		source: "src/pages/rastreig.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},

	{
		path: "/donde-estamos",
		source: "src/pages/donde-estamos.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/donde-estamos-oficina-seleccionada",
		source: "src/pages/donde-estamos-oficina-seleccionada.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/donde-estamos-mobile",
		source: "src/pages/donde-estamos-mobile.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/donde-estamos-mobile-app",
		source: "src/pages/donde-estamos-mobile-app.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},

	{
		path: "/politica-privacidad",
		source: "src/pages/politica-privacidad.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/politica-cookies",
		source: "src/pages/politica-cookies.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/aviso-legal",
		source: "src/pages/aviso-legal.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},
	{
		path: "/aviso-legal-variante",
		source: "src/pages/aviso-legal-variante.astro",
		auth: { kind: "public" },
		layout: "BaseLayout",
	},

	{
		path: "/dashboard/login",
		source: "src/pages/dashboard/login.astro",
		auth: { kind: "public" },
	},
	{
		path: "/dashboard/register",
		source: "src/pages/dashboard/register.astro",
		auth: { kind: "public" },
	},
	{
		path: "/dashboard",
		source: "src/pages/dashboard/index.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/mensajes",
		source: "src/pages/dashboard/mensajes.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},

	{
		path: "/dashboard/cliente",
		source: "src/pages/dashboard/cliente/index.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/cliente/cuenta",
		source: "src/pages/dashboard/cliente/cuenta.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/cliente/favoritas",
		source: "src/pages/dashboard/cliente/favoritas.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/cliente/cotizaciones",
		source: "src/pages/dashboard/cliente/cotizaciones.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},

	{
		path: "/dashboard/trabajador",
		source: "src/pages/dashboard/trabajador/index.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/trabajador/lineas",
		source: "src/pages/dashboard/trabajador/lineas.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/trabajador/incidencias",
		source: "src/pages/dashboard/trabajador/incidencias.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/trabajador/reportes",
		source: "src/pages/dashboard/trabajador/reportes.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},

	{
		path: "/dashboard/gestion",
		source: "src/pages/dashboard/gestion/index.astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
	{
		path: "/dashboard/gestion/[seccion]",
		source: "src/pages/dashboard/gestion/[seccion].astro",
		auth: { kind: "session" },
		layout: "DashboardLayout",
	},
];

export const api: { method: string; path: string; source: string }[] = [
	{ method: "GET", path: "/api/health", source: "src/pages/api/health.ts" },
	{ method: "GET", path: "/api/auth/me", source: "src/pages/api/auth/me.ts" },
	{
		method: "POST",
		path: "/api/auth/login",
		source: "src/pages/api/auth/login.ts",
	},
	{
		method: "POST",
		path: "/api/auth/register",
		source: "src/pages/api/auth/register.ts",
	},
	{
		method: "POST",
		path: "/api/auth/logout",
		source: "src/pages/api/auth/logout.ts",
	},
	{ method: "GET", path: "/api/account", source: "src/pages/api/account.ts" },
	{
		method: "GET",
		path: "/api/favorites",
		source: "src/pages/api/favorites.ts",
	},
	{ method: "GET", path: "/api/budgets", source: "src/pages/api/budgets.ts" },
	{ method: "POST", path: "/api/budget", source: "src/pages/api/budget.ts" },
	{ method: "GET", path: "/api/offices", source: "src/pages/api/offices.ts" },
	{ method: "GET", path: "/api/users", source: "src/pages/api/users/index.ts" },
	{
		method: "GET|PATCH|DELETE",
		path: "/api/users/[id]",
		source: "src/pages/api/users/[id].ts",
	},
	{
		method: "GET",
		path: "/api/fleet/summary",
		source: "src/pages/api/fleet/summary.ts",
	},
	{
		method: "GET",
		path: "/api/fleet/routes",
		source: "src/pages/api/fleet/routes.ts",
	},
	{
		method: "GET",
		path: "/api/fleet/notifications",
		source: "src/pages/api/fleet/notifications.ts",
	},
	{ method: "GET", path: "/api/chat", source: "src/pages/api/chat/index.ts" },
	{
		method: "GET",
		path: "/api/chat/[id]",
		source: "src/pages/api/chat/[id].ts",
	},
	{
		method: "GET|POST",
		path: "/api/bus-tracking/reports",
		source: "src/pages/api/bus-tracking/reports.ts",
	},
	{
		method: "GET|POST",
		path: "/api/bus-tracking/reviews",
		source: "src/pages/api/bus-tracking/reviews.ts",
	},
];
