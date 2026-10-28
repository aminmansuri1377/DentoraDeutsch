import { Eye, Pencil, Trash2 } from "lucide-react";
import { enumLabels } from "./labels";
import type { PanelModel, PanelRecord } from "./types";
export function displayValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Ja" : "Nein";
  if (value instanceof Date) return value.toLocaleString("de-DE");
  return enumLabels[String(value)] ?? String(value);
}
export function RecordTable({
  model,
  rows,
  onView,
  onEdit,
  onDelete,
}: {
  model: PanelModel;
  rows: PanelRecord[];
  onView: (r: PanelRecord) => void;
  onEdit: (r: PanelRecord) => void;
  onDelete: (r: PanelRecord) => void;
}) {
  const preferred = [
    "title",
    "name",
    "email",
    "text",
    "prompt",
    "body",
    "subject",
    "slug",
    "status",
    "role",
    "position",
    "createdAt",
  ];
  const fields = [
    ...model.fields.filter((f) => preferred.includes(f.name)),
    ...model.fields.filter((f) => !preferred.includes(f.name) && !f.secret),
  ].slice(0, 5);
  return (
    <div className="panel-table-scroll">
      <table className="panel-table">
        <thead>
          <tr>
            {fields.map((f) => (
              <th key={f.name}>{f.label}</th>
            ))}
            <th className="actions-cell">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((r) => (
              <tr key={r.key}>
                {fields.map((f) => (
                  <td key={f.name}>
                    <span
                      className={
                        f.kind === "enum" ? "table-badge" : "cell-text"
                      }
                      title={displayValue(r.values[f.name])}
                    >
                      {displayValue(r.values[f.name])}
                    </span>
                  </td>
                ))}
                <td className="row-actions">
                  <button
                    aria-label="Details anzeigen"
                    onClick={() => onView(r)}
                  >
                    <Eye size={17} />
                  </button>
                  <button
                    aria-label="Datensatz bearbeiten"
                    onClick={() => onEdit(r)}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    aria-label="Datensatz löschen"
                    onClick={() => onDelete(r)}
                  >
                    <Trash2 size={17} />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={fields.length + 1}>
                <div className="empty">
                  <h3>Noch keine Einträge</h3>
                  <p>
                    Erstelle den ersten Datensatz oder passe deine Suche an.
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
