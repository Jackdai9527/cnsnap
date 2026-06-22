"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LogoutButtonProps = {
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
  logoutMode?: "user" | "admin";
};

export function LogoutButton({
  callbackUrl = "/login",
  className,
  children = "Sign out",
  logoutMode = "user"
}: LogoutButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    if (logoutMode === "admin") {
      await fetch("/api/admin/auth/logout", { method: "POST" }).catch(() => null);
    } else {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
      await signOut({ callbackUrl, redirect: false });
    }
    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={logout} disabled={pending}>
      {pending ? "Signing out..." : children}
    </button>
  );
}
