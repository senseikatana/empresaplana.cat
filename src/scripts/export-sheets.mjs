import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createDb } from "./lib/db.mjs";
import {
	ROOT,
	buildSpreadsheet,
	loadEnv,
	toCsv,
} from "./lib/sheets-format.mjs";

const env = loadEnv();
const db = createDb(env);
await db.connect();

const linesRes = await db.query(
	'SELECT id, name, "pdfUrl" FROM "Line" ORDER BY id',
);
const schedRes = await db.query(
	'SELECT "lineId", "stopsJson", "departureTime" FROM "SchedulesOnLine" ORDER BY "departureTime"',
);
const connRes = await db.query(
	'SELECT "fromLineId", "atStop", "toLineId", "waitMin" FROM "LineConnection" ORDER BY "fromLineId", "toLineId"',
);

const lines = linesRes.rows.map((r) => ({
	id: Number(r.id),
	name: String(r.name),
	pdfUrl: String(r.pdfUrl),
}));
const connections = connRes.rows.map((r) => ({
	fromLineId: Number(r.fromLineId),
	atStop: String(r.atStop),
	toLineId: Number(r.toLineId),
	waitMin: Number(r.waitMin),
}));
const schedulesByLine = new Map();
for (const r of schedRes.rows) {
	const lineId = Number(r.lineId);
	const raw = r.stopsJson;
	const stops = typeof raw === "string" ? JSON.parse(raw) : raw;
	if (!schedulesByLine.has(lineId)) schedulesByLine.set(lineId, []);
	schedulesByLine
		.get(lineId)
		.push({ departureTime: String(r.departureTime), stops });
}

await db.end();

const out = buildSpreadsheet(lines, schedulesByLine, connections);
const outDir = path.join(ROOT, "sheets-export");
mkdirSync(outDir, { recursive: true });

for (const [tab, rows] of Object.entries(out)) {
	const file = path.join(outDir, `${tab.replace(/[/\\]/g, "-")}.csv`);
	writeFileSync(file, toCsv(rows));
	console.log(`   ${file}`);
}
console.log(
	`\n${Object.keys(out).length} archivos exportados a sheets-export/`,
);
