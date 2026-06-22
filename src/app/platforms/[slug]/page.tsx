import { redirect } from "next/navigation";

type LegacyPlatformLandingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyPlatformLandingPage({ params }: LegacyPlatformLandingPageProps) {
  const { slug } = await params;
  redirect(`/en/platforms/${slug}`);
}
