import { getCurrentUser } from "@/lib/session";

export default async function UserAffiliatePage() {
  const user = await getCurrentUser();
  return (
    <section>
      <div className="brand-surface mb-5 rounded-[28px] p-6"><div className="label">Referral program</div><h1 className="mt-2 font-display text-5xl font-black">Affiliate</h1></div>
      <div className="panel p-6">
        <div className="label">Invite code</div>
        <div className="mt-2 font-display text-5xl font-black text-[#0a83ff]">{user?.referralCode}</div>
        <div className="mt-5 break-all rounded-2xl border border-[#d9e7ff] bg-[#f7fbff] p-4 font-mono text-sm font-semibold text-[#667085]">http://localhost:3000/register?ref={user?.referralCode}</div>
      </div>
    </section>
  );
}
