import { getServerSession } from "next-auth";
import { ProfileContent } from "@/components/account/profile/ProfileContent";
import { buildAuthOptions } from "@/lib/auth";

export default async function AccountProfilePage() {
  const session = await getServerSession(await buildAuthOptions());

  return <ProfileContent sessionUserId={session?.user?.id} />;
}
