import type { metadata } from "@/server/panel/registry";
export type PanelModel = ReturnType<typeof metadata>;
export type PanelField = PanelModel["fields"][number];
export type PanelRecord = { key: string; values: Record<string, unknown> };
