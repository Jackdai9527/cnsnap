export type MobileHowItWorksStep = {
  title: string;
  description: string;
};

export function MobileHowItWorks({
  kicker,
  title,
  steps
}: {
  kicker: string;
  title: string;
  steps: MobileHowItWorksStep[];
}) {
  return (
    <section className="mobile-home-how-it-works card-stack-section">
      <div className="mobile-home-section-heading">
        <div className="mobile-home-kicker">{kicker}</div>
        <h2>{title}</h2>
      </div>
      <div className="mobile-home-timeline">
        {steps.map((item, index) => (
          <article key={item.title} className="mobile-home-timeline-item">
            <span className="mobile-home-timeline-index">{String(index + 1).padStart(2, "0")}</span>
            <div className="mobile-home-timeline-body">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
