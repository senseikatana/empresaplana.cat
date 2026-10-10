import type { RoutesGroups } from "@/interfaces/routes";

export type ComarcaId = Exclude<keyof RoutesGroups, "special">;

export interface Comarca {
	id: ComarcaId;
	towns: string[];
}

export interface TimeRange {
	value: string;
	label: string;
}
