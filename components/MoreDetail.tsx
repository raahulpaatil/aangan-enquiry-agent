"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

const spring = { type: "spring", duration: 0.35, bounce: 0 } as const;

// "One level deeper": the common path stays on screen, the detail opens on request.
export function MoreDetail({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return (
    <div>
      <button className="btn secondary" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Hide detail" : "Show more detail"}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            style={{ overflow: "hidden" }}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0.2 } : spring}
          >
            <div style={{ paddingTop: "1rem" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
