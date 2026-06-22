"use server";

import type { AccountAddressFormValues } from "@/types/address";

export async function saveAddress(_values: AccountAddressFormValues) {
  // TODO: Persist account address with Prisma/MySQL once the account API is connected.
  void _values;
  return { ok: true };
}
