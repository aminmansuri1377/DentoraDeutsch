"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useDebounced } from "@/hooks/use-debounced";
export function RelationSelect({
  model,
  value,
  onChange,
  id,
  required,
}: {
  model: string;
  value: string;
  onChange: (v: string) => void;
  id: string;
  required: boolean;
}) {
  const api = useTRPC();
  const [search, setSearch] = useState("");
  const data = useQuery(
    api.panel.options.queryOptions({ model, search: useDebounced(search) }),
  );
  return (
    <div className="relation-select">
      <input
        aria-label="Verknüpfte Datensätze suchen"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Datensatz suchen …"
      />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">
          {required ? "Bitte auswählen" : "Keine Verknüpfung"}
        </option>
        {value && !data.data?.some((o) => o.value === value) && (
          <option value={value}>{value}</option>
        )}
        {data.data?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label} · {o.value.slice(-6)}
          </option>
        ))}
      </select>
      {data.error && (
        <small role="alert">Verknüpfungen konnten nicht geladen werden.</small>
      )}
    </div>
  );
}
