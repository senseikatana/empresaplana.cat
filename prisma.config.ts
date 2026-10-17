import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Orden de aplicación de las migraciones SQL.
 *
 * La fuente legible es `prisma/migrations_path`. Este array es el mismo orden
 * en forma de datos, para que `db:drift` pueda comprobar que las tres cosas
 * coinciden:
 *
 *   1. lo que dice `prisma/migrations_path`
 *   2. este array
 *   3. lo que existe realmente en `migrations/`
 *
 * Si discrepan, `bun run db:drift` falla. Eso es lo que impide que alguien
 * meta un SQL por el medio sin que se note.
 */
export const MIGRATION_ORDER = [
	"migrations/20261010092222_initial-prisma-schema.sql",
	"migrations/20261010112209_insforge-auth-native.sql",
	"migrations/20261010121912_create-service-alerts.sql",
	"migrations/20261010130218_fleet-operations.sql",
	"migrations/20261017120000_tracking-persistence.sql",
] as const;

export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		// Directorio REAL del repositorio. Antes apuntaba a "prisma/migrations",
		// que no existe: `prisma migrate` no encontraba ninguna migración.
		//
		// OJO: esto no hace que las migraciones se apliquen solas. El camino
		// documentado sigue siendo `db:push` (deriva del modelo, ignora los .sql)
		// y la aplicación manual de estos ficheros. Ver
		// `docs/architecture/decisions/migration-mapping.md`.
		path: "migrations",
		seed: "bunx tsx prisma/seed.ts",
	},
	datasource: {
		url: env("DATABASE_URL"),
	},
});
