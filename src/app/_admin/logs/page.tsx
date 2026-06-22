import { redirect } from "next/navigation";

export default function AdminLogsRedirectPage() {
  redirect("/admin/settings/operation-logs");
}
