/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { hasCapability } from "@/lib/acl";
import {
	initialManagementValues,
	isResource,
	managementCapability,
	managementFields,
	managementSchemas,
	resourceNames,
} from "@/lib/management-schemas";
import {
	managementError,
	ManagementError,
	numericId,
	pageSchema,
} from "@/lib/management";

describe("management validation and permissions", () => {
	test("covers the twelve agreed entities and rejects unknown resource names", () => {
		expect(resourceNames).toHaveLength(12);
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
