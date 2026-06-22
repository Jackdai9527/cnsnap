import { redirect } from "next/navigation";

export default function AdminWalletRedirectPage() {
  redirect("/admin/finance/wallet-transactions");
}
