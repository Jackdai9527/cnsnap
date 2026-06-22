import { AccountPageHeader } from "@/components/account/AccountPageHeader";
import { Card, CardContent } from "@/components/ui/card";

type AccountPlaceholderPageProps = {
  title: string;
  description: string;
};

export function AccountPlaceholderPage({ title, description }: AccountPlaceholderPageProps) {
  return (
    <div>
      <AccountPageHeader title={title} description={description} />
      <Card className="border-dashed border-slate-200 bg-white/80">
        <CardContent className="p-8 text-sm leading-6 text-slate-500">
          This section is reserved for the next account workflow. The route and layout are ready.
        </CardContent>
      </Card>
    </div>
  );
}
