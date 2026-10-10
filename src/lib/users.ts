import type { UsuarioRole } from "@/interfaces/auth";
import type { PublicUser } from "@/interfaces/users";

interface UserRow {
	id: number;
	name: string;
	fullName: string;
	phone: string;
	email: string;
	username: string;
	role: string;
	createdAt?: Date | null;
}

export function publicUser(row: UserRow): PublicUser {
	return {
		id: row.id,
		name: row.name,
		fullName: row.fullName,
		phone: row.phone,
		email: row.email,
		username: row.username,
		role: row.role as UsuarioRole,
		createdAt: row.createdAt,
	};
}
