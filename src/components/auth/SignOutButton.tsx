import { LogoutButton } from "@/components/auth/LogoutButton";

export function SignOutButton() {
  return (
    <LogoutButton callbackUrl="/login" className="px-3 py-2 text-sm font-semibold text-[#667085] hover:bg-[#111827] hover:text-white">
      Sign out
    </LogoutButton>
  );
}
