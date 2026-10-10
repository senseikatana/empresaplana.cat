// @ts-check

import { fileURLToPath } from "node:url";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: cloudflare(),
	integrations: [react()],
	security: {
		checkOrigin: false,
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
			allowedHosts: [
				"localhost",
				"face-discrete-presents-criterion.trycloudflare.com",
				".trycloudflare.com",
			],
		},
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
	},
});
