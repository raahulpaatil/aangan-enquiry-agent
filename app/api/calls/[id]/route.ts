import { z } from "zod";
import { db } from "@/lib/db";
import { getCallDetail } from "@/lib/detail";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getCallDetail(id);
  if (!d) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(d);
}

// Front desk review actions: mark "AI got it wrong" (and undo it), add a callback note.
const Patch = z
  .object({
    ai_marked_wrong: z.boolean().optional(),
    callback_note: z.string().trim().max(2000).nullable().optional(),
  })
  .refine((v) => v.ai_marked_wrong !== undefined || v.callback_note !== undefined, "Nothing to change");

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid change" }, { status: 400 });

  const sets: string[] = [];
  const vals: unknown[] = [];
  if (parsed.data.ai_marked_wrong !== undefined) {
    vals.push(parsed.data.ai_marked_wrong);
    sets.push(`ai_marked_wrong = $${vals.length}`);
  }
  if (parsed.data.callback_note !== undefined) {
    vals.push(parsed.data.callback_note || null);
    sets.push(`callback_note = $${vals.length}`);
  }
  vals.push(id);
  const rows = (await db().query(
    `update calls set ${sets.join(", ")} where id = $${vals.length} returning id`,
    vals,
  )) as { id: string }[];
  if (!rows.length) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
