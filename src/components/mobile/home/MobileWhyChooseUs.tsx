type MobileWhyItem = {
  title: string;
  description: string;
};

export function MobileWhyChooseUs({
  kicker,
  title,
  description,
  items
}: {
  kicker: string;
  title: string;
  description: string;
  items: MobileWhyItem[];
}) {
  return (
    <section className="mobile-home-why card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{kicker}</div>
        <h2>{title}</h2>
        <p className="mobile-home-copy">{description}</p>
      </div>
      <div className="mobile-home-why-grid">
        {items.map((item) => (
          <article key={item.title} className="mobile-home-why-card">
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
