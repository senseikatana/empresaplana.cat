export type UsuarioRole = "client" | "worker" | "admin";

export interface SessionUser {
	id: number;
	username: string;
	role: UsuarioRole;
}
