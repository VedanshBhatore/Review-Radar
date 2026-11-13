import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getStore().getReport(id);
  if (!report) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <h1 className="text-2xl font-bold">{report.app.appName}</h1>
      <p className="text-sm text-foreground-muted">
        {report.reviews.length} reviews analysed · {report.themes.length} themes · report {report.id}
      </p>
      <p className="mt-4 text-sm text-foreground-muted">Full report UI coming in Phase 4.</p>
    </main>
  );
}
