"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ShippingEstimateResult } from "@/components/frontend/estimation/ShippingEstimateResult";
import {
  calculateShippingEstimate,
  popularDestinationCountries,
  productCategories,
  shippingChannelRules,
  type ProductCategory,
  type ShippingEstimateResult as EstimateResult
} from "@/components/frontend/estimation/shipping-estimation-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { countryNameLocalized } from "@/lib/countries";

const productCategoryValues = ["general", "clothing", "shoes", "electronics", "battery", "liquid", "cosmetics", "food", "powder", "luxury", "other"] as const;

type EstimatorValues = {
  destinationCountry: string;
  productCategory: (typeof productCategoryValues)[number];
  actualWeightKg: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  shippingChannel?: string;
};

export function ShippingEstimatorForm() {
  const t = useTranslations("Estimation.calculator");
  const channelT = useTranslations("Estimation.channelDetails");
  const locale = useLocale();
  const [result, setResult] = useState<EstimateResult | null>(null);
  const estimatorSchema = useMemo(() => createEstimatorSchema({
    required: t("validation.required"),
    positive: t("validation.positive"),
    destination: t("validation.destination"),
    dimensionsComplete: t("validation.dimensionsComplete")
  }), [t]);
  const countryOptions = useMemo(
    () => popularDestinationCountries.map((code) => ({ code, label: `${countryNameLocalized(code, locale)} (${code})` })),
    [locale]
  );
  const form = useForm<EstimatorValues>({
    resolver: zodResolver(estimatorSchema),
    defaultValues: {
      destinationCountry: "US",
      productCategory: "general",
      actualWeightKg: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      shippingChannel: "all"
    }
  });

  function onSubmit(values: EstimatorValues) {
    const nextResult = calculateShippingEstimate({
      destinationCountry: values.destinationCountry,
      productCategory: values.productCategory as ProductCategory,
      actualWeightKg: Number(values.actualWeightKg),
      lengthCm: toOptionalNumber(values.lengthCm),
      widthCm: toOptionalNumber(values.widthCm),
      heightCm: toOptionalNumber(values.heightCm),
      shippingChannel: values.shippingChannel === "all" ? undefined : values.shippingChannel
    });

    setResult(nextResult);

    if (nextResult.available.length) {
      toast.success(t("toastSuccess"));
    } else {
      toast.warning(t("toastReview"));
    }
  }

  function resetCalculator() {
    form.reset({
      destinationCountry: "US",
      productCategory: "general",
      actualWeightKg: "",
      lengthCm: "",
      widthCm: "",
      heightCm: "",
      shippingChannel: "all"
    });
    setResult(null);
  }

  return (
    <section id="shipping-calculator" className="site-container py-10">
      <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
        <Card className="h-fit border-[#dfe7f1] bg-white shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <CardHeader className="border-b border-[#eef2f6]">
            <div className="grid size-12 place-items-center rounded-2xl bg-[#101828] text-white">
              <Calculator size={22} />
            </div>
            <CardTitle className="pt-2 text-2xl font-black text-[#101828]">{t("title")}</CardTitle>
            <p className="text-sm font-semibold leading-6 text-[#667085]">{t("description")}</p>
          </CardHeader>
          <CardContent className="p-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField control={form.control} name="destinationCountry" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("destinationCountry")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {countryOptions.map((country) => (
                            <SelectItem key={country.code} value={country.code}>{country.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="productCategory" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("productCategory")}</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {productCategories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>{t(category.labelKey)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="actualWeightKg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("actualWeightKg")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="1.20"
                        className="h-11 rounded-xl bg-white font-bold"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid gap-3 sm:grid-cols-3">
                  <DimensionField name="lengthCm" label={t("lengthCm")} placeholder="35" />
                  <DimensionField name="widthCm" label={t("widthCm")} placeholder="25" />
                  <DimensionField name="heightCm" label={t("heightCm")} placeholder="18" />
                </div>

                <p className="rounded-2xl bg-[#f8fafc] p-3 text-xs font-semibold leading-5 text-[#667085]">
                  {t("dimensionHint")}
                </p>

                <FormField control={form.control} name="shippingChannel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("shippingChannel")}</FormLabel>
                    <FormControl>
                      <Select value={field.value ?? "all"} onValueChange={field.onChange}>
                        <SelectTrigger className="h-11 w-full rounded-xl bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allChannels")}</SelectItem>
                          {shippingChannelRules.map((channel) => (
                            <SelectItem key={channel.code} value={channel.code}>{channelT(`${channel.code}.name`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <Button type="submit" className="h-11 rounded-full bg-[#d9142f] font-black text-white hover:bg-[#b90f25]">
                    <Calculator size={16} />
                    {t("calculate")}
                  </Button>
                  <Button type="button" variant="outline" className="h-11 rounded-full font-black" onClick={resetCalculator}>
                    <RotateCcw size={16} />
                    {t("reset")}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <ShippingEstimateResult result={result} />
      </div>
    </section>
  );
}

function toOptionalNumber(value?: string) {
  return value ? Number(value) : undefined;
}

function createEstimatorSchema(messages: { required: string; positive: string; destination: string; dimensionsComplete: string }) {
  const positiveNumberString = z.string().min(1, messages.required).refine((value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0;
  }, messages.positive);

  const optionalPositiveNumberString = z.string().optional().refine((value) => {
    if (!value) return true;
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0;
  }, messages.positive);

  return z.object({
    destinationCountry: z.string().min(1, messages.destination),
    productCategory: z.enum(productCategoryValues),
    actualWeightKg: positiveNumberString,
    lengthCm: optionalPositiveNumberString,
    widthCm: optionalPositiveNumberString,
    heightCm: optionalPositiveNumberString,
    shippingChannel: z.string().optional()
  }).superRefine((values, context) => {
    const dimensions = [values.lengthCm, values.widthCm, values.heightCm];
    const filledCount = dimensions.filter((value) => Boolean(value)).length;

    if (filledCount > 0 && filledCount < 3) {
      context.addIssue({
        code: "custom",
        path: ["lengthCm"],
        message: messages.dimensionsComplete
      });
    }
  });
}

function DimensionField({ name, label, placeholder }: { name: "lengthCm" | "widthCm" | "heightCm"; label: string; placeholder: string }) {
  const t = useTranslations("Estimation.calculator");
  const form = useFormContext<EstimatorValues>();

  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <Input
            {...field}
            value={field.value ?? ""}
            type="number"
            min="0"
            step="0.1"
            placeholder={placeholder}
            aria-label={label}
            className="h-11 rounded-xl bg-white font-bold"
          />
        </FormControl>
        <FormMessage />
        <span className="sr-only">{t("dimensionUnit")}</span>
      </FormItem>
    )} />
  );
}
