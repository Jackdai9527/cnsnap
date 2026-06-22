"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const rechargeSchema = z.object({
  amount: z.number().positive("Amount must be greater than 0."),
  paymentMethod: z.string().min(1)
});

type RechargeValues = z.output<typeof rechargeSchema>;

export function RechargeForm() {
  const t = useTranslations("account.recharge.form");
  const form = useForm<RechargeValues>({
    resolver: zodResolver(rechargeSchema),
    defaultValues: { amount: 50, paymentMethod: "manual" }
  });

  function onSubmit(values: RechargeValues) {
    toast.success(t("created", { amount: values.amount.toFixed(2) }));
    form.reset({ amount: values.amount, paymentMethod: values.paymentMethod });
  }

  return (
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("amount")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={field.value}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormDescription>{t("amountHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("paymentMethod")}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="manual">{t("manual")}</SelectItem>
                      <SelectItem value="paypal" disabled>{t("paypalLater")}</SelectItem>
                      <SelectItem value="stripe" disabled>{t("stripeLater")}</SelectItem>
                      <SelectItem value="card" disabled>{t("cardLater")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full sm:w-fit">{t("submit")}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
