"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { TicketStatus } from "@/types/ticket";

const replySchema = z.object({
  message: z.string().min(2, "Reply must be at least 2 characters."),
  attachments: z.string().optional()
});

type ReplyValues = z.output<typeof replySchema>;

export function TicketReplyForm({ status }: { status: TicketStatus }) {
  const t = useTranslations("account.tickets.reply");
  const form = useForm<ReplyValues>({
    resolver: zodResolver(replySchema),
    defaultValues: { message: "", attachments: "" }
  });

  if (status === "closed") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        {t("closed")}
      </div>
    );
  }

  function onSubmit() {
    toast.success(t("submitted"));
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("reply")}</FormLabel>
            <FormControl><Textarea className="min-h-28" placeholder={t("replyPlaceholder")} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="attachments" render={({ field }) => (
          <FormItem>
            <FormLabel>{t("attachment")}</FormLabel>
            <FormControl><Input placeholder={t("attachmentPlaceholder")} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <div className="flex flex-wrap justify-end gap-2">
          {status === "resolved" ? <Button type="button" variant="outline" onClick={() => toast.info(t("reopenInfo"))}>{t("reopen")}</Button> : null}
          {status !== "resolved" ? <Button type="button" variant="outline" onClick={() => toast.success(t("resolvedInfo"))}>{t("markResolved")}</Button> : null}
          <Button type="button" variant="outline" onClick={() => toast.info(t("closeInfo"))}>{t("closeTicket")}</Button>
          {status !== "resolved" ? <Button type="submit">{t("replyAction")}</Button> : null}
        </div>
      </form>
    </Form>
  );
}
