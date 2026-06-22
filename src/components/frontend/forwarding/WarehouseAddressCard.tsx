"use client";

import Link from "next/link";
import { Copy, LockKeyhole, MapPinned } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { mockWarehouseAddress } from "@/components/frontend/forwarding/forwarding-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AuthState = {
  authenticated: boolean;
  email?: string | null;
};

export function WarehouseAddressCard() {
  const t = useTranslations("Forwarding.warehouse");
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response): Promise<AuthState> => {
        if (!response.ok) return { authenticated: false };
        const payload = await response.json();
        return {
          authenticated: Boolean(payload.authenticated),
          email: payload.user?.email ?? null
        };
      })
      .catch((): AuthState => ({ authenticated: false }))
      .then((nextAuth) => {
        if (!cancelled) setAuth(nextAuth);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function copyAddress() {
    const addressText = [
      `${t("recipientName")}: ${mockWarehouseAddress.recipientName}`,
      `${t("warehouseAddress")}: ${mockWarehouseAddress.warehouseAddress}`,
      `${t("phoneNumber")}: ${mockWarehouseAddress.phoneNumber}`,
      `${t("postalCode")}: ${mockWarehouseAddress.postalCode}`,
      `${t("userCode")}: ${mockWarehouseAddress.userCode}`
    ].join("\n");

    await navigator.clipboard.writeText(addressText);
    toast.success(t("copied"));
  }

  return (
    <section id="warehouse-address" className="site-container py-10">
      <Card className="overflow-hidden border-[#dfe7f1] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <CardHeader className="border-b border-[#eef2f6]">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="label">{t("eyebrow")}</div>
              <CardTitle className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</CardTitle>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#667085]">
              {auth.authenticated ? t("signedIn", { email: auth.email ?? "" }) : t("guest")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 md:p-6">
          {auth.authenticated ? (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="grid gap-3 sm:grid-cols-2">
                <AddressLine label={t("recipientName")} value={mockWarehouseAddress.recipientName} />
                <AddressLine label={t("phoneNumber")} value={mockWarehouseAddress.phoneNumber} />
                <AddressLine label={t("postalCode")} value={mockWarehouseAddress.postalCode} />
                <AddressLine label={t("userCode")} value={mockWarehouseAddress.userCode} strong />
                <div className="sm:col-span-2">
                  <AddressLine label={t("warehouseAddress")} value={mockWarehouseAddress.warehouseAddress} />
                </div>
              </div>
              <div className="rounded-3xl border border-[#d9e7ff] bg-[#f7fbff] p-5">
                <div className="flex items-center gap-2 text-sm font-black text-[#0a83ff]">
                  <MapPinned size={17} />
                  {t("importantTitle")}
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-[#344054]">{t("importantDescription")}</p>
                <p className="mt-3 rounded-2xl bg-white p-3 text-sm font-black text-[#101828]">{t("example")}</p>
                <Button type="button" onClick={copyAddress} className="mt-4 h-11 rounded-full bg-[#0a83ff] px-5 font-black text-white hover:bg-[#0768cc]">
                  <Copy size={16} />
                  {t("copy")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 rounded-3xl border border-[#ffd7df] bg-[#fff8fa] p-5 md:grid-cols-[auto_1fr_auto] md:items-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-white text-[#d9142f]">
                <LockKeyhole size={22} />
              </span>
              <div>
                <h3 className="text-lg font-black text-[#101828]">{t("loginTitle")}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#667085]">{t("loginDescription")}</p>
              </div>
              <Button asChild className="h-11 rounded-full bg-[#d9142f] px-5 font-black text-white hover:bg-[#b90f25]">
                <Link href="/login?next=/forwarding">{t("login")}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function AddressLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#eef2f6] bg-[#fbfdff] p-4">
      <div className="text-xs font-black uppercase text-[#98a2b3]">{label}</div>
      <div className={`mt-2 text-sm leading-6 text-[#101828] ${strong ? "font-black" : "font-bold"}`}>{value}</div>
    </div>
  );
}
