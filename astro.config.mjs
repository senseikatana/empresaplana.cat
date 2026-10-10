// @ts-check

import { fileURLToPath } from "node:url";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
    output: "server",
    adapter: node({ mode: "standalone" }),
    integrations: [vue()],
    security: {
        checkOrigin: false,
        allowedDomains: [
            { hostname: "localhost", protocol: "http" },
            { hostname: "127.0.0.1", protocol: "http" },
            { hostname: "empresaplana.senseikatana.com", protocol: "https" },
            {
                hostname: "empresaplana-web-a09ce3e6-15aa-45cd-8882-d36e986600c2.fly.dev",
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
            allowedHosts: [
                "localhost",
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