import { proxyStream } from "@/lib/serverProxy";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await params;
  try {
    return await proxyStream(
      `/api/video/${encodeURIComponent(jobId)}`,
      req.headers.get("range"),
    );
  } catch {
    return Response.json({ error: "Video not available" }, { status: 503 });
  }
}
