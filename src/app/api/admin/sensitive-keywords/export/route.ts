import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-session";
import { getSensitiveKeywords } from "@/lib/risk-control";

export async function GET() {
  try {
    await requirePermission("settings.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keywords = await getSensitiveKeywords();
  const body = keywords.map((keyword) => keyword.term).join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"sensitive-keywords.txt\""
    }
  });
}
