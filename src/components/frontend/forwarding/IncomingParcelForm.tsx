"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { courierCompanyOptions, productCategoryOptions } from "@/components/frontend/forwarding/forwarding-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AuthState = {
  authenticated: boolean;
  email?: string | null;
};

type IncomingParcelValues = {
  domesticTrackingNumber: string;
  courierCompany: string;
  productName: string;
  productCategory: string;
  quantity: string;
  estimatedValue: string;
  productUrl: string;
  notes: string;
};

export function IncomingParcelForm() {
  const t = useTranslations("Forwarding.form");
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });
  const [submitting, setSubmitting] = useState(false);
  const schema = useMemo(() => createIncomingParcelSchema({
    tracking: t("validation.tracking"),
    courier: t("validation.courier"),
    productName: t("validation.productName"),
    productCategory: t("validation.productCategory"),
    quantity: t("validation.quantity"),
    url: t("validation.url")
  }), [t]);

  const form = useForm<IncomingParcelValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      domesticTrackingNumber: "",
      courierCompany: "",
      productName: "",
      productCategory: "",
      quantity: "1",
      estimatedValue: "",
      productUrl: "",
      notes: ""
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response): Promise<AuthState> => {
        if (!response.ok) return { authenticated: false };
        const payload = await response.json();
        return {
          authenticated: Boolean(payload.authenticated),
          email: payload.user?.email ?? null
        };
      })
      .catch((): AuthState => ({ authenticated: false }))
      .then((nextAuth) => {
        if (!cancelled) setAuth(nextAuth);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(values: IncomingParcelValues) {
    if (!auth.authenticated) {
      toast.error(t("loginRequired"));
      router.push("/login?next=/forwarding");
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    setSubmitting(false);

    // TODO: replace mock action with createForwardingParcel server action.
    console.info("Mock forwarding parcel submitted", {
      ...values,
      quantity: Number(values.quantity),
      estimatedValue: values.estimatedValue ? Number(values.estimatedValue) : null,
      status: "submitted"
    });
    toast.success(t("submitted"));
    router.push("/account/packages");
  }

  return (
    <section id="incoming-parcel-form" className="site-container py-10">
      <Card className="overflow-hidden border-[#dfe7f1] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <CardHeader className="border-b border-[#eef2f6]">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="label">{t("eyebrow")}</div>
              <CardTitle className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</CardTitle>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm font-bold text-[#667085]">
              {auth.authenticated ? t("signedIn", { email: auth.email ?? "" }) : t("guest")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 md:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="domesticTrackingNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.domesticTrackingNumber")}</FormLabel>
                    <FormControl><Input placeholder="SF123456789CN" className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormDescription>{t("hints.domesticTrackingNumber")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="courierCompany" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.courierCompany")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <span className={field.value ? "text-[#101828]" : "text-muted-foreground"}>
                            {field.value || t("placeholders.courierCompany")}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {courierCompanyOptions.map((company) => (
                            <SelectItem key={company} value={company}>{company}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="productName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.productName")}</FormLabel>
                    <FormControl><Input placeholder={t("placeholders.productName")} className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="productCategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.productCategory")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <span className={field.value ? "text-[#101828]" : "text-muted-foreground"}>
                            {field.value ? t(`categories.${field.value}`) : t("placeholders.productCategory")}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {productCategoryOptions.map((category) => (
                            <SelectItem key={category} value={category}>{t(`categories.${category}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.quantity")}</FormLabel>
                    <FormControl><Input type="number" min="1" step="1" className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="estimatedValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.estimatedValue")}</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" placeholder="100" className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="productUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.productUrl")}</FormLabel>
                    <FormControl><Input placeholder="https://..." className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.notes")}</FormLabel>
                  <FormControl><Textarea placeholder={t("placeholders.notes")} className="min-h-32 rounded-xl bg-white font-semibold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex flex-col gap-3 border-t border-[#eef2f6] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold leading-5 text-[#667085]">{t("disclaimer")}</p>
                <Button type="submit" disabled={submitting} className="h-11 rounded-full bg-[#0a83ff] px-6 font-black text-white hover:bg-[#0768cc]">
                  <PackagePlus size={16} />
                  {submitting ? t("submitting") : t("submit")}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}

function createIncomingParcelSchema(messages: {
  tracking: string;
  courier: string;
  productName: string;
  productCategory: string;
  quantity: string;
  url: string;
}) {
  const requiredText = (message: string) => z.string().trim().min(1, message);
  const optionalText = z.string();
  const optionalUrl = z.string().refine((value) => {
    if (!value) return true;
    return z.string().url().safeParse(value).success;
  }, messages.url);

  return z.object({
    domesticTrackingNumber: requiredText(messages.tracking),
    courierCompany: requiredText(messages.courier),
    productName: requiredText(messages.productName),
    productCategory: requiredText(messages.productCategory),
    quantity: z.string().refine((value) => {
      const numericValue = Number(value);
      return Number.isInteger(numericValue) && numericValue > 0;
    }, messages.quantity),
    estimatedValue: optionalText,
    productUrl: optionalUrl,
    notes: optionalText
  });
}
