import pg from "pg";

/**
 * Cliente Postgres para los scripts standalone (sync/export/bootstrap).
 * Lee DATABASE_URL del .env (InsForge). Los scripts usan pg crudo porque
 * corren fuera del runtime de Astro y no comparten el singleton de src/lib/db.ts.
 */
export function createDb(env) {
	const url = env.DATABASE_URL;
	if (!url) {
		throw new Error("Falta DATABASE_URL en .env");
	}
	return new pg.Client({
		connectionString: url,
		ssl: { rejectUnauthorized: false },
	});
}
