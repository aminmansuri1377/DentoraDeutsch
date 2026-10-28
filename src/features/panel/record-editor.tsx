"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PanelModel, PanelRecord } from "./types";
import { RecordField } from "./record-field";
export function RecordEditor({
  model,
  record,
  onClose,
}: {
  model: PanelModel;
  record?: PanelRecord;
  onClose: () => void;
}) {
  const api = useTRPC(),
    cache = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    record
      ? { ...record.values }
      : Object.fromEntries(
          model.fields
            .filter((f) => f.defaultValue !== undefined)
            .map((f) => [f.name, f.defaultValue]),
        ),
  );
  const [dirty, setDirty] = useState<string[]>([]);
  const save = useMutation(
    api.panel.save.mutationOptions({
      onSuccess: async () => {
        await cache.invalidateQueries();
        onClose();
      },
    }),
  );
  const editable = model.fields.filter(
    (f) => !f.readonly && !(record && f.primary),
  );
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = record
      ? dirty
      : editable
          .filter(
            (f) =>
              values[f.name] !== undefined && (!f.secret || values[f.name]),
          )
          .map((f) => f.name);
    const data = Object.fromEntries(
      fields
        .filter(
          (name) =>
            !(
              model.fields.find((f) => f.name === name)?.secret &&
              values[name] === ""
            ),
        )
        .map((name) => [
          name,
          values[name] instanceof Date
            ? (values[name] as Date).toISOString()
            : values[name],
        ]),
    );
    save.mutate({ model: model.name, key: record?.key, data });
  }
  return (
    <Dialog
      title={`${record ? "Datensatz bearbeiten" : "Neuen Datensatz erstellen"} · ${model.label}`}
      onClose={() => {
        if (!save.isPending) onClose();
      }}
    >
      <form onSubmit={submit}>
        <p className="panel-form-note">
          Pflichtfelder sind mit * markiert. Leere Standardfelder werden
          automatisch gesetzt. Änderungen wirken direkt auf die Anwendung.
        </p>
        <div className="panel-fields">
          {editable.map((field) => (
            <RecordField
              key={field.name}
              field={field}
              value={values[field.name]}
              editing={!!record}
              onChange={(value) => {
                setValues((v) => ({ ...v, [field.name]: value }));
                setDirty((d) =>
                  d.includes(field.name) ? d : [...d, field.name],
                );
              }}
            />
          ))}
        </div>
        {save.error && (
          <p role="alert" className="notice error">
            {save.error.message}
          </p>
        )}
        <footer className="dialog-actions">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={save.isPending}
          >
            Abbrechen
          </Button>
          <Button disabled={save.isPending}>
            {save.isPending ? "Wird gespeichert …" : "Änderungen speichern"}
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}
