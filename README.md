# Aangan Enquiry Agent

Turns a phone-call transcript into a qualified, booked, handed-off enquiry for Aangan Studio, and shows the founder a dashboard of what the system generates and what it costs to run.

**What it does, in one line:** a call comes in, the voice agent asks the right questions, you paste the transcript here, and the app decides *Booked / Not the right fit / Needs a person*, books a consultation, emails the handoff, adds the lead to HubSpot, and logs it.

**What it never does:** give a price. A designer shares the figure after seeing the site. `pricing.md` is never loaded, copied or committed.

## The pieces

| Piece | Used for |
|---|---|
| Vaani AI | The voice agent you test with (by hand, no integration) |
| Gemini | Reads the transcript and writes the handoff note |
| Cal.com | Books the consultation (test bookings are labelled TEST) |
| Resend | Emails the handoff, to your own address only |
| HubSpot | Contact, deal and note for the designers |
| Neon | The call log (the Dashboard reads from here) |
| Vercel | Hosts the app behind one passcode |

## Run a test call, start to finish

1. **Open `voice-agent-system-prompt.md`** and paste all of it into Vaani as the agent's system prompt.
2. **Make a test call** in Vaani. Vaani cannot book or email during the test, and calls cost money per minute, so keep it short.
3. **Copy the transcript** Vaani gives you.
4. **Open the app** and go to **New call**. Paste the transcript, type the call length in minutes, and check the call time (it defaults to now).
5. **Press Run this call.** You will see each step live: Analysis, Booking, Email, HubSpot, Logged. Each step shows running, done, needs a person, or failed (with what to do next).
6. **Check the results.**
   - *Booked:* a Cal.com test booking, an email in your inbox, and a HubSpot deal named `TEST - name - area` with the handoff note attached.
   - *Not the right fit / Needs a person:* no booking and no deal. The call appears in **Review queue** for the front desk the next morning.
7. **Review queue:** press **AI got it wrong** if the AI sorted a call badly (you can undo it), and add a callback note. This feeds the AI error rate on the Dashboard.

## Where each key goes

Keys live in a file called `.env.local` in this folder (never committed). `.env.example` lists the names with blank values. Run `npm run check-env` to see which are filled, without showing the values.

| Name | What it is | Where to get it |
|---|---|---|
| `GEMINI_API_KEY` | Gemini key | Google AI Studio, "Get API key" |
| `GEMINI_MODEL` | Model name, e.g. `gemini-3.5-flash-lite` | Google's models page. Change it here to switch models |
| `RESEND_API_KEY` | Resend key | Resend dashboard, API Keys |
| `SELF_EMAIL` | The only address emails go to | Your own email (must be the one you signed up to Resend with) |
| `CAL_API_KEY` | Cal.com key | Cal.com, Settings, Security, API keys |
| `CAL_EVENT_TYPE_ID` | The consultation slot | The number at the end of the event type's address |
| `HUBSPOT_TOKEN` | HubSpot Service Key | HubSpot, Settings, Integrations, Service Keys (scopes: contacts and deals, read and write) |
| `DATABASE_URL` | Neon connection string | Neon, Connect (use the pooled one) |
| `APP_PASSCODE` | The passcode for the whole app | You choose it |

On Vercel, the same names go in **Project, Settings, Environment Variables**.

## Things you can change without touching code

- **`prompts/analyse-call.md`**: the instruction Gemini follows. Edit it like a document: fit rules, how the handoff note is written, the example. Rule: it may never output a price.
- **`voice-agent-system-prompt.md`**: what the voice agent says. Keep it under 700 words and free of any price.
- **`config/app.config.ts`**: designer names, prices (Gemini, Vaani, dollar-to-rupee rate), the 5-minute target, the average project size used for "pipeline at stake". A price set to `null` shows as "not set" and is never guessed.

## How the numbers are worked out

- **Qualified %**: qualified calls ÷ all calls.
- **Handoffs within 5 min**: qualified calls whose handoff email went out within 5 minutes of the call ending (call time plus call length) ÷ qualified calls. For back-dated test transcripts this figure is not meaningful.
- **Run cost per booking**: all running costs (Gemini tokens, Vaani minutes, free tiers at zero) ÷ bookings.
- **AI error rate**: calls marked "AI got it wrong" ÷ calls the front desk reviews (not a fit, or needs a person).
- **Pipeline at stake**: bookings × the average project size, labelled indicative, before conversion.
- Check any figure yourself: `node --env-file=.env.local scripts/verify-dashboard.mjs` prints the raw counts straight from the database.

## Good to know

- Bookings use the **first free slot**, not the caller's preferred time. The preferred time is passed to the designer in the note and the booking details.
- If Gemini returns something unusable, the app retries once. If that fails too, the call goes to **Needs a person** and is logged. There are no further retries.
- The handoff note is checked: if it ever contains a price, the answer is rejected.

## Adding WhatsApp and the web form later

This version handles incoming phone calls only. WhatsApp and the web form are not built. When you add them, they plug into the **same rulebook** and the **same pipeline**:

1. Each new channel only has to turn a conversation into plain transcript text (a WhatsApp thread, or the web-form answers written as "Question: answer" lines).
2. That text goes to the same entry point, `POST /api/calls`, with a length and a time. Nothing else changes: the same `prompts/analyse-call.md` decides the outcome, and the same booking, email, HubSpot and log steps run.
3. To tell channels apart on the Dashboard later, add a "channel" column to the `calls` table (needs a SQL change you approve first).

## Run it on your own computer

```bash
npm install
npm run check-env
npm run dev
```

Then open http://localhost:3000 and enter your passcode.

## Safety rules built in

- Emails always go to `SELF_EMAIL`, from Resend's test sender.
- Everything created in Cal.com and HubSpot is labelled TEST.
- Secrets and `pricing.md` are in `.gitignore` and are not in the git history.
