"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/provider";
import { useDebounced } from "@/hooks/use-debounced";
import {
  Search,
  Plus,
  Database,
  LogOut,
  ArrowUpRight,
  BookOpen,
  Users,
  MessagesSquare,
  ShoppingBag,
  Settings2,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Loading, ErrorNotice } from "@/components/ui/feedback";
import { panelLogout } from "./actions";
import type { PanelModel, PanelRecord } from "./types";
import { RecordTable, displayValue } from "./record-table";
import { RecordEditor } from "./record-editor";
import { DeleteDialog } from "./delete-dialog";
const groupIcons: Record<string, typeof Database> = {
  Lerninhalte: BookOpen,
  "Mitglieder & Zugang": Users,
  Community: MessagesSquare,
  "Shop & Bestellungen": ShoppingBag,
  "Service & System": Settings2,
  "Lernen & Fortschritt": GraduationCap,
};
export function PanelWorkspace({
  selected,
  testMode,
}: {
  selected?: string;
  testMode: boolean;
}) {
  const api = useTRPC();
  const metadata = useQuery(api.panel.metadata.queryOptions());
  const [filter, setFilter] = useState("");
  if (metadata.isPending)
    return (
      <div className="panel-loading">
        <Loading />
      </div>
    );
  if (metadata.error)
    return (
      <div className="panel-loading">
        <ErrorNotice message={metadata.error.message} />
      </div>
    );
  const models = metadata.data;
  const groups = Array.from(new Set(models.map((m) => m.group)));
  const current = models.find((m) => m.name === selected);
  return (
    <div className="panel-shell">
      <aside className="panel-sidebar">
        <Link href="/panel" className="brand">
          <span className="brand-symbol">✦</span>dentora.
        </Link>
        <span className="panel-caption">VERWALTUNG</span>
        <label className="panel-nav-search">
          <Search size={16} />
          <input
            aria-label="Tabellen suchen"
            placeholder="Bereich suchen …"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        <nav>
          <Link href="/panel" className={!selected ? "active" : ""}>
            <Database size={17} />
            Übersicht
          </Link>
          {groups.map((group) => {
            const items = models.filter(
              (m) =>
                m.group === group &&
                `${m.label} ${m.name}`
                  .toLowerCase()
                  .includes(filter.toLowerCase()),
            );
            const Icon = groupIcons[group] ?? Database;
            return items.length ? (
              <section key={group}>
                <h3>
                  <Icon size={14} />
                  {group}
                </h3>
                {items.map((m) => (
                  <Link
                    key={m.name}
                    href={`/panel/${m.name}`}
                    className={selected === m.name ? "active" : ""}
                  >
                    {m.label}
                  </Link>
                ))}
              </section>
            ) : null;
          })}
        </nav>
        <footer>
          <Link href="/lernen">
            <ArrowUpRight size={16} />
            Zur Lernplattform
          </Link>
          <button onClick={() => panelLogout()}>
            <LogOut size={16} />
            Abmelden
          </button>
        </footer>
      </aside>
      <div className="panel-main">
        <header className="panel-topbar">
          <span>
            Arbeitsbereich / <strong>{current?.label ?? "Übersicht"}</strong>
          </span>
          <span className="panel-mode">
            {testMode ? "Testumgebung" : "Administration"}
            <span className="avatar">AD</span>
          </span>
        </header>
        {current ? (
          <ModelManager key={current.name} model={current} />
        ) : selected ? (
          <ErrorNotice message="Dieser Verwaltungsbereich existiert nicht." />
        ) : (
          <div className="panel-content">
            <span className="eyebrow">DEIN VERWALTUNGSBEREICH</span>
            <h1>Gute Lernwege beginnen hier.</h1>
            <p>Verwalte Inhalte, Mitglieder und alle Daten deiner Plattform.</p>
            <div className="panel-overview-stats">
              <div>
                <Database />
                <strong>{models.length}</strong>
                <span>Verwaltete Tabellen</span>
              </div>
              <div>
                <BookOpen />
                <strong>7</strong>
                <span>Bereiche für Lerninhalte</span>
              </div>
              <div>
                <Shield />
                <strong>CRUD</strong>
                <span>Erstellen · Anzeigen · Bearbeiten · Löschen</span>
              </div>
            </div>
            <div className="panel-group-grid">
              {groups.map((group) => {
                const Icon = groupIcons[group] ?? Database;
                return (
                  <section key={group}>
                    <Icon />
                    <h2>{group}</h2>
                    <p>
                      {models.filter((m) => m.group === group).length} Tabellen
                    </p>
                    <div>
                      {models
                        .filter((m) => m.group === group)
                        .map((m) => (
                          <Link href={`/panel/${m.name}`} key={m.name}>
                            {m.label}
                            <span>↗</span>
                          </Link>
                        ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function Shield() {
  return <Settings2 />;
}
function ModelManager({ model }: { model: PanelModel }) {
  const api = useTRPC();
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [editor, setEditor] = useState<PanelRecord | "new" | null>(null),
    [view, setView] = useState<PanelRecord | null>(null),
    [deletion, setDeletion] = useState<PanelRecord | null>(null);
  const data = useQuery(
    api.panel.list.queryOptions({
      model: model.name,
      page,
      search: useDebounced(search),
    }),
  );
  return (
    <div className="panel-content">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{model.group}</span>
          <h1>{model.label}</h1>
          <p>Datensätze verwalten und Änderungen direkt übernehmen.</p>
        </div>
        <Button onClick={() => setEditor("new")}>
          <Plus size={17} />
          Neuer Eintrag
        </Button>
      </div>
      <section className="panel-data-card">
        <div className="panel-table-toolbar">
          <label>
            <Search size={18} />
            <input
              aria-label="Datensätze durchsuchen"
              placeholder="Datensätze durchsuchen …"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <span>
            {data.data?.total ?? 0} Einträge · {model.name}
          </span>
        </div>
        {data.isPending ? (
          <Loading />
        ) : data.error ? (
          <ErrorNotice message={data.error.message} />
        ) : (
          <RecordTable
            model={model}
            rows={data.data.rows}
            onView={setView}
            onEdit={setEditor}
            onDelete={setDeletion}
          />
        )}
        <div className="panel-pagination">
          <span>
            Seite {page + 1} von {Math.max(1, data.data?.pages ?? 1)}
          </span>
          <div>
            <Button
              variant="secondary"
              disabled={!page}
              onClick={() => setPage((p) => p - 1)}
            >
              Zurück
            </Button>
            <Button
              variant="secondary"
              disabled={!data.data || page + 1 >= data.data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Weiter
            </Button>
          </div>
        </div>
      </section>
      {editor && (
        <RecordEditor
          model={model}
          record={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {deletion && (
        <DeleteDialog
          model={model}
          record={deletion}
          onClose={() => setDeletion(null)}
        />
      )}{" "}
      {view && (
        <Dialog
          title={`Details · ${model.label}`}
          onClose={() => setView(null)}
        >
          <dl className="record-details">
            {model.fields.map((f) => (
              <div key={f.name}>
                <dt>
                  {f.label}
                  <small>{f.name}</small>
                </dt>
                <dd>
                  {f.secret
                    ? "Geschützter Wert"
                    : displayValue(view.values[f.name])}
                </dd>
              </div>
            ))}
          </dl>
          <footer className="dialog-actions">
            <Button
              onClick={() => {
                setEditor(view);
                setView(null);
              }}
            >
              Bearbeiten
            </Button>
          </footer>
        </Dialog>
      )}
    </div>
  );
}
