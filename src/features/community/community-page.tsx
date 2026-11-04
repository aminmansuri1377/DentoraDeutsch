"use client";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { PostFeed } from "./components/post-feed";
import { PostComposer } from "./components/post-composer";
import styles from "./community.module.css";
export function CommunityPage() {
  const params = useSearchParams();
  const [filter, setFilter] = useState<"all" | "mine" | "saved">(
    params.get("filter") === "mine"
      ? "mine"
      : params.get("filter") === "saved"
        ? "saved"
        : "all",
  );
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [compose, setCompose] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (compose)
      editor.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [compose]);
  return (
    <div className={styles.community}>
      <header className={styles.title}>
        <span>GEMEINSAM WEITER</span>
        <h1>Community</h1>
      </header>
      <div className={styles.tabs} role="tablist" aria-label="Beiträge filtern">
        {(
          [
            ["all", "Neueste"],
            ["mine", "Meine Beiträge"],
            ["saved", "Gespeichert"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <label className={styles.search}>
        <Search size={18} />
        <input
          aria-label="Beiträge durchsuchen"
          placeholder="Beiträge durchsuchen …"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <div ref={editor}>
        {compose && (
          <PostComposer
            onClose={() => setCompose(false)}
            onPublished={() => {
              setFilter("mine");
              setSearch("");
              setQuery("");
              setCompose(false);
            }}
          />
        )}
      </div>
      <PostFeed filter={filter} search={query} />
      {!compose && (
        <button
          className={styles.createButton}
          onClick={() => setCompose(true)}
          aria-label="Beitrag erstellen"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
}
