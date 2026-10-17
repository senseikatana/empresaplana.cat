// @ts-check

import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import vercel from "@astrojs/vercel";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

/**
 * El adaptador depende del destino, porque no es intercambiable:
 *
 * - Por defecto (Docker + Compute en Fly) el server va standalone y la imagen
 *   arranca con `node dist/server/entry.mjs`.
 * - Con `ASTRO_ADAPTER=vercel` la salida es Build Output API para Vercel, que es
 *   lo que emite los certificados del dominio propio.
 *
 * Los dos formatos de salida son distintos, así que la variable tiene que
 * fijarse en el entorno de build y no consigo: no hay forma de que el mismo
 * comando sirva para ambos destinos.
 */
const adapter =
	process.env.ASTRO_ADAPTER === "vercel"
		? vercel({ maxDuration: 60 })
		: node({ mode: "standalone" });

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter,
	integrations: [vue()],
	security: {
		checkOrigin: false,
		allowedDomains: [
			{ hostname: "localhost", protocol: "http" },
			{ hostname: "127.0.0.1", protocol: "http" },
			{ hostname: "empresaplana.senseikatana.com", protocol: "https" },
			// Despliegues de Vercel: el nombre cambia en cada preview, así que se
			// acepta cualquier subdominio. Sin esto Astro descarta el
			// `X-Forwarded-Host` y las URLs absolutas salen con el host interno.
			{ hostname: "**.vercel.app", protocol: "https" },
			{
				hostname:
					"empresaplana-web-a09ce3e6-15aa-45cd-8882-d36e986600c2.fly.dev",
				protocol: "https",
			},
		],
	},
	prefetch: {
		prefetchAll: true,
		defaultStrategy: "hover",
	},
	vite: {
		plugins: [tailwindcss()],
		server: {
			// El dominio específico hace explícito el túnel actual; el sufijo
			// permite los subdominios aleatorios que cloudflared genera al reiniciar.
			allowedHosts: ["localhost", ".trycloudflare.com"],
		},
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
	},
});
