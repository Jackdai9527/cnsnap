import { permanentRedirect } from "next/navigation";

type BuyPageProps = {
  searchParams: Promise<{ url?: string; nTag?: string; from?: string }>;
};

export default async function BuyPage({ searchParams }: BuyPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.url) query.set("url", params.url);
  if (params.nTag) query.set("nTag", params.nTag);
  if (params.from) query.set("from", params.from);

  const target = query.toString() ? `/en/product/buy/?${query.toString()}` : "/en/product/buy";
  permanentRedirect(target);
}
