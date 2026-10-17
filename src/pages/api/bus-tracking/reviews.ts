import type { APIRoute } from "astro";
import { z } from "zod";
import {
	clientKey,
	consume,
	DEFAULT_BURST,
	DEFAULT_BURST_WINDOW_MS,
	READ_BUDGET,
	READ_WINDOW_MS,
	tooManyRequests,
} from "@/lib/rate-limit";
import { addReview, listReviews, MAX_LINE_ID } from "@/lib/tracking-store";

export const prerender = false;

const MAX_LIST_LIMIT = 200;

// ── GET /api/bus-tracking/reviews ───────────────────────────────────────────
export const GET: APIRoute = async ({ request, url }) => {
	const budget = consume(clientKey(request), READ_BUDGET, READ_WINDOW_MS);
	if (!budget.allowed) return tooManyRequests(budget);

	const parsed = z
		.object({
			lineId: z.string().trim().min(1).max(MAX_LINE_ID).optional(),
			limit: z.coerce.number().int().min(1).max(MAX_LIST_LIMIT).default(50),
		})
		.safeParse({
			lineId: url.searchParams.get("lineId") ?? undefined,
			limit: url.searchParams.get("limit") ?? undefined,
		});

	if (!parsed.success) {
		return Response.json({ error: "invalid_query" }, { status: 400 });
	}

	return Response.json({
		reviews: await listReviews(parsed.data.lineId, {
			limit: parsed.data.limit,
		}),
	});
};

// ── POST /api/bus-tracking/reviews ──────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
	if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
		return Response.json({ error: "invalid_content_type" }, { status: 415 });
	}

	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return Response.json({ error: "invalid_body" }, { status: 400 });
	}

	const parsed = z
		.object({
			lineId: z.string().trim().min(1).max(MAX_LINE_ID),
			stars: z.number().int().min(1).max(5),
			comment: z.string().trim().max(500).optional(),
		})
		.strict()
		.safeParse(raw);

	if (!parsed.success) {
		return Response.json(
			{
				error: "validation_failed",
				issues: parsed.error.issues.map((issue) => ({
					path: issue.path.join("."),
					message: issue.message,
				})),
			},
			{ status: 400 },
		);
	}

	const burst = consume(
		clientKey(request),
		DEFAULT_BURST,
		DEFAULT_BURST_WINDOW_MS,
	);
	if (!burst.allowed) return tooManyRequests(burst);

	try {
		const review = await addReview(parsed.data);
		return Response.json(
			{ review },
			{
				status: 201,
				headers: { "X-RateLimit-Remaining": String(burst.remaining) },
			},
		);
	} catch (error) {
		if (error instanceof TypeError && error.message === "invalid_stars") {
			return Response.json({ error: "invalid_stars" }, { status: 400 });
		}
		console.error("Unable to store bus tracking review", error);
		return Response.json({ error: "tracking_unavailable" }, { status: 503 });
	}
};
