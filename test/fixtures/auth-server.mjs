import { createServer } from "node:http";

// Only the public provider configuration is stubbed; no production accounts are used.
const server = createServer((request, response) => {
	response.setHeader("Content-Type", "application/json");
	if (request.method === "GET" && request.url === "/api/auth/public-config") {
		response.end(JSON.stringify({ oAuthProviders: ["google", "github"] }));
		return;
	}
	response.writeHead(404);
	response.end(JSON.stringify({ error: "unsupported_test_request" }));
});

server.listen(4401, "127.0.0.1");
for (const signal of ["SIGTERM", "SIGINT"]) {
	process.on(signal, () => server.close());
}
