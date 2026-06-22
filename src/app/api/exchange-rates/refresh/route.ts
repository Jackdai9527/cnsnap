import { NextRequest, NextResponse } from "next/server";
import { ensureExchangeRatesFresh, refreshExchangeRates } from "@/lib/exchange-rates";

export async function GET(request: NextRequest) {
  const force = new URL(request.url).searchParams.get("force") === "1";
  const snapshot = force ? await refreshExchangeRates() : await ensureExchangeRatesFresh();
  return NextResponse.json({
    ok: snapshot.status === "success",
    status: snapshot.status,
    fetchedAt: snapshot.fetchedAt,
    error: snapshot.error
  });
}

export async function POST() {
  const snapshot = await refreshExchangeRates();
  return NextResponse.json({
    ok: snapshot.status === "success",
    status: snapshot.status,
    fetchedAt: snapshot.fetchedAt,
    error: snapshot.error
  });
}
