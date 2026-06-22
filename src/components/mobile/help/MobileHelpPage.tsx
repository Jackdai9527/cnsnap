export function MobileHelpPage({
  search,
  popular,
  categories,
  faq,
  articles,
  support
}: {
  search: React.ReactNode;
  popular: React.ReactNode;
  categories: React.ReactNode;
  faq: React.ReactNode;
  articles: React.ReactNode;
  support: React.ReactNode;
}) {
  return (
    <div className="mobile-help-page md:hidden">
      {search}
      {popular}
      {categories}
      {faq}
      {articles}
      {support}
    </div>
  );
}
