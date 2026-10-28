import type { PanelField } from "./types";
import { enumLabels } from "./labels";
import { RelationSelect } from "./relation-select";
export function RecordField({
  field,
  value,
  onChange,
  editing,
}: {
  field: PanelField;
  value: unknown;
  onChange: (value: unknown) => void;
  editing: boolean;
}) {
  const id = `field-${field.name}`;
  const required = field.required && !field.hasDefault && !editing;
  const label = (
    <label htmlFor={id}>
      {field.label}
      {required && <span className="required"> *</span>}
      <small>{field.name}</small>
    </label>
  );
  const text =
    value === null || value === undefined
      ? ""
      : value instanceof Date
        ? value.toISOString()
        : String(value);
  if (field.type === "Boolean")
    return (
      <div className="panel-field">
        <label className="panel-checkbox" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            {field.label}
            <small>{field.name}</small>
          </span>
        </label>
      </div>
    );
  return (
    <div
      className={`panel-field ${["text", "body", "prompt", "explanation", "description", "guide", "bio"].includes(field.name) ? "wide" : ""}`}
    >
      {label}
      {field.relation ? (
        <RelationSelect
          id={id}
          model={field.relation}
          value={text}
          required={required}
          onChange={(v) => onChange(v || null)}
        />
      ) : field.options ? (
        <select
          id={id}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          <option value="">Bitte auswählen</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {enumLabels[o] ?? o}
            </option>
          ))}
        </select>
      ) : field.type === "DateTime" ? (
        <input
          id={id}
          type="datetime-local"
          value={text ? new Date(text).toISOString().slice(0, 16) : ""}
          onChange={(e) =>
            onChange(
              e.target.value
                ? new Date(`${e.target.value}Z`).toISOString()
                : null,
            )
          }
        />
      ) : field.type === "Int" ? (
        <input
          id={id}
          type="number"
          step="1"
          value={text}
          onChange={(e) =>
            onChange(e.target.value === "" ? null : Number(e.target.value))
          }
          required={required}
        />
      ) : field.secret ? (
        <input
          id={id}
          type="password"
          autoComplete="new-password"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder={editing ? "Unverändert lassen" : "Wert eingeben"}
          required={required}
        />
      ) : [
          "text",
          "body",
          "prompt",
          "explanation",
          "description",
          "guide",
          "bio",
          "hint",
          "quote",
          "note",
        ].includes(field.name) ? (
        <textarea
          id={id}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={4}
        />
      ) : (
        <input
          id={id}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={field.hasDefault ? "Automatisch / Standardwert" : ""}
        />
      )}{" "}
      {field.type === "DateTime" && (
        <small className="field-help">Zeitangabe in UTC</small>
      )}
      {!field.required && value !== null && (
        <button
          type="button"
          className="field-clear"
          onClick={() => onChange(null)}
        >
          Wert leeren
        </button>
      )}
    </div>
  );
}
