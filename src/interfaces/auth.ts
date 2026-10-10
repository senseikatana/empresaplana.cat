export type UsuarioRole = "client" | "worker" | "manager" | "admin";

export interface SessionUser {
	id: number;
	username: string;
	role: UsuarioRole;
}
