import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/lib/admin/dashboard-data";
import { requirePermission } from "@/lib/admin-session";
import type { DashboardDateRange } from "@/types/dashboard";

export async function GET(request: Request) {
  try {
    await requirePermission("dashboard.view");
  } catch {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));

  return NextResponse.json(await getDashboardSummary(range));
}

function parseRange(value: string | null): DashboardDateRange {
  if (value === "today" || value === "7d" || value === "30d" || value === "90d") {
    return value;
  }

  return "today";
}
