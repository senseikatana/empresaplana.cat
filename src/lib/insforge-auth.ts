import type { AstroCookies } from "astro";
import { createAuthActions, createServerClient, clearAuthCookies, type CookieStore, type CookieOptions } from "@insforge/sdk/ssr";
import { ENV } from "@/config/config.env";

export function insforgeConfig() {
	if (!ENV.insforgeUrl || !ENV.insforgeAnonKey) throw new Error("INSFORGE_URL and INSFORGE_ANON_KEY must be configured.");
	return {
		baseUrl: ENV.insforgeUrl,
		anonKey: ENV.insforgeAnonKey,
		options: {
			accessToken: { httpOnly: true, secure: import.meta.env.PROD, sameSite: "lax" as const, path: "/" },
			refreshToken: { httpOnly: true, secure: import.meta.env.PROD, sameSite: "lax" as const, path: "/" },
		},
	};
}
export function authCookieStore(cookies: AstroCookies): CookieStore {
	return {
		get: (name) => cookies.get(name),
		set: (...args: [string, string, CookieOptions?] | [CookieOptions & { name: string; value: string }]) => {
			if (typeof args[0] === "string") {
				const [name, value, options] = args;
				if (value === undefined) throw new Error("Missing auth cookie value.");
				cookies.set(name, value, { ...options, path: options?.path ?? "/" });
			} else {
				const { name, value, ...options } = args[0];
				cookies.set(name, value, { ...options, path: options.path ?? "/" });
			}
		},
		delete: (name) => cookies.delete(name, { path: "/" }),
	};
}
export function nativeAuthActions(cookies: AstroCookies) {
	return createAuthActions({ ...insforgeConfig(), cookies: authCookieStore(cookies) });
}
export function nativeAuthClient(cookies: AstroCookies) {
	return createServerClient({ ...insforgeConfig(), cookies: authCookieStore(cookies) });
}
export function clearNativeSession(cookies: AstroCookies) {
	clearAuthCookies(authCookieStore(cookies), insforgeConfig());
	cookies.delete("ep_session", { path: "/" });
}
export async function configuredOAuthProviders(): Promise<("google" | "github")[]> {
	const client = createServerClient(insforgeConfig());
	const { data, error } = await client.auth.getPublicAuthConfig();
	if (error || !data) throw new Error(`InsForge auth configuration unavailable (${error?.statusCode ?? 503}).`);
	return data.oAuthProviders.filter((provider): provider is "google" | "github" => provider === "google" || provider === "github");
}
