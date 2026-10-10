import { CallInput, PipelineEvent, runPipeline } from "@/lib/pipeline";

export const maxDuration = 60;

// Streams one JSON line per pipeline event so the page can show steps live.
export async function POST(req: Request) {
  const parsed = CallInput.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ errors: z_flatten(parsed.error) }, { status: 400 });
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: PipelineEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await runPipeline(parsed.data, emit);
      } catch (e) {
        emit({ type: "error", message: (e as Error).message });
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}

function z_flatten(err: { issues: { path: PropertyKey[]; message: string }[] }) {
  const out: Record<string, string> = {};
  for (const i of err.issues) out[String(i.path[0])] ??= i.message;
  return out;
}
