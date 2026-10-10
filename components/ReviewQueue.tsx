"use client";

import { useEffect, useRef, useState } from "react";
import { CallSheet } from "@/components/CallSheet";

export type ReviewItem = {
  id: string;
  name: string | null;
  area: string | null;
  outcomeLabel: string;
  tone: "warn" | "bad";
  reason: string | null;
  handoffNote: string | null;
  aiMarkedWrong: boolean;
  callbackNote: string | null;
};

async function patch(id: string, body: object) {
  const r = await fetch(`/api/calls/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("not saved");
}

export function ReviewQueue({ initial }: { initial: ReviewItem[] }) {
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function showToast(t: { id: string; text: string } | null) {
    setToast(t);
    if (timer.current) clearTimeout(timer.current);
    if (t) timer.current = setTimeout(() => setToast(null), 8000);
  }

  // Undo instead of a confirm dialog: marking is instant and can be reversed.
  async function setWrong(id: string, wrong: boolean) {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, aiMarkedWrong: wrong } : x)));
    showToast(wrong ? { id, text: "Marked as “AI got it wrong”." } : null);
    try {
      await patch(id, { ai_marked_wrong: wrong });
    } catch {
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, aiMarkedWrong: !wrong } : x)));
      showToast({ id: "", text: "That change was not saved. Try again." });
    }
  }

  async function saveNote(id: string, note: string) {
    const current = items.find((x) => x.id === id)?.callbackNote ?? "";
    if (note.trim() === current.trim()) return;
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, callbackNote: note.trim() || null } : x)));
    try {
      await patch(id, { callback_note: note.trim() || null });
      setSaved((s) => ({ ...s, [id]: "Saved" }));
    } catch {
      setSaved((s) => ({ ...s, [id]: "Not saved. Check your connection and click out of the box again." }));
    }
  }

  if (items.length === 0) {
    return (
      <div className="card empty">
        <h2>Nothing to review</h2>
        <p className="sub">Calls that are not the right fit, or need a person, will show up here for the front desk.</p>
        <a className="btn" href="/new-call">Add a call</a>
      </div>
    );
  }

  return (
    <>
      {items.map((x) => (
        <div className="card" key={x.id}>
          <div className="review-head">
            <div>
              <strong>{x.name ?? "Unnamed caller"}{x.area ? ` · ${x.area}` : ""}</strong>{" "}
              <span className={`pill ${x.tone}`}>{x.outcomeLabel}</span>
              {x.aiMarkedWrong && <> <span className="pill bad">AI got it wrong</span></>}
            </div>
            <a
              href={`/calls/${x.id}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                setOpen(x.id);
              }}
            >
              Open call
            </a>
          </div>
          {x.reason && <p style={{ margin: "0.5rem 0 0" }}>{x.reason}</p>}
          {x.handoffNote && <p className="hint">{x.handoffNote}</p>}

          <div className="field" style={{ marginTop: "0.75rem" }}>
            <label htmlFor={`note-${x.id}`}>Callback note</label>
            <textarea
              id={`note-${x.id}`}
              style={{ minHeight: "4.5rem" }}
              defaultValue={x.callbackNote ?? ""}
              onBlur={(e) => saveNote(x.id, e.target.value)}
              placeholder="Who called back, what was agreed"
            />
            <div className="hint">{saved[x.id] ?? "Saves when you click out of the box."}</div>
          </div>

          {x.aiMarkedWrong ? (
            <button className="btn secondary" onClick={() => setWrong(x.id, false)}>Undo “AI got it wrong”</button>
          ) : (
            <button className="btn secondary" onClick={() => setWrong(x.id, true)}>AI got it wrong</button>
          )}
        </div>
      ))}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.id && <button className="toast-undo" onClick={() => setWrong(toast.id, false)}>Undo</button>}
        </div>
      )}
      <CallSheet id={open} onClose={() => setOpen(null)} />
    </>
  );
}
