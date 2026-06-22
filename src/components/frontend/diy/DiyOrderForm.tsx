"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { destinationCountryOptions } from "@/components/frontend/diy/diy-order-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type AuthState = {
  authenticated: boolean;
  email?: string | null;
};

type DiyOrderValues = {
  productUrl: string;
  productName: string;
  productImageUrl: string;
  specification: string;
  quantity: string;
  budget: string;
  destinationCountry: string;
  notes: string;
  contactEmail: string;
};

export function DiyOrderForm() {
  const t = useTranslations("DiyOrder.form");
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ authenticated: false });
  const [submitting, setSubmitting] = useState(false);
  const schema = useMemo(() => createDiyOrderSchema({
    productName: t("validation.productName"),
    quantity: t("validation.quantity"),
    destination: t("validation.destination"),
    url: t("validation.url"),
    email: t("validation.email")
  }), [t]);

  const form = useForm<DiyOrderValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productUrl: "",
      productName: "",
      productImageUrl: "",
      specification: "",
      quantity: "1",
      budget: "",
      destinationCountry: "US",
      notes: "",
      contactEmail: ""
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
        if (cancelled) return;
        setAuth(nextAuth);
        if (nextAuth.email) {
          form.setValue("contactEmail", nextAuth.email, { shouldDirty: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [form]);

  async function onSubmit(values: DiyOrderValues) {
    if (!auth.authenticated) {
      toast.error(t("loginRequired"));
      router.push("/login?next=/diy-order");
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    setSubmitting(false);

    // TODO: replace mock action with createDiyOrder server action.
    console.info("Mock DIY Order submitted", {
      ...values,
      quantity: Number(values.quantity),
      status: "submitted"
    });
    toast.success(t("submitted"));
    router.push("/account/diy-orders");
  }

  return (
    <section id="diy-order-form" className="site-container py-10">
      <Card className="overflow-hidden border-[#dfe7f1] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <CardHeader className="border-b border-[#eef2f6]">
          <div className="grid gap-2 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="label">{t("eyebrow")}</div>
              <CardTitle className="mt-2 text-3xl font-black text-[#101828]">{t("title")}</CardTitle>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
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
                <FormField control={form.control} name="productName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.productName")}</FormLabel>
                    <FormControl><Input placeholder={t("placeholders.productName")} className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="productUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.productUrl")}</FormLabel>
                    <FormControl><Input placeholder="https://..." className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormDescription>{t("hints.productUrl")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField control={form.control} name="productImageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.productImageUrl")}</FormLabel>
                    <FormControl><Input placeholder="https://example.com/image.jpg" className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormDescription>{t("hints.productImageUrl")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="specification" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.specification")}</FormLabel>
                    <FormControl><Input placeholder={t("placeholders.specification")} className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
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
                <FormField control={form.control} name="budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.budget")}</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" placeholder="100" className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="destinationCountry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("fields.destinationCountry")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {destinationCountryOptions.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {t(`countries.${country.code}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
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

              <FormField control={form.control} name="contactEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("fields.contactEmail")}</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" className="h-11 rounded-xl bg-white font-bold" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex flex-col gap-3 border-t border-[#eef2f6] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold leading-5 text-[#667085]">{t("disclaimer")}</p>
                <Button type="submit" disabled={submitting} className="h-11 rounded-full bg-[#d9142f] px-6 font-black text-white hover:bg-[#b90f25]">
                  <Send size={16} />
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

function createDiyOrderSchema(messages: { productName: string; quantity: string; destination: string; url: string; email: string }) {
  const optionalText = z.string();
  const optionalUrl = z.string().refine((value) => {
    if (!value) return true;
    return z.string().url().safeParse(value).success;
  }, messages.url);

  return z.object({
    productUrl: optionalUrl,
    productName: z.string().trim().min(2, messages.productName),
    productImageUrl: optionalUrl,
    specification: optionalText,
    quantity: z.string().refine((value) => {
      const numericValue = Number(value);
      return Number.isInteger(numericValue) && numericValue > 0;
    }, messages.quantity),
    budget: optionalText,
    destinationCountry: z.string().min(1, messages.destination),
    notes: optionalText,
    contactEmail: z.string().email(messages.email)
  });
}
