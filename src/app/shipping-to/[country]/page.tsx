import { redirect } from "next/navigation";

type LegacyShippingLandingPageProps = {
  params: Promise<{ country: string }>;
};

export default async function LegacyShippingLandingPage({ params }: LegacyShippingLandingPageProps) {
  const { country } = await params;
  redirect(`/en/shipping-to/${country}`);
}
