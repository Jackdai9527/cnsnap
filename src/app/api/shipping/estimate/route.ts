import { NextRequest, NextResponse } from "next/server";
import { estimateShipping } from "@/modules/shipping/service";

export async function POST(request: NextRequest) {
  const input = await request.json();
  const estimates = await estimateShipping({
    country: String(input.country ?? "US"),
    weightKg: Number(input.weightKg ?? 0.5),
    lengthCm: input.lengthCm ? Number(input.lengthCm) : undefined,
    widthCm: input.widthCm ? Number(input.widthCm) : undefined,
    heightCm: input.heightCm ? Number(input.heightCm) : undefined,
    category: input.category ?? "general"
  });

  return NextResponse.json(estimates);
}
