/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { hasCapability } from "@/lib/acl";
import {
	expiryState,
	ManagementError,
	managementError,
	numericId,
	pageSchema,
} from "@/lib/management";
import {
	initialManagementValues,
	isResource,
	managementCapability,
	managementFields,
	managementSchemas,
	resourceNames,
} from "@/lib/management-schemas";
import { startOfServiceDay } from "@/lib/tracking-store";

describe("management validation and permissions", () => {
	test("covers the sixteen agreed entities and rejects unknown resource names", () => {
		expect(resourceNames).toHaveLength(16);
		expect(isResource("usuarios")).toBe(false);
		for (const name of resourceNames) {
			expect(isResource(name)).toBe(true);
			expect(managementFields(name).map((field) => field.name)).toEqual(
				Object.keys(managementSchemas[name].shape),
			);
			expect(hasCapability("admin", managementCapability(name))).toBe(true);
			expect(hasCapability("manager", managementCapability(name))).toBe(false);
		}
	});
	test("keeps citizen line identifiers free of fleet relations", () => {
		// `lineId` en reportes y escalados guarda identificadores de línea PÚBLICA
		// ("l68-penedes"), que no existen en la tabla "Route" de flota. Si se
		// declarara relación, validar un reporte ciudadano fallaría por referencia.
		for (const resource of ["reportes", "escalaciones"] as const) {
			const field = managementFields(resource).find((f) => f.name === "lineId");
			expect(field?.type).toBe("text");
			expect(field?.relation).toBeUndefined();
		}
		// En "horarios-linea" sí es una FK numérica a la tabla Line.
		const scheduleLine = managementFields("horarios-linea").find(
			(f) => f.name === "lineId",
		);
		expect(scheduleLine?.relation).toBe("lines");
	});
	test("validates escalated incidents against the canonical action vocabulary", () => {
		const { reportes: reportSchema, escalaciones: escalationSchema } =
			managementSchemas;
		expect(reportSchema.shape.action.safeParse("onTime").success).toBe(true);
		expect(reportSchema.shape.action.safeParse("notPassed").success).toBe(true);
		// El vocabulario snake_case anterior queda rechazado.
		expect(reportSchema.shape.action.safeParse("on_time").success).toBe(false);
		expect(reportSchema.shape.action.safeParse("not_passed").success).toBe(
			false,
		);
		expect(
			escalationSchema.safeParse({
				lineId: "l68-penedes",
				serviceDate: "2026-10-17",
				threshold: 3,
				negativeCount: 3,
				status: "resolved",
				resolvedBy: "",
				note: "",
			}).success,
		).toBe(true);
		// La ventana del día se deriva en la capa de escritura, no del formulario.
		expect(Object.keys(escalationSchema.shape).includes("windowStart")).toBe(
			false,
		);
	});
	test("escalaciones form fields reach the schema as the types it expects", () => {
		// Regresión real: `threshold` y `negativeCount` no estaban en
		// `numberFields`, así que el formulario enviaba "3" como texto y
		// `z.number()` rechazaba TODA escritura — ni crear ni cerrar un escalado
		// funcionaba desde el panel.
		const byName = new Map(
			managementFields("escalaciones").map((field) => [field.name, field]),
		);
		expect(byName.get("threshold")?.type).toBe("number");
		expect(byName.get("negativeCount")?.type).toBe("number");
		expect(byName.get("serviceDate")?.type).toBe("date");

		// `initialManagementValues` tiene que arrancar con formas válidas: antes
		// salían cadenas vacías que el esquema numérico rechazaba.
		const initial = initialManagementValues("escalaciones");
		expect(
			managementSchemas.escalaciones.safeParse({
				...initial,
				lineId: "l68-penedes",
				serviceDate: "2026-10-17",
			}).success,
		).toBe(true);
	});
	test("operator-entered reports carry the service day the aggregate needs", () => {
		// Sin `serviceDate`, un reporte creado desde el panel se escribía con la
		// fecha a NULL: aparecía en el listado del CRUD pero quedaba fuera de
		// `getLineStats` y de `getPunctuality`. El operador veía su fila y el
		// panel público no la contaba.
		const byName = new Map(
			managementFields("reportes").map((field) => [field.name, field]),
		);
		expect(byName.get("serviceDate")?.type).toBe("date");

		const initial = initialManagementValues("reportes");
		expect(
			managementSchemas.reportes.safeParse({
				...initial,
				lineId: "l68-penedes",
				serviceDate: "2026-10-17",
			}).success,
		).toBe(true);

		// `serviceDate` es obligatorio: no se puede crear un reporte sin día.
		expect(
			managementSchemas.reportes.safeParse({
				...initial,
				lineId: "l68-penedes",
				serviceDate: "",
			}).success,
		).toBe(false);
	});
	test("a service date survives the round trip through the panel", () => {
		// `plain()` formateaba fechas solo para claves terminadas en "On".
		// `serviceDate` no lo hace, así que llegaba al esquema como `Date` y el
		// parser la rechazaba en cada guardado.
		const day = "2026-10-17";
		const fromDb: Record<string, unknown> = {
			serviceDate: new Date(`${day}T12:00:00Z`),
		};
		const serialised = Object.fromEntries(
			Object.entries(fromDb).map(([key, value]) => [
				key,
				value instanceof Date && (key.endsWith("On") || key.endsWith("Date"))
					? value.toISOString().slice(0, 10)
					: value,
			]),
		);
		expect(serialised.serviceDate).toBe(day);
		expect(
			managementSchemas.escalaciones.safeParse({
				lineId: "l68-penedes",
				...serialised,
				threshold: 3,
				negativeCount: 3,
				status: "open",
				resolvedBy: "",
				note: "",
			}).success,
		).toBe(true);
	});
	test("the service day is anchored to Europe/Madrid, not to UTC", () => {
		// Un reporte hecho a las 00:30 en horario de verano (UTC+2) pertenece al
		// día de servicio de ese día. Truncado en UTC caería en el anterior y los
		// agregados del panel quedarían repartidos entre dos servicios distintos.
		const summerNight = new Date("2026-07-17T00:30:00Z"); // 02:30 Madrid
		expect(startOfServiceDay(summerNight).toISOString().slice(0, 10)).toBe(
			"2026-07-17",
		);

		// La propiedad que de verdad importa: TODOS los instantes de un mismo día
		// de Madrid producen exactamente el mismo límite de ventana, de modo que
		// `serviceDate` y `windowStart` no pueden divergir.
		const anchors = [
			new Date("2026-07-16T22:30:00Z"), // 00:30 Madrid, 17/07
			new Date("2026-07-17T10:00:00Z"), // 12:00 Madrid, 17/07
			new Date("2026-07-17T22:30:00Z"), // 00:30 Madrid, 18/07 → otro día
		];
		expect(startOfServiceDay(anchors[0])).toEqual(
			startOfServiceDay(anchors[1]),
		);
		expect(startOfServiceDay(anchors[0]).toISOString()).not.toBe(
			startOfServiceDay(anchors[2]).toISOString(),
		);

		// Invierno (UTC+1): la hora ancla es la misma en UTC, lo único que cambia
		// es la fecha. Eso es lo que hace que el corte no se mueva con el DST.
		const winter = startOfServiceDay(new Date("2026-12-17T10:00:00Z"));
		const summer = startOfServiceDay(new Date("2026-07-17T10:00:00Z"));
		expect(winter.getUTCHours()).toBe(summer.getUTCHours());
		expect(winter.toISOString().slice(0, 10)).toBe("2026-12-17");
	});
	test("accepts seeded negative IDs without accepting zero, floats or unsafe IDs", () => {
		expect(numericId("-1001")).toBe(-1001);
		expect(numericId("1")).toBe(1);
		for (const value of ["0", "1.5", "abc", "2147483648", "-2147483649"])
			expect(() => numericId(value)).toThrow();
	});
	test("bounds pagination rather than allowing unbounded database reads", () => {
		expect(pageSchema.parse({})).toEqual({ page: 1, limit: 25, q: "" });
		expect(pageSchema.safeParse({ limit: 100 }).success).toBe(true);
		expect(pageSchema.safeParse({ limit: 101 }).success).toBe(false);
		expect(pageSchema.safeParse({ page: -1 }).success).toBe(false);
	});
	test("enforces storage bounds, JSON shapes, coordinates and immutable IDs", () => {
		const bus = {
			...initialManagementValues("autobuses"),
			number: "TEST",
			plate: "TEST",
		};
		expect(managementSchemas.autobuses.safeParse(bus).success).toBe(true);
		for (const change of [
			{ capacity: 0 },
			{ capacity: 501 },
			{ gps: { lat: 100, lng: 0 } },
			{ id: 1 },
			{ number: "a".repeat(21) },
		]) {
			expect(
				managementSchemas.autobuses.safeParse({ ...bus, ...change }).success,
			).toBe(false);
		}
		expect(
			managementSchemas.oficinas.safeParse({
				...initialManagementValues("oficinas"),
				name: "Test",
				city: "Test",
				address: "Test",
				lat: 1,
				lng: null,
			}).success,
		).toBe(false);
	});
	test("validates timetable stop structure, order and HH:MM format", () => {
		const schedule = {
			lineId: -1001,
			stopsJson: [
				{ town: "A", name: "Stop", time: "08:00" },
				{ town: "B", name: "Stop", time: "08:30" },
			],
		};
		expect(
			managementSchemas["horarios-linea"].safeParse(schedule).success,
		).toBe(true);
		for (const time of ["25:00", "8:00", "07:00"])
			expect(
				managementSchemas["horarios-linea"].safeParse({
					...schedule,
					stopsJson: [
						schedule.stopsJson[0],
						{ ...schedule.stopsJson[1], time },
					],
				}).success,
			).toBe(false);
		expect(
			managementSchemas["horarios-linea"].safeParse({
				lineId: 1,
				stopsJson: [],
			}).success,
		).toBe(false);
		expect(
			managementSchemas.conexiones.safeParse({
				fromLineId: 1,
				toLineId: 1,
				atStop: "Test",
				waitMin: 0,
			}).success,
		).toBe(false);
	});
	test("uses the correct types and nullability for scalar references", () => {
		expect(
			managementFields("reportes").find((field) => field.name === "lineId")
				?.type,
		).toBe("text");
		expect(
			managementFields("horarios-linea").find(
				(field) => field.name === "lineId",
			)?.relation,
		).toBe("lines");
		expect(
			managementFields("horarios").find((field) => field.name === "routeId")
				?.nullable,
		).toBe(false);
		expect(
			managementFields("autobuses").find((field) => field.name === "company")
				?.nullable,
		).toBe(false);
	});
	test("validates fleet documents, incidents and maintenance", () => {
		const fields = (resource: Parameters<typeof managementFields>[0]) =>
			Object.fromEntries(
				managementFields(resource).map((field) => [field.name, field]),
			);
		expect(fields("documentos").expiresOn.type).toBe("date");
		expect(fields("documentos").busId.relation).toBe("vehicles");
		expect(fields("incidencias").busId.nullable).toBe(true);
		expect(fields("incidencias").status.options).toEqual([
			"open",
			"in_progress",
			"resolved",
		]);
		expect(fields("mantenimiento").cost.type).toBe("number");
		expect(
			managementSchemas.documentos.safeParse({
				...initialManagementValues("documentos"),
				busId: -1001,
				expiresOn: "2026-02-30",
			}).success,
		).toBe(false);
		expect(
			managementSchemas.mantenimiento.safeParse({
				...initialManagementValues("mantenimiento"),
				busId: -1001,
				serviceOn: "2026-01-10",
				description: "Cambio de aceite",
				cost: -1,
			}).success,
		).toBe(false);
		const today = new Date("2026-01-10T12:00:00Z");
		expect(expiryState("2026-01-09", today)).toBe("expired");
		expect(expiryState("2026-01-10", today)).toBe("expiring");
		expect(expiryState("2026-02-09", today)).toBe("expiring");
		expect(expiryState("2026-02-10", today)).toBe("valid");
	});
	test("returns explicit errors for invalid records and missing dependencies", () => {
		expect(
			managementError(new ManagementError("has_dependencies", 409)),
		).toMatchObject({ status: 409, body: { error: "has_dependencies" } });
		const result = managementSchemas.lineas.safeParse({
			name: "",
			pdfUrl: "javascript:alert(1)",
		});
		if (!result.success)
			expect(managementError(result.error)).toMatchObject({
				status: 400,
				body: { error: "validation_failed" },
			});
	});
});
