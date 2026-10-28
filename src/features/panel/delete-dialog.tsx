"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loading } from "@/components/ui/feedback";
import { usePanelMutations } from "./hooks/use-panel-mutations";
import { useTRPC } from "@/trpc/provider";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { PanelModel, PanelRecord } from "./types";
export function DeleteDialog({
  model,
  record,
  onClose,
}: {
  model: PanelModel;
  record: PanelRecord;
  onClose: () => void;
}) {
  const api = useTRPC();
  const [confirmation, setConfirmation] = useState("");
  const impact = useQuery(
    api.panel.impact.queryOptions({ model: model.name, key: record.key }),
  );
  const { remove } = usePanelMutations(model, onClose, record);
  return (
    <Dialog
      title="Datensatz endgültig löschen?"
      onClose={() => {
        if (!remove.isPending) onClose();
      }}
    >
      <div className="delete-body">
        <p>
          Dieser Vorgang kann nicht rückgängig gemacht werden. Verknüpfte Daten
          können ebenfalls gelöscht werden.
        </p>
        {impact.isPending ? (
          <Loading label="Verknüpfungen werden geprüft …" compact />
        ) : impact.error ? (
          <p role="alert">{impact.error.message}</p>
        ) : (
          <ul>
            {impact.data.map((i, index) => (
              <li key={index}>
                {i.label}: {i.count} ·{" "}
                {i.behavior === "Cascade"
                  ? "wird mitgelöscht"
                  : i.behavior === "SetNull"
                    ? "Verknüpfung wird entfernt"
                    : "Löschen möglicherweise gesperrt"}
              </li>
            ))}
          </ul>
        )}
        <label htmlFor="delete-confirm">Zum Bestätigen LÖSCHEN eingeben</label>
        <input
          id="delete-confirm"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          autoComplete="off"
        />
        {remove.error && (
          <p role="alert" className="notice error">
            {remove.error.message}
          </p>
        )}
      </div>
      <footer className="dialog-actions">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={remove.isPending}
        >
          Abbrechen
        </Button>
        <Button
          className="danger"
          loading={remove.isPending}
          disabled={
            confirmation !== "LÖSCHEN" || remove.isPending || !impact.isSuccess
          }
          onClick={() =>
            remove.mutate({
              model: model.name,
              key: record.key,
              confirmation: "LÖSCHEN",
            })
          }
        >
          Endgültig löschen
        </Button>
      </footer>
    </Dialog>
  );
}
