import { backendReachable } from "@/lib/serverProxy";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await backendReachable();
  return Response.json(status);
}
