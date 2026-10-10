/**
 * Prisma seed — usuarios demo (compartidos con el seed de Nuxt: misma DB).
 * Run: bun run db:seed
 *
 * La flota (rutas, paradas, horarios, buses, conductores, notificaciones)
 * se siembra desde withnuxt/prisma/seed.ts contra la misma base InsForge.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPasskey } from "../src/lib/passkey";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString }),
});

const DEMO_USERS = [
	{
		username: "cliente",
		passkey: "12345678",
		name: "Marc",
		fullName: "Marc Vidal Roca",
		email: "marc.vidal@example.cat",
		phone: "+34 600 111 222",
		role: "client",
	},
	{
		username: "trabajador",
		passkey: "12345678",
		name: "Laura",
		fullName: "Laura Ferrer Solé",
		email: "laura.ferrer@empresaplana.cat",
		phone: "+34 600 333 444",
		role: "worker",
	},
	{
		username: "admin",
		passkey: "12345678",
		name: "Sergi",
		fullName: "Sergi Plana",
		email: "sergi.plana@empresaplana.cat",
		phone: "+34 600 555 666",
		role: "admin",
	},
] as const;

async function main() {
	console.log("Seeding Empresa Plana demo users...");

	for (const user of DEMO_USERS) {
		await prisma.user.upsert({
			where: { username: user.username },
			update: {},
			create: {
				username: user.username,
				passkey: hashPasskey(user.passkey),
				name: user.name,
				fullName: user.fullName,
				email: user.email,
				phone: user.phone,
				role: user.role,
			},
		});
	}
	console.log(`  ✓ ${DEMO_USERS.length} users`);
	console.log("Seeding complete.");
}

main()
	.catch((e) => {
		console.error("Seed failed:", e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
