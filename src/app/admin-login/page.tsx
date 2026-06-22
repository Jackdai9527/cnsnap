import { Suspense } from "react";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { getEnabledAuthProviders } from "@/lib/auth-ui";

export default async function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-slate-500">Loading admin sign in...</div>}>
      <div className="site-container grid min-h-[calc(100vh-170px)] items-center gap-8 py-10 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <div className="label">CNSnap Admin</div>
          <h1 className="mt-4 max-w-xl text-5xl font-black leading-tight tracking-tight text-[#111827]">
            Sign in to manage orders, parcels, users, finance, and system settings.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#667085]">
            Use an administrator account configured for this environment.
          </p>
        </section>
        <AuthPanel mode="login" enabledProviders={await getEnabledAuthProviders()} defaultCallbackUrl="/admin" compact loginMode="admin" />
      </div>
    </Suspense>
  );
}
