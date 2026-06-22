import { redirect } from "next/navigation";

type LegacyCampaignLandingPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyCampaignLandingPage({ params }: LegacyCampaignLandingPageProps) {
  const { slug } = await params;
  redirect(`/en/campaign/${slug}`);
}
