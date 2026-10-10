"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { CallDetailView, CallDetailData } from "@/components/CallDetailView";

// Critically damped spring (damping ratio 1.0, response about 0.35 s): no bounce.
const spring = { type: "spring", duration: 0.35, bounce: 0 } as const;

function Sheet({ id, onClose }: { id: string; onClose: () => void }) {
  const reduce = useReducedMotion();
  const [data, setData] = useState<CallDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    setNarrow(window.matchMedia("(max-width: 40rem)").matches);
  }, []);

  useEffect(() => {
    let live = true;
    fetch(`/api/calls/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Could not load this call."))))
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Enter and leave along the same path. With reduced motion: a cross-fade only.
  const off = reduce ? { opacity: 0 } : narrow ? { y: "100%" } : { x: "100%" };
  const on = reduce ? { opacity: 1 } : { x: 0, y: 0, opacity: 1 };

  return (
    <>
      <motion.div
        className="scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={reduce ? { duration: 0.2 } : spring}
        onClick={onClose}
      />
      <motion.aside
        className="sheet"
        role="dialog"
        aria-label="Call detail"
        initial={off}
        animate={on}
        exit={off}
        transition={reduce ? { duration: 0.2 } : spring}
      >
        <div className="sheet-bar">
          <button className="btn secondary small" onClick={onClose}>Close</button>
        </div>
        {error ? <p className="error-text">{error}</p> : data ? <CallDetailView d={data} /> : <p className="sub">Loading…</p>}
      </motion.aside>
    </>
  );
}

export function CallSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  return <AnimatePresence>{id && <Sheet key={id} id={id} onClose={onClose} />}</AnimatePresence>;
}
