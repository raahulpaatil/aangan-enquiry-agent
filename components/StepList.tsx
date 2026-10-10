"use client";

import { AnimatePresence, motion } from "motion/react";
import type { StepRecord, StepId } from "@/lib/db";

export const STEP_LABEL: Record<StepId, string> = {
  analysis: "Analysis",
  booking: "Booking",
  email: "Email",
  hubspot: "HubSpot",
  logged: "Logged",
};

const MARK = { running: "", done: "✓", warning: "!", failed: "✕" } as const;
const STATE_WORD = { running: "Running", done: "Done", warning: "Needs a person", failed: "Failed" } as const;

// Critically damped spring: no bounce.
const spring = { type: "spring", duration: 0.35, bounce: 0 } as const;

export function StepList({ steps }: { steps: StepRecord[] }) {
  return (
    <ul className="steps" aria-live="polite">
      <AnimatePresence initial={false}>
        {steps.map((s) => (
          <motion.li
            key={s.id}
            className="step"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
          >
            <span className={`dot ${s.state}`} aria-hidden="true">{MARK[s.state]}</span>
            <div>
              <div className="step-title">
                {STEP_LABEL[s.id]} <span className="sr-only">{STATE_WORD[s.state]}</span>
              </div>
              <div className="step-detail">
                {s.detail}
                {s.ref ? ` (ID: ${s.ref})` : ""}
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
