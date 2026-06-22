"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ticketCategories, ticketPriorities, type TicketCategory, type TicketPriority } from "@/types/ticket";
import type { TicketListItem } from "@/types/ticket";

const ticketSchema = z.object({
  category: z.custom<TicketCategory>((value) => typeof value === "string" && ticketCategories.some((item) => item.value === value), "Please choose a category."),
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(10, "Message must be at least 10 characters."),
  relatedOrderId: z.string().optional(),
  relatedPackageId: z.string().optional(),
  priority: z.custom<TicketPriority>((value) => typeof value === "string" && ticketPriorities.some((item) => item.value === value), "Please choose a priority."),
  attachments: z.string().optional()
});

type TicketFormValues = z.input<typeof ticketSchema>;

export function TicketForm({ defaultOrderId, defaultPackageId }: { defaultOrderId?: string; defaultPackageId?: string }) {
  const t = useTranslations("account.tickets.newForm");
  const router = useRouter();
  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: defaultPackageId ? "package" : defaultOrderId ? "order" : "order",
      subject: "",
      message: "",
      relatedOrderId: defaultOrderId ?? "",
      relatedPackageId: defaultPackageId ?? "",
      priority: "normal",
      attachments: ""
    }
  });

  async function onSubmit(values: TicketFormValues) {
    const response = await fetch("/api/account/tickets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values)
    });
    const payload = await response.json() as { ticket?: TicketListItem; error?: string };
    if (!response.ok || !payload.ticket) {
      toast.error(payload.error || t("createFailed"));
      return;
    }

    toast.success(t("created"));
    router.push(`/account/tickets/${payload.ticket.id}?created=1&category=${payload.ticket.category}`);
    router.refresh();
  }

  return (
    <Card className="border-slate-200 bg-white/90 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
      <CardContent className="p-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                  <FormLabel>{t("category")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ticketCategories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("priority")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-9 w-full bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ticketPriorities.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("subject")}</FormLabel>
                <FormControl><Input placeholder={t("subjectPlaceholder")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("message")}</FormLabel>
                <FormControl><Textarea className="min-h-36" placeholder={t("messagePlaceholder")} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField control={form.control} name="relatedOrderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("relatedOrder")}</FormLabel>
                  <FormControl><Input placeholder={t("relatedOrderPlaceholder")} {...field} /></FormControl>
                  <FormDescription>{t("relatedOrderHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="relatedPackageId" render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("relatedPackage")}</FormLabel>
                  <FormControl><Input placeholder={t("relatedPackagePlaceholder")} {...field} /></FormControl>
                  <FormDescription>{t("relatedPackageHelp")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="attachments" render={({ field }) => (
              <FormItem>
                <FormLabel>{t("attachment")}</FormLabel>
                <FormControl><Input placeholder={t("attachmentPlaceholder")} {...field} /></FormControl>
                <FormDescription>{t("attachmentHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => router.push("/account/tickets")}>{t("cancel")}</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : null}
                {form.formState.isSubmitting ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
