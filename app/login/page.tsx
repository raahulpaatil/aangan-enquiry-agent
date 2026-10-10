"use client";

import { useState } from "react";

export default function Login() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!passcode) return setError("Enter the passcode.");
    setError(null);
    const r = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    if (r.ok) window.location.href = "/";
    else setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? "Could not sign in.");
  }

  return (
    <main className="page narrow">
      <h1>Aangan Enquiry Agent</h1>
      <p className="sub">Enter the passcode to continue.</p>
      <form onSubmit={submit} className="card" noValidate>
        <div className="field">
          <label htmlFor="passcode">Passcode</label>
          <input
            id="passcode"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={passcode}
            className={error ? "invalid" : ""}
            onChange={(e) => setPasscode(e.target.value)}
            aria-invalid={!!error}
          />
          <div className="error-text">{error}</div>
        </div>
        <button className="btn" type="submit">Continue</button>
      </form>
    </main>
  );
}
