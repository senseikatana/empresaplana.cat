import { z } from "zod";
import type { Capability } from "@/lib/acl";

const text = (max: number) => z.string().trim().max(max);
const required = (max: number) => text(max).min(1);
const id = z
	.number()
	.int()
	.min(-2147483648)
	.max(2147483647)
	.refine((value) => value !== 0);
const routeId = required(40);
const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "HH:MM");
const optionalTime = z.union([time, z.literal("")]);
const date = z.union([z.iso.date(), z.literal("")]);
const day = z.iso.date();
const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const point = z.object({ lat, lng }).strict();
const status = z.enum([
	"active",
	"inactive",
	"delayed",
	"maintenance",
	"online",
	"offline",
	"enRoute",
]);
const ids = z
	.array(id)
	.max(500)
	.refine((values) => new Set(values).size === values.length);
const routeIds = z
	.array(routeId)
	.max(500)
	.refine((values) => new Set(values).size === values.length);

export const routeSchema = z
	.object({
		code: required(20),
		name: required(200),
		origin: required(120),
		destination: required(120),
		driverId: id.nullable(),
		color: z.string().regex(/^#[0-9a-f]{6}$/i),
		status,
		path: z.array(point).max(2000),
		stopIds: ids,
	})
	.strict();
export const busSchema = z
	.object({
		number: required(20),
		plate: required(20),
		company: required(100),
		capacity: z.number().int().min(1).max(500),
		routeId: routeId.nullable(),
		status,
		gps: z.union([point, z.object({}).strict()]),
	})
	.strict();
export const stopSchema = z
	.object({
		name: required(200),
		address: text(300),
		lat,
		lng,
		routeIds,
	})
	.strict();
export const scheduleSchema = z
	.object({
		routeId,
		departure: time,
		arrival: time,
		frequency: required(30),
		days: required(50),
		status,
	})
	.strict();
export const driverSchema = z
	.object({
		name: required(120),
		phone: text(30),
		license: text(30),
		busNumber: required(20).nullable(),
		routeId: routeId.nullable(),
		shiftDays: text(30).nullable(),
		shiftHours: text(30).nullable(),
		status,
	})
	.strict();
export const notificationSchema = z
	.object({
		type: z.enum(["delay", "accident", "detour", "info"]),
		title: required(200),
		desc: required(1000),
		read: z.boolean(),
		routeId: routeId.nullable(),
	})
	.strict();
export const reportSchema = z
	.object({
		lineId: routeId,
		stop: text(200),
		// Vocabulario canónico camelCase: es el que aceptan el CHECK de
		// "Report" y las claves i18n. Antes el CRUD usaba snake_case
		// (on_time / not_passed) contra una API pública en camelCase.
		action: z.enum([
			"passed",
			"onTime",
			"late",
			"early",
			"notPassed",
			"cancelled",
		]),
		minutesLate: z.number().int().min(0).max(1440).nullable(),
		comment: text(500).nullable(),
		// Día de servicio. Obligatorio de cara al agregado: con `NULL` el reporte
		// queda fuera de la ventana y no suma en el panel, aunque sí aparezca en
		// el listado del CRUD.
		serviceDate: z.iso.date(),
	})
	.strict();
export const officeSchema = z
	.object({
		name: required(160),
		address: required(300),
		city: required(80),
		postalCode: text(10),
		phone: text(30),
		purpose: text(300),
		lat: lat.nullable(),
		lng: lng.nullable(),
		order: z.number().int().min(-2147483648).max(2147483647),
	})
	.strict()
	.refine((value) => (value.lat === null) === (value.lng === null), {
		path: ["lng"],
		message: "coordinates_pair",
	});
export const budgetSchema = z
	.object({
		userId: id,
		clientName: required(200),
		email: z.email().max(200),
		phone: text(30),
		company: text(200).nullable(),
		reasonId: required(60),
		description: text(2000).nullable(),
		departureCity: text(120),
		departureDay: date,
		departureTime: optionalTime,
		arrivalCity: text(120),
		arrivalDay: date,
		arrivalTime: optionalTime,
		people: z.union([z.string().regex(/^[1-9]\d{0,3}$/), z.literal("")]),
		status: z.enum([
			"received",
			"reviewing",
			"approved",
			"rejected",
			"sent",
			"accepted",
			"cancelled",
		]),
	})
	.strict();
export const lineSchema = z
	.object({
		name: required(200),
		pdfUrl: z
			.union([z.url().refine((url) => /^https?:\/\//.test(url)), z.literal("")])
			.refine((url) => url.length <= 500),
	})
	.strict();
const searchStop = z
	.object({
		town: required(120),
		name: required(200),
		time,
		lat: lat.nullable().optional(),
		lon: lng.nullable().optional(),
	})
	.strict();
export const lineScheduleSchema = z
	.object({
		lineId: id,
		stopsJson: z.array(searchStop).min(2).max(500),
	})
	.strict()
	.superRefine(({ stopsJson }, context) => {
		for (let index = 1; index < stopsJson.length; index++) {
			if (stopsJson[index].time < stopsJson[index - 1].time) {
				context.addIssue({
					code: "custom",
					path: ["stopsJson", index, "time"],
					message: "time_order",
				});
			}
		}
	});
export const connectionSchema = z
	.object({
		fromLineId: id,
		atStop: required(200),
		toLineId: id,
		waitMin: z.number().int().min(0).max(1440),
	})
	.strict()
	.refine((value) => value.fromLineId !== value.toLineId, {
		path: ["toLineId"],
		message: "different_lines",
	});

export const vehicleDocumentSchema = z
	.object({
		busId: id,
		docType: z.enum([
			"itv",
			"insurance",
			"tachograph",
			"transport_card",
			"circulation_permit",
			"other",
		]),
		reference: text(80),
		expiresOn: day,
		notes: text(1000).nullable(),
	})
	.strict();
export const incidentSchema = z
	.object({
		busId: id.nullable(),
		driverId: id.nullable(),
		occurredOn: day,
		severity: z.enum(["low", "medium", "high"]),
		status: z.enum(["open", "in_progress", "resolved"]),
		description: required(2000),
	})
	.strict();
export const maintenanceSchema = z
	.object({
		busId: id,
		serviceOn: day,
		kind: z.enum(["preventive", "corrective"]),
		status: z.enum(["scheduled", "in_progress", "completed"]),
		description: required(2000),
		cost: z.number().min(0).max(99999999.99),
	})
	.strict();
// Escalado automático de una línea por acumulación de reportes negativos.
// `windowStart`/`windowEnd` acotan el día de servicio: el umbral se evalúa por
// ventana, no sobre el histórico completo de la línea.
export const escalationSchema = z
	.object({
		lineId: routeId,
		// Obligatorio: con la fecha vacía el escalado queda huérfano y, al no
		// coincidir con ninguna ventana, `addReport` abriría un duplicado.
		serviceDate: day,
		threshold: z.number().int().min(1).max(999),
		negativeCount: z.number().int().min(0).max(9999),
		status: z.enum(["open", "acknowledged", "resolved"]),
		resolvedBy: text(120),
		note: text(1000),
	})
	.strict();

export const managementSchemas = {
	rutas: routeSchema,
	autobuses: busSchema,
	paradas: stopSchema,
	horarios: scheduleSchema,
	conductores: driverSchema,
	notificaciones: notificationSchema,
	reportes: reportSchema,
	oficinas: officeSchema,
	presupuestos: budgetSchema,
	lineas: lineSchema,
	"horarios-linea": lineScheduleSchema,
	conexiones: connectionSchema,
	documentos: vehicleDocumentSchema,
	incidencias: incidentSchema,
	mantenimiento: maintenanceSchema,
	escalaciones: escalationSchema,
};
export type ResourceName = keyof typeof managementSchemas;
export const resourceNames = Object.keys(managementSchemas) as ResourceName[];
export function isResource(value: string | undefined): value is ResourceName {
	return resourceNames.some((name) => name === value);
}
export function managementCapability(resource: ResourceName): Capability {
	if (resource === "presupuestos") return "budgets:manage";
	if (["oficinas", "lineas", "horarios-linea", "conexiones"].includes(resource))
		return "content:manage";
	return "fleet:manage";
}

export type InputType =
	| "text"
	| "number"
	| "email"
	| "date"
	| "time"
	| "color"
	| "textarea"
	| "json"
	| "checkbox"
	| "select";
export interface ManagementField {
	name: string;
	type: InputType;
	nullable: boolean;
	options?: readonly string[];
	relation?:
		| "routes"
		| "stops"
		| "drivers"
		| "buses"
		| "vehicles"
		| "users"
		| "lines";
}
const numberFields = new Set([
	"capacity",
	"lat",
	"lng",
	"order",
	"driverId",
	"userId",
	"lineId",
	"fromLineId",
	"toLineId",
	"waitMin",
	"minutesLate",
	"busId",
	"cost",
	// Sin estos, el formulario enviaba "3" como texto y `z.number()` rechazaba
	// el guardado: ningún escalado se podía crear ni cerrar desde el panel.
	"threshold",
	"negativeCount",
]);
const nullableFields = new Set([
	"driverId",
	"routeId",
	"busNumber",
	"shiftDays",
	"shiftHours",
	"minutesLate",
	"comment",
	"company",
	"description",
	"notes",
]);
const jsonFields = new Set(["path", "gps", "stopIds", "routeIds", "stopsJson"]);
const relations: Record<string, ManagementField["relation"]> = {
	driverId: "drivers",
	routeId: "routes",
	// `lineId` NO lleva relación a propósito: la tabla "Report" y "Escalation"
	// guardan identificadores de línea PÚBLICA ("l68-penedes"), que no existen en
	// la tabla "Route" de flota. Mapearlo a "routes" hacía que validar un reporte
	// ciudadano desde el panel fallara por referencia inexistente.
	fromLineId: "lines",
	toLineId: "lines",
	busNumber: "buses",
	busId: "vehicles",
	userId: "users",
};
const statusOptions: Partial<Record<ResourceName, readonly string[]>> = {
	presupuestos: budgetSchema.shape.status.options,
	incidencias: incidentSchema.shape.status.options,
	mantenimiento: maintenanceSchema.shape.status.options,
	escalaciones: escalationSchema.shape.status.options,
};
const selectOptions: Record<string, readonly string[]> = {
	type: notificationSchema.shape.type.options,
	action: reportSchema.shape.action.options,
	docType: vehicleDocumentSchema.shape.docType.options,
	severity: incidentSchema.shape.severity.options,
	kind: maintenanceSchema.shape.kind.options,
};
export function managementFields(resource: ResourceName): ManagementField[] {
	return Object.keys(managementSchemas[resource].shape).map((name) => {
		let type: InputType = numberFields.has(name) ? "number" : "text";
		// `lineId` es texto libre en reportes y escalados (línea pública), y una
		// FK numérica en "horarios-linea".
		if (name === "lineId" && resource !== "horarios-linea") type = "text";
		if (jsonFields.has(name)) type = "json";
		if (["desc", "description", "comment", "purpose", "notes"].includes(name))
			type = "textarea";
		if (name === "email") type = "email";
		if (name.endsWith("Day") || name.endsWith("On")) type = "date";
		// Cubre serviceDate/serviceOn sin ampliar a todo sufijo "Date".
		// Cubre serviceDate donde aparezca: es un día en todos los recursos que lo
		// traen (reportes y escalaciones). `*On` lo cubre el sufijo de arriba.
		if (name === "serviceDate") type = "date";
		if (name.endsWith("Time") || name === "departure" || name === "arrival")
			type = "time";
		if (name === "color") type = "color";
		if (name === "read") type = "checkbox";
		let options: readonly string[] | undefined = selectOptions[name];
		if (name === "status") options = statusOptions[resource] ?? status.options;
		if (options) type = "select";
		return {
			name,
			type,
			options,
			nullable:
				(nullableFields.has(name) &&
					!(name === "routeId" && resource === "horarios") &&
					!(name === "company" && resource === "autobuses")) ||
				(resource === "oficinas" && ["lat", "lng"].includes(name)) ||
				(resource === "incidencias" && name === "busId"),
			relation:
				name === "lineId" && resource === "horarios-linea"
					? "lines"
					: relations[name],
		};
	});
}
export function initialManagementValues(
	resource: ResourceName,
): Record<string, unknown> {
	const values: Record<string, unknown> = {};
	for (const field of managementFields(resource)) {
		values[field.name] = field.nullable
			? null
			: field.type === "checkbox"
				? false
				: field.type === "json"
					? []
					: "";
	}
	Object.assign(values, {
		...(resource === "rutas" ? { color: "#013990", status: "active" } : {}),
		...(resource === "autobuses"
			? { company: "Empresa Plana", capacity: 50, gps: {}, status: "active" }
			: {}),
		...(resource === "horarios"
			? { frequency: "60 min", days: "Lun–Dom", status: "active" }
			: {}),
		...(resource === "conductores" ? { status: "active" } : {}),
		...(resource === "notificaciones" ? { type: "info" } : {}),
		...(resource === "reportes"
			? {
					action: "late",
					serviceDate: new Date().toISOString().slice(0, 10),
				}
			: {}),
		...(resource === "oficinas" ? { order: 0 } : {}),
		...(resource === "presupuestos" ? { status: "received" } : {}),
		...(resource === "conexiones" ? { waitMin: 0 } : {}),
		...(resource === "documentos" ? { docType: "itv" } : {}),
		...(resource === "incidencias" ? { severity: "low", status: "open" } : {}),
		...(resource === "mantenimiento"
			? { kind: "preventive", status: "scheduled", cost: 0 }
			: {}),
		...(resource === "escalaciones"
			? {
					threshold: 3,
					negativeCount: 0,
					status: "open",
					serviceDate: new Date().toISOString().slice(0, 10),
				}
			: {}),
	});
	return values;
}
