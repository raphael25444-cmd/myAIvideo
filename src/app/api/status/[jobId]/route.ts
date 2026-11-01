import { proxyJson } from "@/lib/serverProxy";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  try {
    return await proxyJson(`/api/status/${encodeURIComponent(jobId)}`);
  } catch {
    return Response.json({ error: "Status unavailable" }, { status: 503 });
  }
}
