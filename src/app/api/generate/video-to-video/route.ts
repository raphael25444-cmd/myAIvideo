import { proxyForm } from "@/lib/serverProxy";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    if (!form.has("mode")) form.set("mode", "video");
    return await proxyForm("/api/generate", form);
  } catch {
    return Response.json(
      { error: "AI backend unreachable. Start it with `docker compose up ai`." },
      { status: 503 },
    );
  }
}
