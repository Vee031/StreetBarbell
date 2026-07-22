import { NextResponse } from "next/server";
import { getTeamMember } from "@/lib/team-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const email = await getTeamMember();
  return NextResponse.json({ email }, { headers: { "cache-control": "no-store" } });
}
