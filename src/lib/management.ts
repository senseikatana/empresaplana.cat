import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
	managementFields,
	managementSchemas,
	type ResourceName,
} from "@/lib/management-schemas";
import { serviceWindow } from "@/lib/tracking-store";
import { Prisma } from "../../generated/prisma/client";

type DB = Prisma.TransactionClient;
export type ManagementRow = { id: string | number } & Record<string, unknown>;
type Paging = { skip: number; take: number };
type Definition = {
	list(db: DB, page: Paging, query: string): Promise<ManagementRow[]>;
	count(db: DB, query: string): Promise<number>;
	find(db: DB, id: string): Promise<ManagementRow | null>;
	save(db: DB, id: string | undefined, input: unknown): Promise<ManagementRow>;
	remove(db: DB, id: string): Promise<unknown>;
};
export class ManagementError extends Error {
	constructor(
		public code: string,
		public status = 400,
		public field?: string,
	) {
		super(code);
	}
}
export function numericId(raw: string): number {
	if (!/^-?[1-9]\d*$/.test(raw)) throw new ManagementError("invalid_id");
	const value = Number(raw);
	if (!Number.isSafeInteger(value) || value < -2147483648 || value > 2147483647)
		throw new ManagementError("invalid_id");
	return value;
}
function search(fields: string[], query: string) {
	return query
		? {
				OR: fields.map((field) => ({
					[field]: { contains: query, mode: "insensitive" as const },
				})),
			}
		: {};
}
function definition<S extends z.ZodObject>(
	schema: S,
	callbacks: Omit<Definition, "save"> & {
		write(
			db: DB,
			id: string | undefined,
			data: z.output<S>,
		): Promise<ManagementRow>;
	},
): Definition {
	return {
		...callbacks,
		async save(db, id, input) {
			return callbacks.write(db, id, schema.parse(input));
		},
	};
}
const toDay = (value: string) => new Date(`${value}T00:00:00.000Z`);
/**
 * Normaliza una fila para el panel: fechas de día a `YYYY-MM-DD`, decimales a
 * número.
 *
 * El sufijo no es solo `On`: `serviceDate` también es un día y, sin cubrirlo,
 * quedaba como `Date` y el esquema zod la rechazaba en cada actualización.
 */
function plain<T extends Record<string, unknown>>(row: T): T {
	const isDay = (key: string): boolean =>
		key.endsWith("On") || key.endsWith("Date");
	return Object.fromEntries(
		Object.entries(row).map(([key, value]) => [
			key,
			value instanceof Date && isDay(key)
				? value.toISOString().slice(0, 10)
				: Prisma.Decimal.isDecimal(value)
					? Number(value)
					: value,
		]),
	) as T;
}
const fleetIncludes = {
	bus: { select: { number: true, plate: true } },
} as const;
function withBus<T extends { bus?: { number: string; plate: string } | null }>(
	row: T,
) {
	const { bus, ...rest } = row;
	return plain({
		...rest,
		busLabel: bus ? `${bus.number} · ${bus.plate}` : null,
	});
}
export const EXPIRY_WARNING_DAYS = 30;
export function expiryState(day: unknown, today = new Date()) {
	if (typeof day !== "string") return null;
	const days = Math.floor(
		(toDay(day).getTime() - toDay(today.toISOString().slice(0, 10)).getTime()) /
			86_400_000,
	);
	return days < 0
		? "expired"
		: days <= EXPIRY_WARNING_DAYS
			? "expiring"
			: "valid";
}
export const management = {
	rutas: definition(managementSchemas.rutas, {
		list: (db, page, q) =>
			db.route.findMany({
				...page,
				where: search(["code", "name", "origin", "destination"], q),
				orderBy: { code: "asc" },
				select: {
					id: true,
					code: true,
					name: true,
					origin: true,
					destination: true,
					status: true,
				},
			}),
		count: (db, q) =>
			db.route.count({
				where: search(["code", "name", "origin", "destination"], q),
			}),
		find: async (db, id) => {
			const row = await db.route.findUnique({
				where: { id },
				include: { stops: { select: { id: true } } },
			});
			return row && { ...row, stopIds: row.stops.map((stop) => stop.id) };
		},
		write: (db, id, { stopIds, ...data }) =>
			id === undefined
				? db.route.create({
						data: {
							...data,
							id: randomUUID(),
							stops: { connect: stopIds.map((id) => ({ id })) },
						},
					})
				: db.route.update({
						where: { id },
						data: { ...data, stops: { set: stopIds.map((id) => ({ id })) } },
					}),
		remove: (db, id) => db.route.delete({ where: { id } }),
	}),
	autobuses: definition(managementSchemas.autobuses, {
		list: (db, page, q) =>
			db.bus.findMany({
				...page,
				where: search(["number", "plate", "company"], q),
				orderBy: { id: "desc" },
				select: {
					id: true,
					number: true,
					plate: true,
					company: true,
					capacity: true,
					routeId: true,
					status: true,
				},
			}),
		count: (db, q) =>
			db.bus.count({ where: search(["number", "plate", "company"], q) }),
		find: (db, id) => db.bus.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, data) =>
			id === undefined
				? db.bus.create({ data })
				: db.bus.update({ where: { id: numericId(id) }, data }),
		remove: (db, id) => db.bus.delete({ where: { id: numericId(id) } }),
	}),
	paradas: definition(managementSchemas.paradas, {
		list: (db, page, q) =>
			db.stop.findMany({
				...page,
				where: search(["name", "address"], q),
				orderBy: { id: "desc" },
				select: { id: true, name: true, address: true, lat: true, lng: true },
			}),
		count: (db, q) => db.stop.count({ where: search(["name", "address"], q) }),
		find: async (db, id) => {
			const row = await db.stop.findUnique({
				where: { id: numericId(id) },
				include: { routes: { select: { id: true } } },
			});
			return row && { ...row, routeIds: row.routes.map((route) => route.id) };
		},
		write: (db, id, { routeIds, ...data }) =>
			id === undefined
				? db.stop.create({
						data: {
							...data,
							routes: { connect: routeIds.map((id) => ({ id })) },
						},
					})
				: db.stop.update({
						where: { id: numericId(id) },
						data: { ...data, routes: { set: routeIds.map((id) => ({ id })) } },
					}),
		remove: (db, id) => db.stop.delete({ where: { id: numericId(id) } }),
	}),
	horarios: definition(managementSchemas.horarios, {
		list: (db, page, q) =>
			db.schedule.findMany({
				...page,
				where: search(["routeId", "departure", "arrival", "days"], q),
				orderBy: { id: "desc" },
			}),
		count: (db, q) =>
			db.schedule.count({
				where: search(["routeId", "departure", "arrival", "days"], q),
			}),
		find: (db, id) => db.schedule.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, data) =>
			id === undefined
				? db.schedule.create({ data })
				: db.schedule.update({ where: { id: numericId(id) }, data }),
		remove: (db, id) => db.schedule.delete({ where: { id: numericId(id) } }),
	}),
	conductores: definition(managementSchemas.conductores, {
		list: (db, page, q) =>
			db.driver.findMany({
				...page,
				where: search(["name", "phone", "license", "busNumber"], q),
				orderBy: { id: "desc" },
			}),
		count: (db, q) =>
			db.driver.count({
				where: search(["name", "phone", "license", "busNumber"], q),
			}),
		find: (db, id) => db.driver.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, data) =>
			id === undefined
				? db.driver.create({ data })
				: db.driver.update({ where: { id: numericId(id) }, data }),
		remove: (db, id) => db.driver.delete({ where: { id: numericId(id) } }),
	}),
	notificaciones: definition(managementSchemas.notificaciones, {
		list: (db, page, q) =>
			db.notification.findMany({
				...page,
				where: search(["title", "desc", "type"], q),
				orderBy: { id: "desc" },
			}),
		count: (db, q) =>
			db.notification.count({ where: search(["title", "desc", "type"], q) }),
		find: (db, id) =>
			db.notification.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, data) =>
			id === undefined
				? db.notification.create({ data })
				: db.notification.update({ where: { id: numericId(id) }, data }),
		remove: (db, id) =>
			db.notification.delete({ where: { id: numericId(id) } }),
	}),
	reportes: definition(managementSchemas.reportes, {
		list: async (db, page, q) =>
			(
				await db.report.findMany({
					...page,
					where: search(["lineId", "stop", "comment", "action"], q),
					orderBy: { id: "desc" },
				})
			).map(plain),
		count: (db, q) =>
			db.report.count({
				where: search(["lineId", "stop", "comment", "action"], q),
			}),
		find: async (db, id) => {
			const row = await db.report.findUnique({
				where: { id: numericId(id) },
			});
			return row && plain(row);
		},
		write: (db, id, { serviceDate, ...data }) => {
			// `serviceDate` llega como "YYYY-MM-DD" desde el formulario y Prisma
			// espera un DateTime. Sin la conversión, o bien la base recibe un string
			// o bien no se le pone fecha y el reporte queda fuera del agregado.
			const payload = { ...data, serviceDate: toDay(serviceDate) };
			return id === undefined
				? // Creado desde el panel: es un reporte del operador, no ciudadano.
					// Solo se fija aquí — al actualizar no se envía `source`, de modo que
					// un reporte de origen ciudadano no deja de serlo al editarlo.
					db.report
						.create({ data: { ...payload, source: "operator" } })
						.then(plain)
				: db.report
						.update({ where: { id: numericId(id) }, data: payload })
						.then(plain);
		},
		remove: (db, id) => db.report.delete({ where: { id: numericId(id) } }),
	}),
	oficinas: definition(managementSchemas.oficinas, {
		list: (db, page, q) =>
			db.office.findMany({
				...page,
				where: search(["name", "address", "city"], q),
				orderBy: [{ order: "asc" }, { id: "asc" }],
			}),
		count: (db, q) =>
			db.office.count({ where: search(["name", "address", "city"], q) }),
		find: (db, id) => db.office.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, data) =>
			id === undefined
				? db.office.create({ data })
				: db.office.update({ where: { id: numericId(id) }, data }),
		remove: (db, id) => db.office.delete({ where: { id: numericId(id) } }),
	}),
	presupuestos: definition(managementSchemas.presupuestos, {
		list: (db, page, q) =>
			db.budget.findMany({
				...page,
				where: search(
					["clientName", "email", "departureCity", "arrivalCity"],
					q,
				),
				orderBy: { id: "desc" },
			}),
		count: (db, q) =>
			db.budget.count({
				where: search(
					["clientName", "email", "departureCity", "arrivalCity"],
					q,
				),
			}),
		find: (db, id) => db.budget.findUnique({ where: { id } }),
		write: (db, id, data) =>
			id === undefined
				? db.budget.create({ data: { ...data, id: randomUUID() } })
				: db.budget.update({ where: { id }, data }),
		remove: (db, id) => db.budget.delete({ where: { id } }),
	}),
	lineas: definition(managementSchemas.lineas, {
		list: (db, page, q) =>
			db.line.findMany({
				...page,
				where: search(["name"], q),
				orderBy: { id: "asc" },
			}),
		count: (db, q) => db.line.count({ where: search(["name"], q) }),
		find: (db, id) => db.line.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, data) =>
			id === undefined
				? db.line.create({ data })
				: db.line.update({ where: { id: numericId(id) }, data }),
		remove: (db, id) => db.line.delete({ where: { id: numericId(id) } }),
	}),
	"horarios-linea": definition(managementSchemas["horarios-linea"], {
		list: (db, page, q) =>
			db.schedulesOnLine.findMany({
				...page,
				where: search(["originTown", "destinationTown", "departureTime"], q),
				orderBy: { id: "desc" },
				select: {
					id: true,
					lineId: true,
					originTown: true,
					destinationTown: true,
					departureTime: true,
					arrivalTime: true,
					duration: true,
				},
			}),
		count: (db, q) =>
			db.schedulesOnLine.count({
				where: search(["originTown", "destinationTown", "departureTime"], q),
			}),
		find: (db, id) =>
			db.schedulesOnLine.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, { lineId, stopsJson }) => {
			const first = stopsJson[0],
				last = stopsJson[stopsJson.length - 1];
			const minutes = (time: string) =>
				Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
			const data = {
				lineId,
				stopsJson,
				originTown: first.town,
				destinationTown: last.town,
				departureTime: first.time,
				arrivalTime: last.time,
				duration: `${minutes(last.time) - minutes(first.time)} min`,
			};
			return id === undefined
				? db.schedulesOnLine.create({ data })
				: db.schedulesOnLine.update({ where: { id: numericId(id) }, data });
		},
		remove: (db, id) =>
			db.schedulesOnLine.delete({ where: { id: numericId(id) } }),
	}),
	conexiones: definition(managementSchemas.conexiones, {
		list: (db, page, q) =>
			db.lineConnection.findMany({
				...page,
				where: search(["atStop"], q),
				orderBy: { id: "desc" },
			}),
		count: (db, q) => db.lineConnection.count({ where: search(["atStop"], q) }),
		find: (db, id) =>
			db.lineConnection.findUnique({ where: { id: numericId(id) } }),
		write: (db, id, data) =>
			id === undefined
				? db.lineConnection.create({ data })
				: db.lineConnection.update({ where: { id: numericId(id) }, data }),
		remove: (db, id) =>
			db.lineConnection.delete({ where: { id: numericId(id) } }),
	}),
	documentos: definition(managementSchemas.documentos, {
		list: async (db, page, q) =>
			(
				await db.vehicleDocument.findMany({
					...page,
					where: search(["reference", "docType"], q),
					orderBy: { expiresOn: "asc" },
					include: fleetIncludes,
				})
			)
				.map(withBus)
				.map((row) => ({ ...row, expiryState: expiryState(row.expiresOn) })),
		count: (db, q) =>
			db.vehicleDocument.count({ where: search(["reference", "docType"], q) }),
		find: async (db, id) => {
			const row = await db.vehicleDocument.findUnique({
				where: { id: numericId(id) },
			});
			return row && plain(row);
		},
		write: (db, id, { expiresOn, ...rest }) => {
			const data = { ...rest, expiresOn: toDay(expiresOn) };
			return id === undefined
				? db.vehicleDocument.create({ data }).then(plain)
				: db.vehicleDocument
						.update({ where: { id: numericId(id) }, data })
						.then(plain);
		},
		remove: (db, id) =>
			db.vehicleDocument.delete({ where: { id: numericId(id) } }),
	}),
	incidencias: definition(managementSchemas.incidencias, {
		list: async (db, page, q) =>
			(
				await db.incident.findMany({
					...page,
					where: search(["description"], q),
					orderBy: [{ occurredOn: "desc" }, { id: "desc" }],
					include: fleetIncludes,
				})
			).map(withBus),
		count: (db, q) => db.incident.count({ where: search(["description"], q) }),
		find: async (db, id) => {
			const row = await db.incident.findUnique({
				where: { id: numericId(id) },
			});
			return row && plain(row);
		},
		write: (db, id, { occurredOn, ...rest }) => {
			const data = { ...rest, occurredOn: toDay(occurredOn) };
			return id === undefined
				? db.incident.create({ data }).then(plain)
				: db.incident
						.update({ where: { id: numericId(id) }, data })
						.then(plain);
		},
		remove: (db, id) => db.incident.delete({ where: { id: numericId(id) } }),
	}),
	mantenimiento: definition(managementSchemas.mantenimiento, {
		list: async (db, page, q) =>
			(
				await db.maintenance.findMany({
					...page,
					where: search(["description"], q),
					orderBy: [{ serviceOn: "desc" }, { id: "desc" }],
					include: fleetIncludes,
				})
			).map(withBus),
		count: (db, q) =>
			db.maintenance.count({ where: search(["description"], q) }),
		find: async (db, id) => {
			const row = await db.maintenance.findUnique({
				where: { id: numericId(id) },
			});
			return row && plain(row);
		},
		write: (db, id, { serviceOn, ...rest }) => {
			const data = { ...rest, serviceOn: toDay(serviceOn) };
			return id === undefined
				? db.maintenance.create({ data }).then(plain)
				: db.maintenance
						.update({ where: { id: numericId(id) }, data })
						.then(plain);
		},
		remove: (db, id) => db.maintenance.delete({ where: { id: numericId(id) } }),
	}),
	// Escalados por ventana de servicio. El operador puede aquí reconocer o
	// cerrar una incidencia, que es lo que antes no existía: el contador de
	// reportes se acumulaba para siempre sin forma de resetearlo.
	escalaciones: definition(managementSchemas.escalaciones, {
		list: (db, page, q) =>
			db.escalation.findMany({
				...page,
				where: search(["lineId", "status", "resolvedBy", "note"], q),
				orderBy: [{ status: "asc" }, { serviceDate: "desc" }, { id: "desc" }],
			}),
		count: (db, q) =>
			db.escalation.count({
				where: search(["lineId", "status", "resolvedBy", "note"], q),
			}),
		find: async (db, id) => {
			const row = await db.escalation.findUnique({
				where: { id: numericId(id) },
				include: { reports: true },
			});
			return row && plain(row);
		},
		write: async (db, id, { serviceDate, status, resolvedBy, ...rest }) => {
			// La ventana se deriva del día de servicio: es lo que acota el umbral a
			// un solo día. El CHECK exige que `resolvedAt` exista si y solo si el
			// estado es `resolved`.
			const { start, end } = serviceWindow(
				new Date(`${serviceDate}T12:00:00Z`),
			);

			if (id === undefined) {
				return db.escalation
					.create({
						data: {
							...rest,
							serviceDate: start,
							windowStart: start,
							windowEnd: end,
							status,
							resolvedAt: status === "resolved" ? new Date() : null,
							resolvedBy: status === "resolved" ? resolvedBy || null : null,
						},
					})
					.then(plain);
			}

			// En una actualización, `negativeCount` y `threshold` son propiedad del
			// sistema: los calcula `addReport` al abrir el escalado. Si el formulario
			// pudiera reescribirlos, la traza que respalda la reclamación sería
			// manipulable desde el propio panel.
			// `resolvedAt` solo se fija la primera vez: re-sellar en cada guardado
			// destruye la fecha real de resolución.
			const current = await db.escalation.findUnique({
				where: { id: numericId(id) },
			});
			const becomesResolved = status === "resolved" && !current?.resolvedAt;

			return db.escalation
				.update({
					where: { id: numericId(id) },
					data: {
						lineId: rest.lineId,
						note: rest.note,
						serviceDate: start,
						windowStart: start,
						windowEnd: end,
						status,
						...(becomesResolved ? { resolvedAt: new Date() } : {}),
						// Salir de "resolved" obliga a limpiar `resolvedAt` por el CHECK,
						// y también `resolvedBy`: `status=open` con un resolvedBy es una
						// fila contradictoria.
						...(status === "resolved"
							? { resolvedBy: resolvedBy || current?.resolvedBy || "" }
							: { resolvedAt: null, resolvedBy: "" }),
					},
				})
				.then(plain);
		},
		remove: async (db, id) => {
			// El borrado en cascada se llevaría por delante los reportes que son la
			// evidencia. Se rechaza mientras queden enlazados.
			const linked = await db.escalation.count({
				where: { id: numericId(id), reports: { some: {} } },
			});
			if (linked > 0) {
				throw new ManagementError("escalation_has_evidence", 400, "reports");
			}
			return db.escalation.delete({ where: { id: numericId(id) } });
		},
	}),
} satisfies Record<ResourceName, Definition>;

async function checkReferences(
	db: DB,
	resource: ResourceName,
	data: Record<string, unknown>,
) {
	for (const field of managementFields(resource)) {
		const value = data[field.name];
		if (!field.relation || value === null || value === undefined) continue;
		let exists = false;
		switch (field.relation) {
			case "routes":
				exists =
					typeof value === "string" &&
					Boolean(
						await db.route.findUnique({
							where: { id: value },
							select: { id: true },
						}),
					);
				break;
			case "lines":
				exists =
					typeof value === "number" &&
					Boolean(
						await db.line.findUnique({
							where: { id: value },
							select: { id: true },
						}),
					);
				break;
			case "drivers":
				exists =
					typeof value === "number" &&
					Boolean(
						await db.driver.findUnique({
							where: { id: value },
							select: { id: true },
						}),
					);
				break;
			case "buses":
				exists =
					typeof value === "string" &&
					Boolean(
						await db.bus.findUnique({
							where: { number: value },
							select: { id: true },
						}),
					);
				break;
			case "vehicles":
				exists =
					typeof value === "number" &&
					Boolean(
						await db.bus.findUnique({
							where: { id: value },
							select: { id: true },
						}),
					);
				break;
			case "users":
				exists =
					typeof value === "number" &&
					Boolean(
						await db.user.findUnique({
							where: { id: value },
							select: { id: true },
						}),
					);
				break;
		}
		if (!exists)
			throw new ManagementError("invalid_reference", 400, field.name);
	}
	if (resource === "rutas") {
		const { stopIds } = managementSchemas.rutas.parse(data);
		if (
			(await db.stop.count({ where: { id: { in: stopIds } } })) !==
			stopIds.length
		)
			throw new ManagementError("invalid_reference", 400, "stopIds");
	}
	if (resource === "paradas") {
		const { routeIds } = managementSchemas.paradas.parse(data);
		if (
			(await db.route.count({ where: { id: { in: routeIds } } })) !==
			routeIds.length
		)
			throw new ManagementError("invalid_reference", 400, "routeIds");
	}
	if (resource === "conexiones") {
		const { fromLineId, toLineId, atStop } =
			managementSchemas.conexiones.parse(data);
		for (const lineId of [fromLineId, toLineId]) {
			const schedules = await db.schedulesOnLine.findMany({
				where: { lineId },
				select: { stopsJson: true },
			});
			const hasStop = schedules.some((schedule) => {
				const stops = managementSchemas[
					"horarios-linea"
				].shape.stopsJson.safeParse(schedule.stopsJson);
				return (
					stops.success &&
					stops.data.some((stop) => `${stop.town} — ${stop.name}` === atStop)
				);
			});
			if (!hasStop)
				throw new ManagementError("invalid_connection_stop", 400, "atStop");
		}
	}
}
async function protectDelete(
	db: DB,
	resource: ResourceName,
	row: ManagementRow,
) {
	const id = String(row.id);
	let dependencies = 0;
	switch (resource) {
		case "rutas":
			dependencies = (
				await Promise.all([
					db.bus.count({ where: { routeId: id } }),
					db.driver.count({ where: { routeId: id } }),
					db.schedule.count({ where: { routeId: id } }),
					db.notification.count({ where: { routeId: id } }),
					db.report.count({ where: { lineId: id } }),
					db.favoriteRoute.count({ where: { routeId: id } }),
					db.stop.count({ where: { routes: { some: { id } } } }),
				])
			).reduce((total, count) => total + count, 0);
			break;
		case "autobuses": {
			const busId = numericId(id);
			dependencies = (
				await Promise.all([
					typeof row.number === "string"
						? db.driver.count({ where: { busNumber: row.number } })
						: 0,
					db.vehicleDocument.count({ where: { busId } }),
					db.incident.count({ where: { busId } }),
					db.maintenance.count({ where: { busId } }),
				])
			).reduce((total, count) => total + count, 0);
			break;
		}
		case "conductores":
			dependencies =
				(await db.route.count({ where: { driverId: numericId(id) } })) +
				(await db.incident.count({ where: { driverId: numericId(id) } }));
			break;
		case "paradas":
			dependencies = await db.route.count({
				where: { stops: { some: { id: numericId(id) } } },
			});
			break;
		case "lineas":
			dependencies =
				(await db.schedulesOnLine.count({ where: { lineId: numericId(id) } })) +
				(await db.lineConnection.count({
					where: {
						OR: [{ fromLineId: numericId(id) }, { toLineId: numericId(id) }],
					},
				}));
			break;
		case "horarios-linea":
			await protectScheduleConnections(db, row);
			break;
	}
	if (dependencies > 0) throw new ManagementError("has_dependencies", 409);
}
async function protectScheduleConnections(
	db: DB,
	existing: ManagementRow,
	replacement?: Record<string, unknown>,
) {
	if (typeof existing.lineId !== "number") return;
	const connections = await db.lineConnection.findMany({
		where: {
			OR: [{ fromLineId: existing.lineId }, { toLineId: existing.lineId }],
		},
		select: { atStop: true },
	});
	if (!connections.length) return;
	const remaining = await db.schedulesOnLine.findMany({
		where: {
			lineId: existing.lineId,
			NOT: { id: numericId(String(existing.id)) },
		},
		select: { stopsJson: true },
	});
	const schedules: unknown[] = remaining.map((row) => row.stopsJson);
	if (replacement?.lineId === existing.lineId)
		schedules.push(replacement.stopsJson);
	for (const connection of connections) {
		const hasStop = schedules.some((value) => {
			const parsed =
				managementSchemas["horarios-linea"].shape.stopsJson.safeParse(value);
			return (
				parsed.success &&
				parsed.data.some(
					(stop) => `${stop.town} — ${stop.name}` === connection.atStop,
				)
			);
		});
		if (!hasStop)
			throw new ManagementError("has_dependencies", 409, "stopsJson");
	}
}
export const pageSchema = z.object({
	page: z.coerce.number().int().min(1).max(100000).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(25),
	q: z.string().trim().max(200).default(""),
});
export async function listManagement(
	resource: ResourceName,
	options: z.output<typeof pageSchema>,
) {
	const adapter: Definition = management[resource];
	return prisma().$transaction(
		async (db) => ({
			rows: await adapter.list(
				db,
				{ skip: (options.page - 1) * options.limit, take: options.limit },
				options.q,
			),
			total: await adapter.count(db, options.q),
			page: options.page,
			limit: options.limit,
		}),
		{ isolationLevel: "RepeatableRead" },
	);
}
export async function findManagement(resource: ResourceName, id: string) {
	const adapter: Definition = management[resource];
	const row = await adapter.find(prisma(), id);
	if (!row) throw new ManagementError("not_found", 404);
	return row;
}
export async function mutateManagement(
	resource: ResourceName,
	id: string | undefined,
	input: unknown,
	remove = false,
) {
	const adapter: Definition = management[resource];
	return prisma().$transaction(
		async (db) => {
			const existing = id === undefined ? null : await adapter.find(db, id);
			if (id !== undefined && !existing)
				throw new ManagementError("not_found", 404);
			if (remove) {
				if (!existing || id === undefined)
					throw new ManagementError("not_found", 404);
				await protectDelete(db, resource, existing);
				await adapter.remove(db, id);
				return { id: existing.id };
			}
			if (typeof input !== "object" || input === null || Array.isArray(input))
				throw new ManagementError("invalid_body");
			if (Object.keys(input).length === 0)
				throw new ManagementError("validation_failed");
			const schema = managementSchemas[resource];
			const current = existing
				? Object.fromEntries(
						Object.keys(schema.shape).map((key) => [key, existing[key]]),
					)
				: {};
			const data = schema.parse({ ...current, ...input });
			await checkReferences(db, resource, data);
			if (resource === "horarios-linea" && existing)
				await protectScheduleConnections(db, existing, data);
			if (
				resource === "autobuses" &&
				existing &&
				data &&
				"number" in data &&
				data.number !== existing.number &&
				typeof existing.number === "string"
			) {
				if (await db.driver.count({ where: { busNumber: existing.number } }))
					throw new ManagementError("has_dependencies", 409, "number");
			}
			return adapter.save(db, id, data);
		},
		{ isolationLevel: "Serializable", timeout: 15000 },
	);
}
export async function relationOptions() {
	const db = prisma();
	const [routes, stops, drivers, buses, users, lines] = await Promise.all([
		db.route.findMany({
			take: 200,
			orderBy: { code: "asc" },
			select: { id: true, name: true },
		}),
		db.stop.findMany({
			take: 200,
			orderBy: { id: "asc" },
			select: { id: true, name: true },
		}),
		db.driver.findMany({
			take: 200,
			orderBy: { id: "asc" },
			select: { id: true, name: true },
		}),
		db.bus.findMany({
			take: 200,
			orderBy: { id: "asc" },
			select: { id: true, number: true, plate: true },
		}),
		db.user.findMany({
			take: 200,
			orderBy: { id: "asc" },
			select: { id: true, name: true },
		}),
		db.line.findMany({
			take: 200,
			orderBy: { id: "asc" },
			select: { id: true, name: true },
		}),
	]);
	return {
		routes,
		stops,
		drivers,
		buses: buses.map((bus) => ({ id: bus.number, name: bus.plate })),
		vehicles: buses.map((bus) => ({
			id: bus.id,
			name: `${bus.number} · ${bus.plate}`,
		})),
		users,
		lines,
	};
}
export function managementError(error: unknown): {
	status: number;
	body: Record<string, unknown>;
} {
	if (error instanceof ManagementError)
		return {
			status: error.status,
			body: { error: error.code, field: error.field },
		};
	if (error instanceof z.ZodError)
		return {
			status: 400,
			body: {
				error: "validation_failed",
				issues: error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			},
		};
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === "P2002")
			return { status: 409, body: { error: "conflict" } };
		if (error.code === "P2025")
			return { status: 404, body: { error: "not_found" } };
		if (error.code === "P2003")
			return { status: 409, body: { error: "has_dependencies" } };
		if (error.code === "P2034")
			return { status: 409, body: { error: "concurrent_change" } };
	}
	console.error(
		"Management database operation failed",
		error instanceof Error ? error.name : typeof error,
	);
	return { status: 503, body: { error: "database_unavailable" } };
}
