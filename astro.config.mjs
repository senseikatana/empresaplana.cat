// @ts-check

import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: node({ mode: "standalone" }),
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
			// Acepta los tunnels de cloudflared (subdominios *.trycloudflare.com
			// aleatorios en cada arranque). Sin esto Vite bloquea el Host header.
			allowedHosts: [".trycloudflare.com"],
		},
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
	},
});
