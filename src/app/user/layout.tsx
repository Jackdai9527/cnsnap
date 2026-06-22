import { redirect } from "next/navigation";

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  void children;
  redirect("/account");
}
