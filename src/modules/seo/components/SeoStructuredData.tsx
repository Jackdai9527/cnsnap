import Script from "next/script";

export function SeoStructuredData({ data }: { data: Record<string, unknown>[] }) {
  if (!data.length) return null;
  return (
    <>
      {data.map((item, index) => (
        <Script
          key={`seo-structured-data-${index}`}
          id={`seo-structured-data-${index}`}
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
