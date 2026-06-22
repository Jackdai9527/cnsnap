import { redirect } from "next/navigation";

type BuyPageProps = {
  searchParams: Promise<{ url?: string; nTag?: string; from?: string; htag?: string }>;
};

export default async function BuyPage({ searchParams }: BuyPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.url) query.set("url", params.url);
  if (params.nTag) query.set("nTag", params.nTag);
  if (params.from) query.set("from", params.from);
  if (params.htag) query.set("htag", params.htag);

  const target = query.toString() ? `/zh/product/buy/?${query.toString()}` : "/zh/product/buy";
  redirect(target);
}
