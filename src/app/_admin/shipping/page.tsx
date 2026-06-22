import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { AdminShippingChannelSortableList } from "@/components/admin/sortable/AdminShippingChannelSortableList";
import { CountrySelect } from "@/components/forms/CountrySelect";
import { StatusPill } from "@/components/ui/StatusPill";
import { countryName } from "@/lib/countries";
import { dgeubNotesHtml, dgeubSupportedCountries } from "@/lib/dgeub-rates";
import { prisma } from "@/lib/db";
import {
  deleteShippingChannel,
  deleteShippingRate,
  importDgeubRates,
  upsertShippingChannel,
  upsertShippingRate
} from "../actions";

function textList(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "";
}

type ChannelRow = Awaited<ReturnType<typeof getChannels>>[number];

async function getChannels() {
  return prisma.shippingChannel.findMany({
    include: { rates: { orderBy: [{ countryName: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }]
  });
}

export default async function AdminShippingPage() {
  const t = await getTranslations("shipping.page");
  const channels = await getChannels();
  const defaultChannel = channels.find((channel) => channel.code === "DGEUB") ?? channels[0];
  const tableRows: AdminDataTableRow[] = channels.map((channel) => ({
    id: String(channel.id),
    cells: {
      channel: (
        <div>
          <div className="font-bold text-slate-900">{channel.name}</div>
          <div className="text-xs text-slate-400">{channel.code}</div>
        </div>
      ),
      status: <StatusPill status={channel.isActive ? "active" : "inactive"} />,
      countries: (channel.supportedCountries as string[]).length,
      rates: channel.rates.length,
      eta: `${channel.deliveryTimeMin}-${channel.deliveryTimeMax} days`,
      rule: <span className="block max-w-[260px] truncate">{channel.calculationRule}</span>,
      actions: (
        <div className="flex gap-2">
          <Link href={`#shipping-${channel.id}`} className="admin-action">{t("table.edit")}</Link>
          <form action={deleteShippingChannel}>
            <input type="hidden" name="id" value={channel.id} />
            <button className="admin-danger">{t("table.delete")}</button>
          </form>
        </div>
      )
    },
    searchValues: {
      channel: `${channel.name} ${channel.code}`,
      status: channel.isActive ? "active" : "inactive",
      countries: String((channel.supportedCountries as string[]).length),
      rates: String(channel.rates.length),
      eta: `${channel.deliveryTimeMin}-${channel.deliveryTimeMax}`,
      rule: channel.calculationRule,
      actions: ""
    }
  }));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={importDgeubRates}>
            <button className="admin-action px-4 py-2">{t("importDgeub")}</button>
          </form>
          <Link href="#shipping-new" className="admin-primary px-4 py-2">{t("addChannel")}</Link>
        </div>
      </div>

      <AdminShippingChannelSortableList
        items={channels.map((channel) => ({
          id: channel.id,
          name: channel.name,
          code: channel.code,
          isActive: channel.isActive,
          countryCount: (channel.supportedCountries as string[]).length,
          rateCount: channel.rates.length,
          deliveryTime: t("sortable.deliveryTime", { min: channel.deliveryTimeMin, max: channel.deliveryTimeMax })
        }))}
      />

      <AdminDataPageTable
        columns={[
          { key: "channel", label: t("table.channel") },
          { key: "status", label: t("table.status") },
          { key: "countries", label: t("table.countries") },
          { key: "rates", label: t("table.rates") },
          { key: "eta", label: t("table.eta") },
          { key: "rule", label: t("table.rule") },
          { key: "actions", label: t("table.actions") }
        ]}
        rows={tableRows}
        searchPlaceholder={t("search")}
        showRowActions={false}
      />

      <ChannelEditorModal id="shipping-new" title={t("modals.addChannelTitle")} />
      {channels.map((channel) => (
        <ChannelEditorModal key={channel.id} id={`shipping-${channel.id}`} title={t("modals.editChannelTitle", { name: channel.name })} channel={channel} />
      ))}

      {channels.map((channel) => (
        <AdminModal key={`rate-new-${channel.id}`} id={`rate-new-${channel.id}`} title={t("modals.addRateTitle")} description={channel.name}>
          <RateForm channelId={channel.id} />
        </AdminModal>
      ))}
      {channels.flatMap((channel) => channel.rates.map((rate) => (
        <AdminModal key={rate.id} id={`rate-${rate.id}`} title={t("modals.editRateTitle", { name: rate.countryName })} description={channel.name}>
          <RateForm channelId={channel.id} rate={rate} />
        </AdminModal>
      )))}

      {defaultChannel ? <div className="sr-only">Default shipping channel: {defaultChannel.code}</div> : null}
    </section>
  );
}

async function ChannelEditorModal({ id, title, channel }: { id: string; title: string; channel?: ChannelRow }) {
  const t = await getTranslations("shipping.page");
  const countryValues = channel ? (channel.supportedCountries as string[]) : dgeubSupportedCountries;
  const rateTableRows: AdminDataTableRow[] = channel?.rates.map((rate) => ({
    id: String(rate.id),
    cells: {
      country: rate.countryName || countryName(rate.countryCode),
      code: rate.countryCode,
      rmbPerKg: rate.freightRmbPerKg.toString(),
      fee: rate.handlingFeeRmb.toString(),
      start: rate.startWeightKg.toString(),
      limit: rate.maxWeightKg.toString(),
      actions: <Link href={`#rate-${rate.id}`} className="admin-action">{t("table.edit")}</Link>
    },
    searchValues: {
      country: `${rate.countryName || countryName(rate.countryCode)} ${rate.countryCode}`,
      code: rate.countryCode,
      rmbPerKg: rate.freightRmbPerKg.toString(),
      fee: rate.handlingFeeRmb.toString(),
      start: rate.startWeightKg.toString(),
      limit: rate.maxWeightKg.toString(),
      actions: ""
    }
  })) ?? [];

  return (
    <AdminModal id={id} title={title} description={channel ? t("modals.channelDescription", { count: channel.rates.length }) : t("modals.createChannelDescription")}>
      <div className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <AdminSaveForm action={upsertShippingChannel} className="admin-card grid h-fit gap-4 p-4" submitLabel={t("forms.saveChannel")}>
          <input type="hidden" name="id" value={channel?.id ?? ""} />
          <div className="grid gap-3 md:grid-cols-2">
            <input name="name" defaultValue={channel?.name ?? "广州E邮宝（DGEUB）"} placeholder={t("forms.channelNamePlaceholder")} className="admin-input" required />
            <input name="code" defaultValue={channel?.code ?? "DGEUB"} placeholder={t("forms.codePlaceholder")} className="admin-input" required />
          </div>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            {t("forms.supportedCountries")}
            <CountrySelect name="supportedCountries" multiple defaultValues={countryValues} className="h-40 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <input name="supportedCategories" defaultValue={channel ? textList(channel.supportedCategories) : "general, fashion, accessories"} placeholder={t("forms.supportedCategoriesPlaceholder")} className="admin-input" />
            <input name="forbiddenCategories" defaultValue={channel ? textList(channel.forbiddenCategories) : "battery, liquid, powder, brand, food, medicine"} placeholder={t("forms.forbiddenCategoriesPlaceholder")} className="admin-input" />
          </div>
          <input name="calculationRule" defaultValue={channel?.calculationRule ?? "chargeable_weight * freight_rmb_per_kg + handling_fee_rmb"} placeholder={t("forms.calculationRulePlaceholder")} className="admin-input" />
          <input name="trackingUrl" defaultValue={channel?.trackingUrl ?? "https://www.17track.net/zh-cn"} placeholder={t("forms.trackingUrlPlaceholder")} className="admin-input" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <input name="firstWeightKg" type="number" step="0.001" defaultValue={channel?.firstWeightKg.toString() ?? "0.001"} className="admin-input" />
            <input name="firstWeightFeeUsd" type="number" step="0.01" defaultValue={channel?.firstWeightFeeUsd.toString() ?? "0"} className="admin-input" />
            <input name="additionalWeightKg" type="number" step="0.001" defaultValue={channel?.additionalWeightKg.toString() ?? "1"} className="admin-input" />
            <input name="additionalWeightFeeUsd" type="number" step="0.01" defaultValue={channel?.additionalWeightFeeUsd.toString() ?? "0"} className="admin-input" />
            <input name="volumeDivisor" type="number" defaultValue={channel?.volumeDivisor ?? 5000} className="admin-input" />
            <input name="minWeightKg" type="number" step="0.001" defaultValue={channel?.minWeightKg.toString() ?? "0.001"} className="admin-input" />
            <input name="deliveryTimeMin" type="number" defaultValue={channel?.deliveryTimeMin ?? 7} className="admin-input" />
            <input name="deliveryTimeMax" type="number" defaultValue={channel?.deliveryTimeMax ?? 18} className="admin-input" />
          </div>
          <HtmlEditor name="notesHtml" defaultValue={channel?.notesHtml ?? dgeubNotesHtml} minHeight={180} />
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <input type="checkbox" name="isActive" defaultChecked={channel?.isActive ?? true} />
            {t("forms.activeChannel")}
          </label>
        </AdminSaveForm>

        <div className="grid h-fit gap-4">
          {channel ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900">{t("rates.title")}</h3>
                  <p className="text-sm text-slate-500">{t("rates.description", { count: channel.rates.length })}</p>
                </div>
                <Link href={`#rate-new-${channel.id}`} className="admin-action">{t("rates.addRate")}</Link>
              </div>
              <AdminDataPageTable
                columns={[
                  { key: "country", label: t("rates.columns.country") },
                  { key: "code", label: t("rates.columns.code") },
                  { key: "rmbPerKg", label: t("rates.columns.rmbPerKg") },
                  { key: "fee", label: t("rates.columns.fee") },
                  { key: "start", label: t("rates.columns.start") },
                  { key: "limit", label: t("rates.columns.limit") },
                  { key: "actions", label: t("rates.columns.actions") }
                ]}
                rows={rateTableRows}
                searchPlaceholder={t("rates.search")}
                showRowActions={false}
                enableRowSelection={false}
                initialPageSize={8}
              />
            </>
          ) : (
            <div className="rounded-2xl border border-[#465fff]/20 bg-[#eef4ff] p-5 text-sm leading-6 text-slate-700">
              {t("rates.emptyState", { count: dgeubSupportedCountries.length })}
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

type RateRow = ChannelRow["rates"][number];

async function RateForm({ channelId, rate }: { channelId: number; rate?: RateRow }) {
  const t = await getTranslations("shipping.page");
  return (
    <div className="grid gap-3">
      <AdminSaveForm action={upsertShippingRate} className="grid gap-3" submitLabel={t("rateForm.save")}>
        <input type="hidden" name="id" value={rate?.id ?? ""} />
        <input type="hidden" name="channelId" value={channelId} />
        <input name="countryName" defaultValue={rate?.countryName ?? ""} placeholder={t("rateForm.countryNamePlaceholder")} className="admin-input" required />
        <input name="countryCode" defaultValue={rate?.countryCode ?? ""} placeholder={t("rateForm.countryCodePlaceholder")} className="admin-input" required />
        <div className="grid grid-cols-2 gap-3">
          <input name="freightRmbPerKg" type="number" step="0.01" defaultValue={rate?.freightRmbPerKg.toString() ?? ""} placeholder={t("rateForm.freightPlaceholder")} className="admin-input" required />
          <input name="handlingFeeRmb" type="number" step="0.01" defaultValue={rate?.handlingFeeRmb.toString() ?? ""} placeholder={t("rateForm.handlingPlaceholder")} className="admin-input" required />
          <input name="startWeightKg" type="number" step="0.001" defaultValue={rate?.startWeightKg.toString() ?? "0.001"} placeholder={t("rateForm.startPlaceholder")} className="admin-input" />
          <input name="maxWeightKg" type="number" step="0.001" defaultValue={rate?.maxWeightKg.toString() ?? "2"} placeholder={t("rateForm.maxPlaceholder")} className="admin-input" />
        </div>
      </AdminSaveForm>
      {rate ? (
        <form action={deleteShippingRate}>
          <input type="hidden" name="id" value={rate.id} />
          <button className="admin-danger px-5 py-2.5">{t("rateForm.delete")}</button>
        </form>
      ) : null}
    </div>
  );
}
