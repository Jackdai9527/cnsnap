import { CnsnapSearchBox } from "@/components/product/CnsnapSearchBox";

export function MobileSearchBox({
  kicker,
  title,
  description
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <section className="mobile-home-search card-stack-section">
      <div className="mobile-home-block-header">
        <div className="mobile-home-kicker">{kicker}</div>
        <h1 className="mobile-home-title">{title}</h1>
        <p className="mobile-home-copy">{description}</p>
      </div>

      <div className="mobile-home-search-panel">
        <CnsnapSearchBox hero />
      </div>
    </section>
  );
}
