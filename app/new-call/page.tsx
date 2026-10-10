"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { StepList } from "@/components/StepList";
import type { StepRecord } from "@/lib/db";

// Value for <input type="datetime-local">, in the browser's own time zone.
function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type Errors = { transcript?: string; call_minutes?: string; call_time?: string };

function validate(transcript: string, minutes: string, time: string): Errors {
  const e: Errors = {};
  if (transcript.trim().length < 20) e.transcript = "Paste the call transcript (at least a few lines).";
  const m = Number(minutes);
  if (!minutes || !(m > 0)) e.call_minutes = "Enter the call length in minutes, for example 4.5.";
  if (!time || Number.isNaN(new Date(time).getTime())) e.call_time = "Pick the date and time of the call.";
  return e;
}

export default function NewCall() {
  const [transcript, setTranscript] = useState("");
  const [minutes, setMinutes] = useState("");
  const [time, setTime] = useState(nowLocal);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [steps, setSteps] = useState<StepRecord[]>([]);
  const [callId, setCallId] = useState<string | null>(null);
  const [topError, setTopError] = useState<string | null>(null);
  const busy = useRef(false);

  const errors = validate(transcript, minutes, time);
  const show = (k: keyof Errors) => (touched[k] ? errors[k] : undefined);

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    setTouched({ transcript: true, call_minutes: true, call_time: true });
    if (Object.keys(errors).length || busy.current) return;
    busy.current = true;
    setSteps([]);
    setCallId(null);
    setTopError(null);
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          call_minutes: Number(minutes),
          call_time: new Date(time).toISOString(),
        }),
      });
      if (!res.ok || !res.body) {
        setTopError("The call was not sent. Check the fields above and try again.");
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const e = JSON.parse(line);
          if (e.type === "step") {
            setSteps((prev) => {
              const i = prev.findIndex((s) => s.id === e.step.id);
              return i >= 0 ? prev.map((s, j) => (j === i ? e.step : s)) : [...prev, e.step];
            });
          } else if (e.type === "done") setCallId(e.id);
          else if (e.type === "error") setTopError(e.message);
        }
      }
    } catch {
      setTopError("Lost the connection. Check your internet and submit again.");
    } finally {
      busy.current = false;
    }
  }

  return (
    <main className="page narrow">
      <h1>New call</h1>
      <p className="sub">Paste a call transcript. The system reads it and shows each step as it happens.</p>

      <form onSubmit={submit} noValidate className="card">
        <div className="field">
          <label htmlFor="transcript">Call transcript</label>
          <textarea
            id="transcript"
            value={transcript}
            className={show("transcript") ? "invalid" : ""}
            onChange={(e) => setTranscript(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, transcript: true }))}
            aria-invalid={!!show("transcript")}
            aria-describedby="transcript-err"
          />
          <div id="transcript-err" className="error-text">{show("transcript")}</div>
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="minutes">Call length (minutes)</label>
            <input
              id="minutes"
              inputMode="decimal"
              value={minutes}
              className={show("call_minutes") ? "invalid" : ""}
              onChange={(e) => setMinutes(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, call_minutes: true }))}
              aria-invalid={!!show("call_minutes")}
            />
            <div className="error-text">{show("call_minutes")}</div>
          </div>
          <div className="field">
            <label htmlFor="time">Call time</label>
            <input
              id="time"
              type="datetime-local"
              value={time}
              className={show("call_time") ? "invalid" : ""}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, call_time: true }))}
              aria-invalid={!!show("call_time")}
            />
            <div className="error-text">{show("call_time")}</div>
          </div>
        </div>
        <button className="btn" type="submit">Run this call</button>
      </form>

      {(steps.length > 0 || topError) && (
        <div className="card">
          <h2>Progress</h2>
          <StepList steps={steps} />
          {topError && <p className="error-text">{topError}</p>}
          {callId && (
            <p style={{ marginTop: "1rem" }}>
              <Link href={`/calls/${callId}`} className="btn">Open the record</Link>
            </p>
          )}
        </div>
      )}
    </main>
  );
}
