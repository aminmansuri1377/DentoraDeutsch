import type { PanelModel, PanelRecord } from "./types";
export type PanelList = { rows: PanelRecord[]; total: number; pages: number };
export type ListInput = { model: string; page: number; search: string };
export type PanelChange =
  | { kind: "save"; row: PanelRecord; previous?: PanelRecord }
  | { kind: "remove"; previous: PanelRecord };
function sameRecord(a: PanelRecord, b: PanelRecord, model: PanelModel) {
  // Encrypted action keys are randomized on each fetch. Prefer non-secret primary fields.
  const publicKeys = model.keys.filter(
    (name) => !model.fields.find((f) => f.name === name)?.secret,
  );
  return (
    a.key === b.key ||
    (publicKeys.length === model.keys.length &&
      publicKeys.length > 0 &&
      publicKeys.every((name) => a.values[name] === b.values[name]))
  );
}
function matches(row: PanelRecord, search: string, model: PanelModel) {
  return (
    !search ||
    model.fields.some(
      (f) =>
        f.type === "String" &&
        !f.secret &&
        String(row.values[f.name] ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
  );
}
/** Apply confirmed server mutations immediately; refetch reconciles sorting, cascades and page boundaries. */
export function updatePanelList(
  data: PanelList,
  input: ListInput,
  model: PanelModel,
  change: PanelChange,
): PanelList {
  const previous = change.previous;
  const row = change.kind === "save" ? change.row : undefined;
  const oldMatch = previous ? matches(previous, input.search, model) : false;
  const newMatch = row ? matches(row, input.search, model) : false;
  const existing = previous
    ? data.rows.findIndex((r) => sameRecord(r, previous, model))
    : -1;
  let rows = [...data.rows];
  if (existing >= 0) {
    if (row && newMatch) rows[existing] = row;
    else rows.splice(existing, 1);
  } else if (row && newMatch && input.page === 0 && (!previous || !oldMatch)) {
    rows = [row, ...rows].slice(0, 20);
  }
  const total = Math.max(0, data.total + Number(newMatch) - Number(oldMatch));
  return { rows, total, pages: Math.ceil(total / 20) };
}
