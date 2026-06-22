import { upsertAddress } from "@/app/_admin/actions";
import { AddressRegionFields } from "@/components/forms/AddressRegionFields";
import { prisma } from "@/lib/db";
import { countryName } from "@/lib/countries";
import { getCurrentUser } from "@/lib/session";

export default async function UserAddressesPage() {
  const user = await getCurrentUser();
  const addresses = await prisma.address.findMany({ where: { userId: user?.id }, orderBy: { updatedAt: "desc" } });
  const first = addresses[0];

  return (
    <section>
      <div className="brand-surface mb-5 rounded-[28px] p-6">
        <div className="label">Shipping profile</div>
        <h1 className="mt-2 font-display text-5xl font-black">Addresses</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">Save up to three delivery addresses for faster checkout and parcel submissions.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3">
          {addresses.map((address) => (
            <article key={address.id} className="panel p-5 transition hover:-translate-y-1 hover:border-[#0a83ff] hover:shadow-[0_22px_52px_rgba(10,131,255,0.14)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-black">{address.label}</div>
                  <p className="mt-1 text-sm text-[#667085]">{address.contactName} · {address.phone}</p>
                </div>
                {address.isDefault ? <span className="badge">Default</span> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-[#667085]">
                {address.line1} {address.line2}<br />
                {address.city}, {address.state} {address.postalCode}, {countryName(address.country)}
              </p>
            </article>
          ))}
        </div>

        <form action={upsertAddress} className="brand-surface h-fit rounded-[26px] p-5">
          <input type="hidden" name="id" value={first?.id ?? ""} />
          <input type="hidden" name="userId" value={user?.id ?? ""} />
          <h2 className="font-display text-3xl font-black">{first ? "Edit primary address" : "Add address"}</h2>
          <div className="mt-4 grid gap-3">
            <input name="label" defaultValue={first?.label ?? "Default"} placeholder="Label" className="input" />
            <input name="contactName" defaultValue={first?.contactName ?? ""} placeholder="Contact name" className="input" required />
            <input name="phone" defaultValue={first?.phone ?? ""} placeholder="Phone" className="input" required />
            <AddressRegionFields
              defaultCountry={first?.country ?? "US"}
              defaultState={first?.state ?? ""}
              cityField={<input name="city" defaultValue={first?.city ?? ""} placeholder="City" className="input" required />}
            />
            <input name="postalCode" defaultValue={first?.postalCode ?? ""} placeholder="Postal code" className="input" required />
            <input name="line1" defaultValue={first?.line1 ?? ""} placeholder="Address line 1" className="input" required />
            <input name="line2" defaultValue={first?.line2 ?? ""} placeholder="Address line 2" className="input" />
            <label className="flex items-center gap-2 text-sm font-semibold text-[#667085]">
              <input type="checkbox" name="isDefault" defaultChecked={first?.isDefault ?? true} />
              Set as default address
            </label>
            <button className="btn-primary">Save address</button>
          </div>
        </form>
      </div>
    </section>
  );
}
