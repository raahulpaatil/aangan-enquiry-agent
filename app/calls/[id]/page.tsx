import Link from "next/link";
import { notFound } from "next/navigation";
import { getCallDetail } from "@/lib/detail";
import { CallDetailView } from "@/components/CallDetailView";

export const dynamic = "force-dynamic";

export default async function CallDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getCallDetail(id);
  if (!d) notFound();
  return (
    <main className="page narrow">
      <p><Link href="/">← Dashboard</Link></p>
      <CallDetailView d={d} />
    </main>
  );
}
