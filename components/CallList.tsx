"use client";

import { useState } from "react";
import { CallSheet } from "@/components/CallSheet";

export type CallListItem = { id: string; title: string; label: string; tone: "ok" | "warn" | "bad" };

// A plain link (so it still opens in a new tab), which opens the sheet on a normal click.
export function CallList({ items }: { items: CallListItem[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      {items.map((it) => (
        <a
          key={it.id}
          href={`/calls/${it.id}`}
          className="list-item"
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
            e.preventDefault();
            setOpen(it.id);
          }}
        >
          <span>{it.title}</span>
          <span className={`pill ${it.tone}`}>{it.label}</span>
        </a>
      ))}
      <CallSheet id={open} onClose={() => setOpen(null)} />
    </>
  );
}
