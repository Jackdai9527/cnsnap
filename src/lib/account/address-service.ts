import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import type { AccountAddress } from "@/types/address";

export async function getMyAddresses(): Promise<AccountAddress[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }]
  });

  return addresses.map((address) => {
    const [firstName, ...rest] = (address.contactName || "").trim().split(/\s+/);
    return {
      id: String(address.id),
      firstName: firstName || "",
      lastName: rest.join(" "),
      country: address.country,
      state: address.state || "",
      city: address.city,
      address1: address.line1,
      address2: address.line2 || "",
      postcode: address.postalCode,
      phone: address.phone,
      email: user.email,
      isDefault: address.isDefault
    };
  });
}
