import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { YAML } from "bun";

const workflow = YAML.parse(
	readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8"),
) as {
	on: { pull_request: null; push: { branches: string[] } };
	permissions: Record<string, string>;
	jobs: {
		validation: {
			env: Record<string, string>;
			steps: {
				uses?: string;
				run?: string;
				if?: string;
				with?: Record<string, unknown>;
			}[];
		};
	};
};

describe("pull request CI", () => {
	const job = workflow.jobs.validation;
	const commands = job.steps.flatMap((step) => (step.run ? [step.run] : []));

	test("checks pull requests and the default branch with read-only access", () => {
		expect(workflow.on).toHaveProperty("pull_request");
		expect(workflow.on.push.branches).toEqual(["main"]);
		expect(workflow.permissions).toEqual({ contents: "read" });
		for (const step of job.steps.filter((step) => step.uses)) {
			expect(step.uses).toMatch(/^[\w-]+\/[\w-]+@[a-f0-9]{40}$/);
		}
		const checkout = job.steps.find((step) =>
			step.uses?.startsWith("actions/checkout@"),
		);
		expect(checkout?.with).toMatchObject({
			"fetch-depth": 0,
			"persist-credentials": false,
		});
	});

	test("prepares generated artifacts and browsers before the existing build gate", () => {
		expect(commands).toEqual([
			"bun install --frozen-lockfile",
			"bun run db:generate",
			"bunx playwright install --with-deps chromium",
			"bun run build",
		]);
		expect(job.env).toMatchObject({
			DATABASE_URL: "postgresql://localhost:5432/ci",
			INSFORGE_URL: "http://127.0.0.1:4401",
			INSFORGE_ANON_KEY: "e2e-local-fixture",
		});
		expect(JSON.stringify(workflow)).not.toContain("secrets.");
	});

	test("retains browser failure diagnostics without uploading app credentials", () => {
		const artifacts = job.steps.find((step) =>
			step.uses?.startsWith("actions/upload-artifact@"),
		);
		expect(artifacts?.if).toBe("failure()");
		expect(artifacts?.with?.path).toBe(
			"test/playwright-report/\ntest/test-results/\n",
		);
		expect(artifacts?.with?.["retention-days"]).toBe(7);
	});
});
