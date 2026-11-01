import { proxyJson } from "@/lib/serverProxy";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  try {
    return await proxyJson(`/api/jobs/${encodeURIComponent(jobId)}`, {
      method: "DELETE",
    });
  } catch {
    return Response.json({ error: "Could not cancel job" }, { status: 503 });
  }
}
