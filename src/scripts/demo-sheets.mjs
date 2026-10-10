import { SignJWT } from "jose";
import { createPrivateKey } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ROOT, loadEnv } from "./lib/sheets-format.mjs";

/**
 * Escribe datos de EJEMPLO (2 líneas con horarios) en la hoja plantilla.
 * Útil para probar el pipeline sheets → Postgres (bun run sync:sheets)
 * y para ver el formato en el browser. No lee la DB.
 */

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
	scope: "https://www.googleapis.com/auth/spreadsheets",
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
	console.error("Error obteniendo access token:", JSON.stringify(tokenJson).slice(0, 400));
	process.exit(1);
}
const accessToken = tokenJson.access_token;
const api = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

async function sheetsApi(url, options = {}) {
	const res = await fetch(url, {
		...options,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			...(options.headers ?? {}),
		},
	});
	if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
	return res.json();
}

const out = {
	LÍNEAS: [
		["id", "nombre", "pdf_url"],
		["46", "Tarragona – Cambrils", "https://empresaplana.cat/descargas/46.pdf"],
		["11", "Salou – Reus", "https://empresaplana.cat/descargas/11.pdf"],
	],
	"46 - Tarragona – Cambrils": [
		["Tarragona — Estació d'Autobusos", "Salou — Estació", "La Pineda — Passeig", "Cambrils — Psg. d'Albert"],
		["08:00", "08:30", "08:40", "08:55"],
		["10:00", "10:30", "", "10:55"],
		["12:00", "12:30", "12:40", "12:55"],
		["14:00", "14:30", "", "14:55"],
	],
	"11 - Salou – Reus": [
		["Salou — Estació", "Vila-seca — Plaça", "Reus — Estació"],
		["09:00", "09:15", "09:30"],
		["11:00", "", "11:30"],
		["13:00", "13:15", "13:30"],
	],
	CONEXIONES: [
		["desde_linea", "parada", "hasta_linea", "espera_min"],
		["46", "Cambrils — Psg. d'Albert", "11", "0"],
	],
};

const desired = Object.keys(out);

console.log("1) leyendo pestañas existentes ...");
const info = await sheetsApi(`${api}?fields=sheets.properties(sheetId,title)`);
const existing = new Map(info.sheets.map((s) => [s.properties.title, s.properties.sheetId]));

const batch = [];
const DEFAULT_TITLES = ["Hoja 1", "Sheet1", "Feuille 1"];

const firstSheet = info.sheets[0];
if (
	info.sheets.length === 1 &&
	DEFAULT_TITLES.includes(firstSheet?.properties.title) &&
	!existing.has(desired[0])
) {
	batch.push({
		updateSheetProperties: {
			properties: { sheetId: firstSheet.properties.sheetId, title: desired[0] },
			fields: "title",
		},
	});
	existing.delete(firstSheet.properties.title);
	existing.set(desired[0], firstSheet.properties.sheetId);
	console.log(`   renombro "${firstSheet.properties.title}" -> "${desired[0]}"`);
}

for (const title of desired) {
	if (existing.has(title)) continue;
	batch.push({ addSheet: { properties: { title } } });
	console.log(`   añado pestaña "${title}"`);
}

if (batch.length > 0) {
	await sheetsApi(`${api}:batchUpdate`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ requests: batch }),
	});
}

console.log("2) escribiendo valores ...");
for (const [title, rows] of Object.entries(out)) {
	const encoded = encodeURIComponent(title);
	await sheetsApi(`${api}/values/${encoded}:clear`, { method: "POST", body: JSON.stringify({}) });
	const range = `${encoded}!A1:${columnLetter(maxCols(rows))}${rows.length}`;
	await sheetsApi(`${api}/values/${range}?valueInputOption=RAW`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			majorDimension: "ROWS",
			values: rows.map((r) => r.map((c) => String(c ?? ""))),
		}),
	});
	console.log(`   ${title}: ${rows.length} filas`);
}

console.log("\nListo: recargá la hoja en el browser para ver los datos.");

function maxCols(rows) {
	return Math.max(...rows.map((r) => r.length), 1);
}

function columnLetter(n) {
	let s = "";
	while (n > 0) {
		const rem = (n - 1) % 26;
		s = String.fromCharCode(65 + rem) + s;
		n = Math.floor((n - 1) / 26);
	}
	return s;
}
