#!/usr/bin/env node
/**
 * Keeps the project version in sync across the three places that record it:
 * package.json, the latest git tag, and CHANGELOG.md.
 *
 * Usage:
 *   release:check                    verify all three agree; exit 1 otherwise
 *   release:version -- --to 1.2.0    write the version to package.json and
 *                                     ensure CHANGELOG.md has the section
 *   release:version -- --to 1.2.0 --tag
 *                                    also create the annotated git tag
 *
 * Never commits and never pushes. Committing is a human decision.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..", "..");
const MANIFEST = resolve(ROOT, "package.json");
const CHANGELOG = resolve(ROOT, "CHANGELOG.md");

/** Matches only strictly-formed semver, so a note like "1.2" is rejected. */
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/** A release heading: "## [1.2.0] - 2026-01-31", tolerating the v prefix. */
const HEADING = /^##\s*\[v?(\d+\.\d+\.\d+)\]/m;

function git(args, fallback = null) {
	try {
		return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
	} catch {
		return fallback;
	}
}

/**
 * CHANGELOG.md contains embedded ANSI escape sequences from a terminal
 * copy-paste. They would defeat every regex below, so they are removed before
 * the file is inspected.
 */
function stripAnsi(text) {
	// Control characters are named rather than written literally, so this file
	// stays diff- and editor-safe and no regex literal holds a control byte.
	const ESC = String.fromCharCode(27);
	const BEL = String.fromCharCode(7);
	return text
		.replace(new RegExp(`${ESC}\\[[0-9;]*[a-zA-Z]`, "g"), "")
		.replace(
			new RegExp(`${ESC}\\][0-9];[\\s\\S]*?(?:${BEL}|${ESC}\\\\)`, "g"),
			"",
		);
}

function readManifestVersion() {
	const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
	const version = manifest.version;
	if (typeof version !== "string" || !SEMVER.test(version)) {
		throw new Error(
			`package.json has an invalid version: ${JSON.stringify(version)}`,
		);
	}
	return version;
}

function latestTag() {
	const tag = git(["tag", "--list", "v*", "--sort=-v:refname"]);
	if (!tag) return null;
	const first = tag.split("\n")[0]?.trim();
	if (!first) return null;
	const version = first.replace(/^v/, "");
	return SEMVER.test(version) ? version : null;
}

function latestChangelogVersion() {
	let raw;
	try {
		raw = readFileSync(CHANGELOG, "utf8");
	} catch {
		return null;
	}
	// Headings are ordered newest-first, so the first match is the newest.
	const match = HEADING.exec(stripAnsi(raw));
	return match ? match[1] : null;
}

function compare(a, b) {
	const left = a.split(".").map(Number);
	const right = b.split(".").map(Number);
	for (let index = 0; index < 3; index++) {
		if (left[index] !== right[index]) return left[index] - right[index];
	}
	return 0;
}

function collect() {
	return {
		manifest: readManifestVersion(),
		tag: latestTag(),
		changelog: latestChangelogVersion(),
	};
}

function report(state) {
	console.log("version sources");
	console.log(`  package.json   ${state.manifest}`);
	console.log(`  latest tag     ${state.tag ? `v${state.tag}` : "(none)"}`);
	console.log(
		`  CHANGELOG.md   ${state.changelog ? state.changelog : "(no release heading)"}`,
	);
}

/**
 * The git tag is the authoritative record of what actually shipped: it is
 * created deliberately and is immutable in practice. CHANGELOG.md is prose a
 * human edits, and it drifts -- so it must never dictate the expected version,
 * or a stray heading would make the check impossible to satisfy.
 */
function expectedVersion(state) {
	if (state.tag) return state.tag;
	if (state.manifest) return state.manifest;
	return state.changelog;
}

/**
 * Two severities, deliberately. A manifest/tag disagreement is a broken release
 * and fails. A changelog disagreement is stale prose and warns, because fixing it
 * means editing or tagging history, which is a human decision.
 */
function drift(state) {
	const expected = expectedVersion(state);
	const hard = [];
	const advisory = [];

	if (state.manifest !== expected) {
		// Direction matters. Telling someone to set an AHEAD manifest back to the
		// tag would silently undo a release that already shipped, so an ahead
		// manifest gets tag advice instead of a rollback.
		const ahead = compare(state.manifest, expected) > 0;
		hard.push(
			ahead
				? {
						problem: `package.json is ${state.manifest}, ahead of tag v${expected}`,
						kind: "untagged",
						fix: `git tag -a v${state.manifest} -m "Release ${state.manifest}"`,
					}
				: {
						problem: `package.json is ${state.manifest}, expected ${expected}`,
						kind: "behind",
						fix: `bun run release:version -- --to ${expected}`,
					},
		);
	}

	if (state.changelog && state.changelog !== expected) {
		const phantom = state.tag ? compare(state.changelog, state.tag) > 0 : false;
		advisory.push({
			problem: `CHANGELOG.md newest heading is ${state.changelog}, expected ${expected}`,
			kind: phantom ? "phantom" : "stale",
		});
	}

	return { expected, hard, advisory };
}

/** Changelog advice, matched to the kind of drift, because the fix differs. */
function changelogAdvice({ problem, kind }) {
	const lines = [problem];
	if (kind === "phantom") {
		lines.push(
			"    This heading records a release that has no tag. Either that release",
			"    really shipped and is missing its tag, or the heading is wrong. A",
			"    script will not delete release history or invent tags -- decide here.",
			'  - if it shipped:  git tag -a v<version> -m "Release <version>"',
			"  - if it did not:  delete the heading from CHANGELOG.md by hand",
		);
	} else {
		lines.push(
			`    CHANGELOG.md is behind. Add a "## [${expectedVersion(collect())}]" heading.`,
			"    release:version adds it only when the changelog has no newer heading.",
		);
	}
	return lines;
}

function check(strict) {
	const state = collect();
	report(state);
	const { expected, hard, advisory } = drift(state);

	console.log(
		`\nexpected ${expected} (from ${state.tag ? "git tag" : "manifest"})`,
	);

	if (hard.length === 0 && advisory.length === 0) {
		console.log("\nOK: all version sources agree.");
		return 0;
	}

	for (const problem of hard) {
		console.error(`\nout of sync:\n  - ${problem.problem}`);
		if (problem.kind === "untagged") {
			console.error(
				"    A release wrote package.json and CHANGELOG.md but its tag was\n" +
					"    never created. Tagging is the missing step; do NOT roll the\n" +
					"    manifest back, that would undo a release that already shipped.",
			);
		}
		console.error(`  fix: ${problem.fix}`);
	}

	if (advisory.length > 0) {
		const heading = strict
			? "out of sync:"
			: "warning (does not fail --check):";
		console.error(`\n${heading}`);
		for (const problem of advisory) {
			for (const line of changelogAdvice(problem)) console.error(line);
		}
	}

	if (hard.length > 0 || (strict && advisory.length > 0)) return 1;
	console.error("\nmanifest and tag agree; the changelog needs a manual edit.");
	return 0;
}

function parseArgs(argv) {
	const options = { to: null, tag: false, strict: false };
	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index];
		if (arg === "--to") {
			options.to = argv[++index] ?? null;
		} else if (arg.startsWith("--to=")) {
			options.to = arg.slice("--to=".length);
		} else if (arg === "--tag") {
			options.tag = true;
		} else if (arg === "--strict") {
			options.strict = true;
		} else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return options;
}

function writeManifestVersion(version) {
	const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
	if (manifest.version === version) return false;
	manifest.version = version;
	writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, "\t")}\n`);
	return true;
}

/**
 * Inserts a heading only when the changelog has no section for that version yet.
 * An existing section is left untouched so recorded notes are never destroyed.
 *
 * Returns one of: "added" | "current" | "ahead" | "no-heading".
 */
function ensureChangelogSection(version, today) {
	let raw;
	try {
		raw = readFileSync(CHANGELOG, "utf8");
	} catch {
		raw = "# Changelog\n";
	}
	const existing = latestChangelogVersion();
	if (existing && compare(existing, version) >= 0) {
		return existing === version ? "current" : "ahead";
	}

	const clean = stripAnsi(raw);
	const match = HEADING.exec(clean);
	if (!match) return "no-heading";

	const section = `## [${version}] - ${today}\n\n## [${match[1]}]`;
	// The inserted heading stays ahead of the previous one, so the file remains
	// ordered newest-first and the next --check resolves to this release.
	const updated = clean.replace(HEADING, section);
	writeFileSync(CHANGELOG, updated);
	return "added";
}

// Every entry is an array of lines: console.log would otherwise iterate a bare
// string character by character.
const CHANGELOG_RESULT = {
	added: (version) => [`  CHANGELOG.md  section added for ${version}`],
	current: (version) => [`  CHANGELOG.md  already documents ${version}`],
	ahead: (version, existing) => [
		`  CHANGELOG.md  documents ${existing}, ahead of target ${version}; left unchanged`,
		"                -> this is a warning, not a failure; it needs a human decision",
	],
	"no-heading": (version) => [
		`  CHANGELOG.md  no release heading found; add a section for ${version} by hand`,
	],
};

function setVersion() {
	const options = parseArgs(process.argv.slice(2));
	if (!options.to) throw new Error("Missing --to <version>");
	if (!SEMVER.test(options.to)) {
		throw new Error(`Not a valid semver version: ${options.to}`);
	}

	const today = new Date().toISOString().slice(0, 10);
	const state = collect();
	report(state);

	console.log(`\ntargeting ${options.to}\n`);

	const manifestChanged = writeManifestVersion(options.to);
	console.log(
		manifestChanged
			? `  package.json  ${state.manifest} -> ${options.to}`
			: `  package.json  already ${options.to}`,
	);

	const changelogResult = ensureChangelogSection(options.to, today);
	for (const line of CHANGELOG_RESULT[changelogResult](
		options.to,
		latestChangelogVersion(),
	)) {
		console.log(line);
	}
	const changelogChanged = changelogResult === "added";

	if (options.tag) {
		const existing = git(["tag", "--list", `v${options.to}`]);
		if (existing) {
			console.log(`  git tag      v${options.to} already exists`);
		} else {
			git(["tag", "-a", `v${options.to}`, "-m", `Release ${options.to}`]);
			console.log(`  git tag      created v${options.to}`);
		}
	} else {
		console.log("  git tag      not created (pass --tag to create it)");
	}

	const staged = ["package.json"];
	if (changelogChanged) staged.push("CHANGELOG.md");
	if (!manifestChanged && !changelogChanged) {
		console.log("\nnothing to change; the version already matched everywhere.");
		return 0;
	}
	console.log("\nreview the diff, then commit:");
	console.log(`  git add ${staged.join(" ")}`);
	console.log(`  git commit -m "chore(release): v${options.to}"`);
	return 0;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.to) return setVersion();
	return check(options.strict);
}

try {
	process.exit(main());
} catch (error) {
	console.error(`release-versions: ${error.message}`);
	process.exit(2);
}
