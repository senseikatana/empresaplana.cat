/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
	initialManagementValues,
	type ResourceName,
} from "@/lib/management-schemas";

const base = process.env.CRUD_TEST_BASE_URL;
describe.skipIf(!base)("management API against InsForge", () => {
	test("reads existing data and creates, edits, links and deletes isolated test records", async () => {
		if (!base)
			throw new Error(
				"CRUD_TEST_BASE_URL must point to a running local server.",
			);
		const origin = new URL(base);
		if (!["127.0.0.1", "localhost"].includes(origin.hostname))
			throw new Error("Integration tests only run against a local server.");
		if (
			!process.env.CRUD_TEST_EMAIL ||
			!process.env.CRUD_TEST_PASSWORD ||
			!process.env.CRUD_TEST_WORKER_EMAIL ||
			!process.env.CRUD_TEST_WORKER_PASSWORD
		) {
			throw new Error(
				"Configure verified native InsForge admin and worker test credentials.",
			);
		}
		const marker = `CRUD-${randomUUID().slice(0, 8)}`;
		const created: { resource: ResourceName; id: string | number }[] = [];
		let cookie = "";
		async function request(
			path: string,
			method = "GET",
			body?: unknown,
			status = 200,
		) {
			const response = await fetch(new URL(path, base), {
				method,
				redirect: "manual",
				headers: {
					cookie,
					Origin: origin.origin,
					...(body === undefined ? {} : { "Content-Type": "application/json" }),
				},
				body: body === undefined ? undefined : JSON.stringify(body),
			});
			const data = await response.json();
			expect(
				response.status,
				`${method} ${path}: ${JSON.stringify(data)}`,
			).toBe(status);
			return { response, data };
		}
		async function create(
			resource: ResourceName,
			changes: Record<string, unknown>,
		) {
			const { data } = await request(
				`/api/management/${resource}`,
				"POST",
				{ ...initialManagementValues(resource), ...changes },
				201,
			);
			created.push({ resource, id: data.record.id });
			return data.record;
		}
		async function update(
			resource: ResourceName,
			id: string | number,
			changes: Record<string, unknown>,
			status = 200,
		) {
			return request(
				`/api/management/${resource}/${id}`,
				"PATCH",
				changes,
				status,
			);
		}
		await request("/api/management/rutas", "GET", undefined, 401);
		const login = await request("/api/auth/login", "POST", {
			email: process.env.CRUD_TEST_EMAIL,
			password: process.env.CRUD_TEST_PASSWORD,
			locale: "es",
		});
		cookie = login.response.headers
			.getSetCookie()
			.map((value) => value.split(";")[0])
			.join("; ");
		expect(cookie).not.toBe("");
		try {
			const { data: team } = await request("/api/users");
			const client = team.users.find(
				(user: { role: string }) => user.role === "client",
			);
			expect(client).toBeDefined();
			for (const resource of [
				"rutas",
				"autobuses",
				"paradas",
				"horarios",
				"conductores",
				"notificaciones",
				"reportes",
				"oficinas",
				"presupuestos",
				"lineas",
				"horarios-linea",
				"conexiones",
				"escalaciones",
			]) {
				const { data } = await request(`/api/management/${resource}?limit=1`);
				expect(data.rows.length).toBeLessThanOrEqual(1);
				expect(data.total).toBeGreaterThanOrEqual(0);
			}
			await request("/api/management/rutas?limit=101", "GET", undefined, 400);
			await request("/api/management/unknown", "GET", undefined, 404);
			const route = await create("rutas", {
				code: marker,
				name: `[DEMO] ${marker}`,
				origin: "CRUD A",
				destination: "CRUD B",
			});
			const stop = await create("paradas", {
				name: marker,
				address: "Test only",
				lat: 41,
				lng: 1,
				routeIds: [route.id],
			});
			const bus = await create("autobuses", {
				number: marker,
				plate: marker,
				routeId: route.id,
			});
			const driver = await create("conductores", {
				name: marker,
				busNumber: bus.number,
				routeId: route.id,
			});
			await update("rutas", route.id, {
				driverId: driver.id,
				stopIds: [stop.id],
				path: [{ lat: 41, lng: 1 }],
			});
			await update("paradas", stop.id, { address: "Test updated" });
			await update("autobuses", bus.id, {
				capacity: 60,
				gps: { lat: 41, lng: 1 },
			});
			await update("conductores", driver.id, { phone: "000000000" });
			await update("autobuses", bus.id, { number: `${marker}-X` }, 409);
			await update("autobuses", bus.id, { routeId: "missing-route" }, 400);
			await update("autobuses", bus.id, { capacity: 0 }, 400);
			await update("autobuses", bus.id, { id: 999 }, 400);
			await request(
				`/api/management/rutas/${route.id}`,
				"DELETE",
				undefined,
				409,
			);
			const schedule = await create("horarios", {
				routeId: route.id,
				departure: "08:00",
				arrival: "08:30",
			});
			await update("horarios", schedule.id, { departure: "08:05" });
			const notification = await create("notificaciones", {
				title: marker,
				desc: "Test only",
				routeId: route.id,
			});
			await update("notificaciones", notification.id, { read: true });
			const report = await create("reportes", {
				lineId: route.id,
				stop: marker,
				minutesLate: 5,
			});
			await update("reportes", report.id, { comment: "Test updated" });
			const office = await create("oficinas", {
				name: marker,
				city: "CRUD City",
				address: "Test only",
			});
			await update("oficinas", office.id, { phone: "000000000" });
			const budget = await create("presupuestos", {
				userId: client.id,
				clientName: marker,
				email: "test@example.invalid",
				reasonId: "crud-test",
			});
			await update("presupuestos", budget.id, {
				status: "reviewing",
				people: "10",
			});
			const lineA = await create("lineas", { name: `[DEMO] ${marker} A` });
			const lineB = await create("lineas", { name: `[DEMO] ${marker} B` });
			await update("lineas", lineA.id, { name: `[DEMO] ${marker} updated` });
			const townA = `${marker} A`,
				townB = `${marker} B`,
				hub = `${marker} Hub`;
			const lineScheduleA = await create("horarios-linea", {
				lineId: lineA.id,
				stopsJson: [
					{ town: townA, name: "Test", time: "08:00" },
					{ town: hub, name: "Test", time: "08:20" },
				],
			});
			await create("horarios-linea", {
				lineId: lineB.id,
				stopsJson: [
					{ town: hub, name: "Test", time: "08:25" },
					{ town: townB, name: "Test", time: "08:45" },
				],
			});
			const changed = await update("horarios-linea", lineScheduleA.id, {
				stopsJson: [
					{ town: townA, name: "Test", time: "08:05" },
					{ town: hub, name: "Test", time: "08:20" },
				],
			});
			expect(changed.data.record.duration).toBe("15 min");
			const connection = await create("conexiones", {
				fromLineId: lineA.id,
				toLineId: lineB.id,
				atStop: `${hub} — Test`,
			});
			await update("conexiones", connection.id, { waitMin: 5 });
			await update(
				"conexiones",
				connection.id,
				{ atStop: "Missing stop" },
				400,
			);
			await request(
				`/api/management/lineas/${lineA.id}`,
				"DELETE",
				undefined,
				409,
			);
			await request(
				`/api/management/horarios-linea/${lineScheduleA.id}`,
				"DELETE",
				undefined,
				409,
			);
			await update(
				"horarios-linea",
				lineScheduleA.id,
				{
					stopsJson: [
						{ town: townA, name: "Test", time: "08:05" },
						{ town: "Other", name: "Test", time: "08:20" },
					],
				},
				409,
			);
			const result = await fetch(new URL("/es/rutas-horarios", base), {
				method: "POST",
				body: new URLSearchParams({ origin: townA, destination: hub }),
			});
			expect(result.status).toBe(200);
			expect(await result.text()).toContain(`[DEMO] ${marker} updated`);
			for (const entry of created) {
				const { data } = await request(
					`/api/management/${entry.resource}/${entry.id}`,
				);
				expect(data.record.id).toBe(entry.id);
				const response = await fetch(
					new URL(
						`/es/dashboard/gestion/${entry.resource}?edit=${entry.id}`,
						base,
					),
					{ headers: { cookie } },
				);
				expect(response.status).toBe(200);
				const html = await response.text();
				expect(html).toContain('id="management-form"');
				expect(html).toContain(`data-record-id="${entry.id}"`);
			}
			const missing = await request(
				`/api/management/rutas?q=${marker}&limit=1`,
			);
			expect(missing.data.total).toBe(1);
			const csrf = await fetch(
				new URL(`/api/management/rutas/${route.id}`, base),
				{
					method: "DELETE",
					headers: { cookie, Origin: "https://other.example" },
				},
			);
			expect(csrf.status).toBe(403);
			const worker = await request("/api/auth/login", "POST", {
				email: process.env.CRUD_TEST_WORKER_EMAIL,
				password: process.env.CRUD_TEST_WORKER_PASSWORD,
				locale: "es",
			});
			const workerCookie = worker.response.headers
				.getSetCookie()
				.map((value) => value.split(";")[0])
				.join("; ");
			const forbidden = await fetch(new URL("/api/management/rutas", base), {
				headers: { cookie: workerCookie },
			});
			expect(forbidden.status).toBe(403);
			// Remove assignments before cleanup; no original record is modified.
			await update("rutas", route.id, { driverId: null, stopIds: [] });
			await update("paradas", stop.id, { routeIds: [] });
		} finally {
			// Reverse creation order removes children first; explicitly unlink the test route if an assertion failed.
			const route = created.find((entry) => entry.resource === "rutas");
			if (route)
				await update("rutas", route.id, { driverId: null, stopIds: [] });
			for (const entry of [...created].reverse()) {
				await request(
					`/api/management/${entry.resource}/${entry.id}`,
					"DELETE",
				);
				await request(
					`/api/management/${entry.resource}/${entry.id}`,
					"GET",
					undefined,
					404,
				);
			}
		}
	}, 120000);
});
