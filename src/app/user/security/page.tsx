import { KeyRound, Mail, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { updateUserEmail, updateUserPassword } from "@/app/user/actions";

export default async function UserSecurityPage() {
  const user = await getCurrentUser();
  const authAccounts = await prisma.authAccount.findMany({ where: { userId: user?.id }, select: { provider: true } });
  const providers = authAccounts.map((account) => account.provider).join(", ");

  return (
    <section className="space-y-5">
      <div className="brand-surface rounded-[28px] p-6 md:p-7">
        <div className="label">Account protection</div>
        <h1 className="mt-2 font-display text-5xl font-black text-[#101828]">Account security</h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">
          Manage password, account email, and verification settings for this login.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-5">
          <form action={updateUserPassword} className="panel p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                <KeyRound size={20} />
              </div>
              <div>
                <h2 className="font-display text-3xl font-black text-[#101828]">Password</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">
                  {user?.passwordHash ? "Enter your current password before setting a new one." : "Set a password for email login on this account."}
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {user?.passwordHash ? <input name="currentPassword" type="password" placeholder="Current password" className="input" required /> : null}
              <input name="newPassword" type="password" minLength={8} placeholder="New password" className="input" required />
              <input name="confirmPassword" type="password" minLength={8} placeholder="Confirm new password" className="input" required />
              <button className="btn-primary w-fit rounded-xl px-5 py-2.5">Update password</button>
            </div>
          </form>

          <form action={updateUserEmail} className="panel p-5 md:p-6">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff3f5] text-[#d9142f]">
                <Mail size={20} />
              </div>
              <div>
                <h2 className="font-display text-3xl font-black text-[#101828]">Email address</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">
                  Change the email used for login, order notifications, and support contact.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <input name="email" type="email" defaultValue={user?.email} placeholder="Email address" className="input" required />
              <button className="btn-secondary w-fit rounded-xl px-5 py-2.5">Update email</button>
            </div>
          </form>
        </section>

        <aside className="panel h-fit p-5 md:p-6">
          <div className="grid size-12 place-items-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
            <ShieldCheck size={22} />
          </div>
          <h2 className="mt-4 font-display text-3xl font-black text-[#101828]">Security status</h2>
          <div className="mt-4 space-y-3 text-sm font-semibold text-[#667085]">
            <Status label="Email" value={user?.email ?? "-"} />
            <Status label="Password" value={user?.passwordHash ? "Enabled" : "Not set"} />
            <Status label="Linked login" value={providers || "None"} />
            <Status label="Email verification" value="Magic link available when SMTP is enabled" />
          </div>
        </aside>
      </div>
    </section>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dfe7f1] bg-[#f8fafc] p-4">
      <div className="text-xs font-extrabold uppercase text-[#98a2b3]">{label}</div>
      <div className="mt-1 break-words font-bold text-[#101828]">{value}</div>
    </div>
  );
}
