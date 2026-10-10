import { SignJWT } from "jose";
import { createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createDb } from "./lib/db.mjs";
import { ROOT, loadEnv, parseSpreadsheet } from "./lib/sheets-format.mjs";

const env = loadEnv();
const credPath = env.GOOGLE_SERVICE_ACCOUNT_JSON;
const spreadsheetId = env.GOOGLE_SPREADSHEET_ID;

if (!credPath || !spreadsheetId) {
	console.error(
		"Faltan GOOGLE_SERVICE_ACCOUNT_JSON y/o GOOGLE_SPREADSHEET_ID en .env",
	);
	process.exit(1);
}

const creds = JSON.parse(readFileSync(path.join(ROOT, credPath), "utf8"));
const now = Math.floor(Date.now() / 1000);

const jwt = await new SignJWT({
	scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
	aud: "https://oauth2.googleapis.com/token",
	iat: now,
	exp: now + 3600,
	iss: creds.client_email,
})
	.setProtectedHeader({ alg: "RS256", typ: "JWT" })
	.sign(createPrivateKey(creds.private_key));

const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
	method: "POST",
	headers: { "Content-Type": "application/x-www-form-urlencoded" },
	body: new URLSearchParams({
		grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
		assertion: jwt,
	}),
});
const tokenJson = await tokenRes.json();
if (!tokenJson.access_token) {
	console.error(
		"Error obteniendo access token:",
		JSON.stringify(tokenJson).slice(0, 400),
	);
	process.exit(1);
}
const accessToken = tokenJson.access_token;

async function sheetJson(url) {
	const res = await fetch(url, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
	return res.json();
}

const api = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

console.log("1) leyendo spreadsheet ...");
const info = await sheetJson(`${api}?fields=sheets.properties.title`);
const tabs = [];
for (const sheet of info.sheets) {
	const title = sheet.properties.title;
	const data = await sheetJson(`${api}/values/${encodeURIComponent(title)}`);
	tabs.push({ title, values: data.values ?? [] });
	console.log(`   tab "${title}" (${(data.values ?? []).length} filas)`);
}

const { lines, schedules, connections } = parseSpreadsheet(tabs);
console.log(
	`2) parseadas ${lines.size} líneas, ${schedules.length} salidas, ${connections.length} conexiones`,
);

const db = createDb(env);
await db.connect();

console.log("3) limpiando tablas ...");
await db.query('DELETE FROM "LineConnection"');
await db.query('DELETE FROM "SchedulesOnLine"');
await db.query('DELETE FROM "Line"');

for (const [id, l] of lines.entries()) {
	await db.query('INSERT INTO "Line" (id, name, "pdfUrl") VALUES ($1, $2, $3)', [
		id,
		l.name,
		l.pdfUrl,
	]);
}
console.log(`   ${lines.size} líneas insertadas`);

for (const s of schedules) {
	await db.query(
		'INSERT INTO "SchedulesOnLine" ("lineId", "originTown", "destinationTown", "departureTime", "arrivalTime", "duration", "stopsJson") VALUES ($1, $2, $3, $4, $5, $6, $7)',
		[
			s.lineId,
			s.originTown,
			s.destinationTown,
			s.departureTime,
			s.arrivalTime,
			s.duration,
			JSON.stringify(s.stops),
		],
	);
}
console.log(`   ${schedules.length} salidas insertadas`);

for (const c of connections) {
	await db.query(
		'INSERT INTO "LineConnection" ("fromLineId", "atStop", "toLineId", "waitMin") VALUES ($1, $2, $3, $4)',
		[c.fromLineId, c.atStop, c.toLineId, c.waitMin],
	);
}
console.log(`   ${connections.length} conexiones insertadas`);

const counts = await db.query(
	'SELECT (SELECT count(*) FROM "Line") AS l, (SELECT count(*) FROM "SchedulesOnLine") AS s, (SELECT count(*) FROM "LineConnection") AS c',
);
console.log("4) verificación:", counts.rows[0]);

await db.end();
