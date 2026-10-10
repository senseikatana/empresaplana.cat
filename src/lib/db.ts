import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

let _client: PrismaClient | undefined;

function connectionString(): string | undefined {
	return process.env.DATABASE_URL;
}

export function prisma(): PrismaClient {
	if (!_client) {
		const url = connectionString();
		if (!url) {
			throw new Error(
				"DATABASE_URL is not configured. Set it in .env (local) or Cloudflare.",
			);
		}
		const adapter = new PrismaPg({ connectionString: url });
		_client = new PrismaClient({ adapter });
	}
	return _client;
}

/** @deprecated Use prisma() instead */
export const db = prisma();
