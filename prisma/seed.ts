/**
 * Run: bun run db:seed (users), or bun run db:seed --demo (business demo).
 * Demo IDs are negative or prefixed with "demo-" to avoid normal generated IDs.
 * Existing rows are preserved; no real timetables are imported by this script.
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEMO_USERS = [
  {
    username: "cliente",
    name: "Marc",
    fullName: "Marc Vidal Roca",
    email: "marc.vidal@example.cat",
    phone: "+34 600 111 222",
    role: "client",
  },
  {
    username: "trabajador",
    name: "Laura",
    fullName: "Laura Ferrer Solé",
    email: "laura.ferrer@empresaplana.cat",
    phone: "+34 600 333 444",
    role: "worker",
  },
  {
    username: "admin",
    name: "Sergi",
    fullName: "Sergi Plana",
    email: "sergi.plana@empresaplana.cat",
    phone: "+34 600 555 666",
    role: "admin",
  },
] as const;

async function main() {
  console.log("Seeding Empresa Plana demo users...");

  for (const user of DEMO_USERS) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: {
        username: user.username,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  }
  console.log(`  ✓ ${DEMO_USERS.length} users`);
  if (process.argv.includes("--demo")) {
    await seedBusinessDemo();
  }
  console.log("Seeding complete.");
}

async function seedBusinessDemo() {
  console.log(
    "Loading DEMO data only: schedules are fictional, not for travel.",
  );
  await prisma.$transaction(
    async (db) => {
      const client = await db.user.findUniqueOrThrow({
        where: { username: "cliente" },
      });
      const admin = await db.user.findUniqueOrThrow({
        where: { username: "admin" },
      });
      const stops = [
        {
          id: -1001,
          town: "Tarragona",
          name: "[DEMO] Tarragona",
          lat: 41.1189,
          lng: 1.2445,
        },
        {
          id: -1002,
          town: "La Pineda",
          name: "[DEMO] La Pineda",
          lat: 41.0763,
          lng: 1.1803,
        },
        {
          id: -1003,
          town: "Salou",
          name: "[DEMO] Salou",
          lat: 41.0767,
          lng: 1.1416,
        },
        {
          id: -1004,
          town: "Cambrils",
          name: "[DEMO] Cambrils",
          lat: 41.067,
          lng: 1.059,
        },
      ];
      for (const stop of stops) {
        await db.stop.upsert({
          where: { id: stop.id },
          update: {},
          create: {
            id: stop.id,
            name: stop.name,
            address: "DEMO - ubicacion aproximada, no es una parada oficial",
            lat: stop.lat,
            lng: stop.lng,
          },
        });
      }

      const routes = [
        {
          id: "demo-costa",
          code: "DEMO-1",
          lineId: -1001,
          name: "[DEMO] Tarragona - La Pineda - Salou",
          stops: stops.slice(0, 3),
          times: ["08:00", "08:20", "08:30"],
        },
        {
          id: "demo-cambrils",
          code: "DEMO-2",
          lineId: -1002,
          name: "[DEMO] Salou - Cambrils",
          stops: stops.slice(2),
          times: ["08:35", "08:55"],
        },
      ];
      for (const [index, route] of routes.entries()) {
        const id = -1001 - index;
        const origin = route.stops[0].town;
        const destination = route.stops[route.stops.length - 1].town;
        await db.driver.upsert({
          where: { id },
          update: {},
          create: {
            id,
            name: `[DEMO] Conductor ${index + 1}`,
            license: "DEMO-NO-VALIDA",
            busNumber: route.code,
            routeId: route.id,
            shiftDays: "DEMO",
            shiftHours: "08:00-10:00",
          },
        });
        await db.route.upsert({
          where: { id: route.id },
          update: {},
          create: {
            id: route.id,
            code: route.code,
            name: route.name,
            origin,
            destination,
            driverId: id,
            path: route.stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
            stops: { connect: route.stops.map((stop) => ({ id: stop.id })) },
          },
        });
        await db.bus.upsert({
          where: { number: route.code },
          update: {},
          create: {
            id,
            number: route.code,
            plate: `DEMO-${index + 1}`,
            company: "[DEMO] Flota de prueba",
            capacity: 50,
            routeId: route.id,
            gps: { lat: route.stops[0].lat, lng: route.stops[0].lng },
          },
        });
        await db.line.upsert({
          where: { id: route.lineId },
          update: {},
          create: { id: route.lineId, name: route.name, pdfUrl: "" },
        });
        for (let departure = 0; departure < 2; departure++) {
          const scheduleId = -1001 - index * 2 - departure;
          const times = route.times.map((time) => {
            const [hour, minute] = time.split(":");
            return `${String(Number(hour) + departure).padStart(2, "0")}:${minute}`;
          });
          await db.schedule.upsert({
            where: { id: scheduleId },
            update: {},
            create: {
              id: scheduleId,
              routeId: route.id,
              departure: times[0],
              arrival: times[times.length - 1],
              frequency: "DEMO - 60 min",
              days: "DEMO - horario ficticio",
            },
          });
          await db.schedulesOnLine.upsert({
            where: { id: scheduleId },
            update: {},
            create: {
              id: scheduleId,
              lineId: route.lineId,
              originTown: origin,
              destinationTown: destination,
              departureTime: times[0],
              arrivalTime: times[times.length - 1],
              duration: index === 0 ? "30 min" : "20 min",
              stopsJson: route.stops.map((stop, position) => ({
                town: stop.town,
                name: stop.name,
                time: times[position],
                lat: stop.lat,
                lon: stop.lng,
              })),
            },
          });
        }
      }
      await db.lineConnection.upsert({
        where: { id: -1001 },
        update: {},
        create: {
          id: -1001,
          fromLineId: -1001,
          toLineId: -1002,
          atStop: "Salou — [DEMO] Salou",
          waitMin: 5,
        },
      });
      await db.office.upsert({
        where: { id: -1001 },
        update: {},
        create: {
          id: -1001,
          name: "[DEMO] Oficina virtual",
          address: "DEMO - sin direccion de atencion real",
          city: "Tarragona",
          purpose: "Datos de prueba; no acudir a esta ubicacion",
        },
      });
      for (const [index, status] of ["received", "reviewing"].entries()) {
        const id = `demo-budget-${index + 1}`;
        await db.budget.upsert({
          where: { id },
          update: {},
          create: {
            id,
            userId: client.id,
            clientName: "[DEMO] Cliente de prueba",
            email: "cliente@example.invalid",
            phone: "",
            company: "[DEMO] Empresa ficticia",
            reasonId: "demo",
            description:
              "DEMO - solicitud ficticia, no requiere gestion comercial",
            departureCity: "Tarragona",
            arrivalCity: "Salou",
            departureTime: "08:00",
            arrivalTime: "08:30",
            people: "25",
            status,
          },
        });
      }
      await db.favoriteRoute.upsert({
        where: { userId_routeId: { userId: client.id, routeId: "demo-costa" } },
        update: {},
        create: { userId: client.id, routeId: "demo-costa" },
      });
      await db.recentSearch.upsert({
        where: { id: -1001 },
        update: {},
        create: {
          id: -1001,
          userId: client.id,
          origin: "Tarragona",
          destination: "Salou",
        },
      });
      await db.notification.upsert({
        where: { id: -1001 },
        update: {},
        create: {
          id: -1001,
          type: "info",
          title: "[DEMO] Flota de prueba cargada",
          desc: "Los horarios y solicitudes son ficticios. No usarlos para viajar.",
          routeId: "demo-costa",
        },
      });
      await db.activity.upsert({
        where: { id: -1001 },
        update: {},
        create: {
          id: -1001,
          action: "[DEMO] Inicializacion de datos de prueba",
          user: "DEMO seed",
        },
      });
      await db.report.upsert({
        where: { id: -1001 },
        update: {},
        create: {
          id: -1001,
          lineId: "demo-costa",
          stop: "[DEMO] Salou",
          action: "late",
          minutesLate: 5,
          comment: "DEMO - incidencia ficticia",
        },
      });
      await db.conversation.upsert({
        where: { id: -1001 },
        update: {},
        create: { id: -1001, type: "support" },
      });
      for (const user of [client, admin]) {
        await db.conversationParticipant.upsert({
          where: {
            conversationId_userId: { conversationId: -1001, userId: user.id },
          },
          update: {},
          create: { conversationId: -1001, userId: user.id, role: user.role },
        });
      }
      await db.message.upsert({
        where: { id: -1001 },
        update: {},
        create: {
          id: -1001,
          conversationId: -1001,
          senderId: client.id,
          senderRole: client.role,
          body: "[DEMO] Mensaje de prueba. No es una consulta real.",
        },
      });
    },
    { timeout: 120_000 },
  );
  console.log(
    "  ✓ DEMO fleet, timetables, offices, budgets, favorites, reports and chat",
  );
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
