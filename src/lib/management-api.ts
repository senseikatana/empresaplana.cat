import type { APIRoute } from "astro";
import { getSession } from "@/lib/auth";
import { hasCapability, isCompanyRole } from "@/lib/acl";
import { isResource, managementCapability } from "@/lib/management-schemas";
import { findManagement, listManagement, managementError, mutateManagement, pageSchema, ManagementError } from "@/lib/management";

export const handleManagement: APIRoute = async ({ params, request, cookies, url }) => {
	const session = await getSession(cookies);
	if (!session) return Response.json({ error: "unauthorized" }, { status: 401 });
	if (!isCompanyRole(session.role)) return Response.json({ error: "forbidden" }, { status: 403 });
	const resource = params.resource;
	if (!isResource(resource)) return Response.json({ error: "not_found" }, { status: 404 });
	const method = request.method;
	if (method !== "GET" && !hasCapability(session.role, managementCapability(resource))) {
		return Response.json({ error: "forbidden" }, { status: 403 });
	}
	const headers = { "Cache-Control": "no-store" };
	try {
		if (method === "GET") {
			const result = params.id === undefined
				? await listManagement(resource, pageSchema.parse(Object.fromEntries(url.searchParams)))
				: { record: await findManagement(resource, params.id) };
			return Response.json(result, { headers });
		}
		const origin = request.headers.get("Origin");
		if (origin && origin !== url.origin) return Response.json({ error: "forbidden" }, { status: 403, headers });
		if (method === "DELETE") {
			if (params.id === undefined) throw new ManagementError("invalid_id");
			await mutateManagement(resource, params.id, null, true);
			return Response.json({ ok: true }, { headers });
		}
		if ((method === "POST" && params.id === undefined) || (method === "PATCH" && params.id !== undefined)) {
			if (!request.headers.get("Content-Type")?.startsWith("application/json")) throw new ManagementError("invalid_body");
			if (Number(request.headers.get("Content-Length")) > 200000) throw new ManagementError("body_too_large", 413);
			const text = await request.text();
			if (new TextEncoder().encode(text).byteLength > 200000) throw new ManagementError("body_too_large", 413);
			let input: unknown;
			try { input = JSON.parse(text); } catch { throw new ManagementError("invalid_body"); }
			const record = await mutateManagement(resource, params.id, input);
			return Response.json({ record }, { status: method === "POST" ? 201 : 200, headers });
		}
		return Response.json({ error: "method_not_allowed" }, { status: 405, headers });
	} catch (error) {
		const result = managementError(error);
		return Response.json(result.body, { status: result.status, headers });
	}
};
