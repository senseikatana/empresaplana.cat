#!/usr/bin/env node
/**
 * Commit message guard. Two modes, wired to two husky hooks:
 *
 *   sanitize <file>  strips terminal escape sequences and rewrites the file.
 *                    Self-healing: always succeeds, only reports.
 *   validate <file>  rejects a malformed subject line. Blocking.
 *
 * The split matters. Rejecting a commit for something a script can fix is bad
 * UX, so escapes are removed automatically and only genuine format problems
 * block.
 */
import { readFileSync, writeFileSync } from "node:fs";

const TYPES = [
	"feat",
	"fix",
	"docs",
	"style",
	"refactor",
	"perf",
	"test",
	"build",
	"ci",
	"chore",
	"revert",
];

const CONVENTIONAL = new RegExp(`^(${TYPES.join("|")})(\\([^)]*\\))?!?: .+`);

/**
 * Merge, revert, fixup and squash commits are not authored freehand, so they
 * are exempt. Reverts must stay exempt: git generates them and they cannot be
 * made to conform.
 */
const EXEMPT = /^(Merge |Revert |fixup!|squash!|WIP(\s|:))/i;

/**
 * OSC 7 (the file:// payload a terminal pastes when copying a terminal
 * selection) is what corrupted two commit subjects in this repository.
 */
const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
const CSI = new RegExp(`${ESC}\\[[0-9;]*[a-zA-Z]`, "g");
const OSC = new RegExp(
	`${ESC}\\][0-9];[\\s\\S]*?(?:${BEL}|${ESC}\\\\|\n)`,
	"g",
);

function stripEscapes(text) {
	return text.replace(CSI, "").replace(OSC, "");
}

function sanitize(file) {
	const original = readFileSync(file, "utf8");
	const cleaned = stripEscapes(original);
	if (cleaned === original) {
		console.log("commit message: no terminal escapes found");
		return 0;
	}
	writeFileSync(file, cleaned);
	console.log("commit message: stripped terminal escapes (OSC/CSI)");
	console.log("  a terminal paste leaked file:// markup into the message");
	return 0;
}

function validate(file) {
	const raw = readFileSync(file, "utf8");
	const withoutComments = stripEscapes(raw)
		.split("\n")
		.filter((line) => !line.startsWith("#"))
		.join("\n");

	const subject = (
		withoutComments.split("\n").find((line) => line.trim()) ?? ""
	).trim();

	if (!subject) {
		console.error("commit message is empty");
		return 1;
	}

	if (stripEscapes(raw) !== raw) {
		console.error("commit message still contains terminal escape sequences");
		console.error("  the prepare-commit-msg hook should have removed them");
		return 1;
	}

	if (EXEMPT.test(subject)) return 0;

	if (!CONVENTIONAL.test(subject)) {
		console.error(
			`commit message does not follow Conventional Commits:\n\n  ${subject}\n`,
		);
		console.error(`expected:  <type>(<scope>)!: <description>`);
		console.error(`types:     ${TYPES.join(", ")}`);
		console.error("examples:");
		console.error("  feat(gestion): add column sorting to the table");
		console.error("  fix!: drop the phantom release heading");
		console.error("\n`!` marks a breaking change.");
		return 1;
	}

	if (subject.length > 100) {
		console.error(`subject is ${subject.length} chars; keep it under 100`);
		return 1;
	}

	return 0;
}

const [mode, file] = process.argv.slice(2);
if (!file) {
	console.error("usage: commit-guard.mjs <sanitize|validate> <file>");
	process.exit(2);
}

try {
	process.exit(mode === "sanitize" ? sanitize(file) : validate(file));
} catch (error) {
	console.error(`commit-guard: ${error.message}`);
	process.exit(2);
}
