import { NextResponse } from "next/server";
import { getMyAddresses } from "@/lib/account/address-service";

export async function GET() {
  try {
    const addresses = await getMyAddresses();
    return NextResponse.json({ addresses });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load addresses." }, { status: 400 });
  }
}
