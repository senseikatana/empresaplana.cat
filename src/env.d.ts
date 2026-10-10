/// <reference types="astro/client" />

declare namespace App {
	interface Locals {
		session: import("@/interfaces/auth").SessionUser | null;
	}
}
