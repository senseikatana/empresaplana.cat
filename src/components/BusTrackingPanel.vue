<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import type { BusTracking } from "@/interfaces";
import type { LineStats, ReportAction } from "@/interfaces/tracking-store";

const props = defineProps<{
	lineId: string;
	lineLabel: string;
	stops: { id: string; name: string; time: string }[];
	t: BusTracking;
}>();
interface ReportResult {
	report: { id: string; action: ReportAction; createdAt: string };
	stats: LineStats;
	escalation: { id: string; threshold: number; createdAt: string } | null;
}
const actions: { value: ReportAction; icon: string }[] = [
	{ value: "passed", icon: "check_circle" },
	{ value: "onTime", icon: "schedule" },
	{ value: "late", icon: "schedule" },
	{ value: "early", icon: "schedule" },
	{ value: "notPassed", icon: "cancel" },
	{ value: "cancelled", icon: "block" },
];
const actionStyles: Record<ReportAction, string> = {
	passed: "border-deep-navy/30 text-deep-navy hover:bg-deep-navy hover:text-white",
	onTime: "border-coastal-teal/40 text-on-secondary-container hover:bg-secondary-container",
	late: "border-error/30 text-error hover:bg-error hover:text-on-error",
	early: "border-on-tertiary-container/40 text-on-tertiary-container hover:bg-tertiary-container",
	notPassed: "border-error/30 text-error hover:bg-error hover:text-on-error",
	cancelled: "border-outline text-on-surface-variant hover:bg-surface-container-high",
};
const stopId = ref(props.stops[0]?.id ?? "");
const action = ref<ReportAction | null>(null);
const minutesLate = ref("");
const comment = ref("");
const submitting = ref(false);
const error = ref<string | null>(null);
const result = ref<ReportResult | null>(null);
const stats = ref<LineStats | null>(null);
const stars = ref(0);
const reviewComment = ref("");
const reviewSubmitting = ref(false);
const reviewSubmitted = ref(false);
const reviewError = ref<string | null>(null);
const selectedStop = computed(() => props.stops.find((stop) => stop.id === stopId.value) ?? props.stops[0]);
const negativeCount = computed(() => stats.value?.negative ?? 0);
const threshold = computed(() => stats.value?.threshold ?? props.t.alerts.threshold);
const escalated = computed(() => Boolean(stats.value?.escalated || result.value?.escalation));
const progress = computed(() => Math.min(100, (negativeCount.value / Math.max(1, threshold.value)) * 100));
let statsController: AbortController | undefined;
let mounted = false;

async function loadStats() {
	statsController?.abort();
	const controller = new AbortController();
	statsController = controller;
	stats.value = null;
	result.value = null;
	error.value = null;
	try {
		const response = await fetch(`/api/bus-tracking/reports?lineId=${encodeURIComponent(props.lineId)}`, { signal: controller.signal });
		if (!response.ok) throw new Error(`Tracking stats failed (${response.status}).`);
		const data: { stats: LineStats | null } = await response.json();
		if (!controller.signal.aborted) stats.value = data.stats;
	} catch (cause) {
		if (controller.signal.aborted) return;
		console.error("Unable to load tracking statistics.", cause);
		error.value = props.t.feedback.failure;
	}
}
onMounted(() => { mounted = true; void loadStats(); });
onUnmounted(() => { mounted = false; statsController?.abort(); });
watch(() => props.lineId, () => {
	stopId.value = props.stops[0]?.id ?? "";
	action.value = null;
	minutesLate.value = "";
	comment.value = "";
	stars.value = 0;
	reviewComment.value = "";
	reviewSubmitted.value = false;
	reviewError.value = null;
	if (mounted) void loadStats();
});
watch(() => props.stops, () => {
	if (!props.stops.some((stop) => stop.id === stopId.value)) stopId.value = props.stops[0]?.id ?? "";
});

async function submitReport() {
	if (submitting.value) return;
	if (!action.value || !selectedStop.value) {
		error.value = props.t.feedback.selectIssue;
		return;
	}
	const submittedLine = props.lineId;
	submitting.value = true;
	error.value = null;
	result.value = null;
	try {
		const response = await fetch("/api/bus-tracking/reports", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				lineId: submittedLine, stopId: selectedStop.value.id, action: action.value,
				minutesLate: (action.value === "late" || action.value === "early") && minutesLate.value ? Number(minutesLate.value) : undefined,
				comment: comment.value || undefined,
			}),
		});
		if (!response.ok) throw new Error(`Tracking report failed (${response.status}).`);
		const data: ReportResult = await response.json();
		if (props.lineId !== submittedLine || !mounted) return;
		statsController?.abort();
		result.value = data;
		stats.value = data.stats;
		action.value = null;
		minutesLate.value = "";
		comment.value = "";
	} catch (cause) {
		console.error("Unable to submit tracking report.", cause);
		if (props.lineId === submittedLine) error.value = props.t.feedback.failure;
	} finally { submitting.value = false; }
}
async function submitReview() {
	if (stars.value < 1 || reviewSubmitting.value) return;
	const submittedLine = props.lineId;
	reviewSubmitting.value = true;
	reviewSubmitted.value = false;
	reviewError.value = null;
	try {
		const response = await fetch("/api/bus-tracking/reviews", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ lineId: submittedLine, stars: stars.value, comment: reviewComment.value || undefined }),
		});
		if (!response.ok) throw new Error(`Tracking review failed (${response.status}).`);
		if (props.lineId !== submittedLine || !mounted) return;
		reviewSubmitted.value = true;
		stars.value = 0;
		reviewComment.value = "";
	} catch (cause) {
		console.error("Unable to submit tracking review.", cause);
		if (props.lineId === submittedLine) reviewError.value = props.t.feedback.failure;
	} finally { reviewSubmitting.value = false; }
}
</script>

<template>
	<div class="max-w-2xl mx-auto space-y-stack-lg">
		<section class="bg-surface-container-lowest rounded-xl border border-outline-variant/20 ambient-shadow p-6">
			<div class="flex items-center gap-3 mb-2">
				<span aria-hidden="true" class="material-symbols-outlined text-deep-navy">directions_bus</span>
				<h2 class="font-headline-md text-headline-md text-deep-navy">{{ t.title }}</h2>
			</div>
			<p class="font-body-md text-body-md text-on-surface-variant mb-6">{{ t.subtitle }}</p>
			<form @submit.prevent="submitReport">
				<div class="flex flex-col md:flex-row gap-stack-md mb-6">
					<div class="flex-1">
						<span class="font-label-md text-label-md text-on-surface-variant uppercase">{{ t.line }}</span>
						<p class="font-headline-md text-headline-md text-on-surface">{{ lineLabel }}</p>
					</div>
					<div class="flex-1">
						<label for="tracking-stop" class="font-label-md text-label-md text-on-surface-variant uppercase">{{ t.stop }}</label>
						<select id="tracking-stop" v-model="stopId" class="w-full mt-1 px-3 py-2 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:border-coastal-teal focus:ring-1 focus:ring-coastal-teal">
							<option v-for="stop in stops" :key="stop.id" :value="stop.id">{{ stop.name }} — {{ t.scheduled }} {{ stop.time }}</option>
						</select>
					</div>
				</div>
				<p class="font-label-md text-label-md text-on-surface-variant mb-3">{{ t.feedback.selectIssue }}</p>
				<div class="grid grid-cols-2 md:grid-cols-3 gap-2">
					<button v-for="item in actions" :key="item.value" type="button" :aria-pressed="action === item.value" @click="action = action === item.value ? null : item.value"
						class="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-label-md transition-colors"
						:class="action === item.value ? 'bg-deep-navy text-white border-deep-navy' : actionStyles[item.value]">
						<span aria-hidden="true" class="material-symbols-outlined text-lg">{{ item.icon }}</span>{{ t.actions[item.value] }}
					</button>
				</div>
				<div v-if="action === 'late' || action === 'early'" class="mt-4">
					<label for="minutes-late" class="font-label-md text-label-md text-on-surface-variant">{{ t.feedback.minutesLate }}</label>
					<input id="minutes-late" v-model="minutesLate" type="number" min="0" step="1" class="mt-1 w-full md:w-40 px-3 py-2 rounded border border-outline-variant bg-surface-container-lowest focus:border-coastal-teal focus:ring-1 focus:ring-coastal-teal" />
				</div>
				<div class="mt-4">
					<label for="report-comment" class="font-label-md text-label-md text-on-surface-variant">{{ t.feedback.comment }}</label>
					<textarea id="report-comment" v-model="comment" rows="2" :placeholder="t.feedback.commentPlaceholder" class="mt-1 w-full px-3 py-2 rounded border border-outline-variant bg-surface-container-lowest focus:border-coastal-teal focus:ring-1 focus:ring-coastal-teal" />
				</div>
				<p v-if="error" role="alert" class="mt-3 text-error text-body-md">{{ error }}</p>
				<button type="submit" :disabled="submitting || !stops.length" class="mt-4 w-full md:w-auto bg-energetic-orange text-white font-button text-button px-8 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 min-h-12">{{ submitting ? "…" : t.feedback.send }}</button>
			</form>
			<div v-if="result" role="status" class="mt-4 p-4 rounded-lg bg-secondary-container/30 border border-coastal-teal/30">
				<p class="font-headline-md text-headline-md text-on-secondary-container">{{ t.feedback.thanks }}</p>
				<p class="text-body-md text-on-surface-variant">{{ t.feedback.thanksDesc }}</p>
			</div>
			<div v-if="stats" class="mt-6 border-t border-outline-variant/30 pt-4">
				<div class="flex items-center justify-between mb-2">
					<span class="font-label-md text-label-md text-on-surface-variant">{{ t.stats.punctuality }} · {{ t.stats.onTimeRate }}: {{ stats.onTimeRate }}%</span>
					<span class="font-label-md text-label-md text-deep-navy">{{ negativeCount }}/{{ threshold }}</span>
				</div>
				<div role="progressbar" :aria-label="t.alerts.thresholdLabel" :aria-valuenow="negativeCount" :aria-valuemax="Math.max(threshold, negativeCount)" aria-valuemin="0" class="h-2 rounded-full bg-surface-container overflow-hidden">
					<div class="h-full rounded-full transition-all" :class="escalated ? 'bg-error' : 'bg-energetic-orange'" :style="{ width: `${progress}%` }" />
				</div>
				<p class="mt-2 text-body-md text-on-surface-variant">{{ escalated ? t.alerts.notifiedBody : `${t.alerts.strikesLeft}: ${Math.max(0, threshold - negativeCount)}` }}</p>
				<div v-if="escalated" class="mt-3 p-4 rounded-lg bg-error-container/60 border border-error/30">
					<p class="font-headline-md text-headline-md text-on-error-container">{{ t.alerts.notifiedTitle }}</p>
					<ul class="mt-2 space-y-1 text-body-md text-on-error-container">
						<li>· {{ t.alerts.coordinatorNotified }}</li><li>· {{ t.alerts.companyNotified }}</li>
					</ul>
				</div>
			</div>
		</section>
		<section class="bg-surface-container-lowest rounded-xl border border-outline-variant/20 ambient-shadow p-6">
			<div class="flex items-center gap-3 mb-2">
				<span aria-hidden="true" class="material-symbols-outlined text-deep-navy">star</span>
				<h2 class="font-headline-md text-headline-md text-deep-navy">{{ t.review.title }}</h2>
			</div>
			<p class="text-body-md text-on-surface-variant mb-6">{{ t.review.subtitle }}</p>
			<form @submit.prevent="submitReview">
				<div class="flex items-center gap-1 mb-4">
					<button v-for="value in 5" :key="value" type="button" :aria-label="`${value} ${t.review.stars}`" :aria-pressed="stars === value" @click="stars = value" class="p-1 text-energetic-orange hover:scale-110 transition-transform">
						<span aria-hidden="true" class="material-symbols-outlined text-headline-lg">{{ value <= stars ? "star" : "star_outline" }}</span>
					</button>
				</div>
				<label for="review-comment" class="sr-only">{{ t.feedback.comment }}</label>
				<textarea id="review-comment" v-model="reviewComment" rows="2" :placeholder="t.feedback.commentPlaceholder" class="w-full px-3 py-2 rounded border border-outline-variant bg-surface-container-lowest focus:border-coastal-teal focus:ring-1 focus:ring-coastal-teal" />
				<p v-if="reviewError" role="alert" class="mt-3 text-error text-body-md">{{ reviewError }}</p>
				<button type="submit" :disabled="stars < 1 || reviewSubmitting" class="mt-4 w-full md:w-auto bg-deep-navy text-white font-button text-button px-8 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 min-h-12">{{ reviewSubmitting ? "…" : t.review.submit }}</button>
			</form>
			<p v-if="reviewSubmitted" role="status" class="mt-4 text-body-md text-on-secondary-container bg-secondary-container/30 border border-coastal-teal/30 rounded-lg p-4">{{ t.review.thanks }}</p>
		</section>
	</div>
</template>
