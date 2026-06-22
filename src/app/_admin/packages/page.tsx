import { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { ExportButton } from "@/components/admin/ExportButton";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { StatusPill } from "@/components/ui/StatusPill";
import { countryName } from "@/lib/countries";
import { packageStatuses, statusLabel } from "@/lib/constants";
import { money } from "@/lib/currency";
import { prisma } from "@/lib/db";
import { updatePackageStatus } from "../actions";

type PackagesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const packageWithRelationsInclude = {
  user: true,
  order: { include: { address: true } },
  shippingChannel: true,
  items: true
} satisfies Prisma.PackageInclude;

type PackageWithRelations = Prisma.PackageGetPayload<{
  include: typeof packageWithRelationsInclude;
}>;

export default async function AdminPackagesPage({ searchParams }: PackagesPageProps) {
  const t = await getTranslations("packages");
  const commonT = await getTranslations("common.statuses");
  const params = await searchParams;
  const where = buildPackageWhere(params);
  const [packages, shippingChannels] = await Promise.all([
    prisma.package.findMany({
      where,
      include: packageWithRelationsInclude,
      orderBy: { createdAt: "desc" }
    }),
    prisma.shippingChannel.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }]
    })
  ]);
  const exportRows = packages.map((pkg) => {
    const payment = pkg.order?.shippingPaymentStatus ?? (pkg.status === "waiting_shipping_payment" ? "pending" : pkg.status === "shipping_paid" || pkg.status === "shipped" || pkg.status === "delivered" ? "paid" : "-");
    const country = pkg.order?.address?.country ? countryName(pkg.order.address.country) : "-";
    return {
      packageNo: pkg.packageNo,
      orderNo: pkg.order?.orderNo ?? "",
      userEmail: pkg.user.email,
      status: translateStatus(commonT, pkg.status),
      shippingChannel: pkg.shippingChannel?.name ?? t("table.noChannel"),
      weightKg: pkg.weightKg.toString(),
      chargeableWeightKg: chargeableWeight(pkg),
      destinationCountry: country,
      shippingFeeUsd: Number(pkg.shippingFeeUsd).toFixed(2),
      shippingPaymentStatus: payment === "-" ? "-" : translateStatus(commonT, payment),
      latestTrackingStatus: latestTrackingLabel(pkg, t, commonT),
      trackingNumber: pkg.trackingNumber ?? "",
      createdAt: pkg.createdAt.toLocaleString()
    };
  });
  const tableRows: AdminDataTableRow[] = packages.map((pkg) => {
    const payment = pkg.order?.shippingPaymentStatus ?? (pkg.status === "waiting_shipping_payment" ? "pending" : pkg.status === "shipping_paid" || pkg.status === "shipped" || pkg.status === "delivered" ? "paid" : "-");
    const country = pkg.order?.address?.country ? countryName(pkg.order.address.country) : "-";
    return {
      id: String(pkg.id),
      actionHref: `#package-${pkg.id}`,
      cells: {
        package: (
          <div>
            <div className="font-bold text-slate-900">{pkg.packageNo}</div>
            <div className="text-xs text-slate-400">{pkg.order?.orderNo ?? t("table.noOrder")}</div>
          </div>
        ),
        user: pkg.user.email,
        status: <StatusPill status={pkg.status} />,
        channel: (
          <div>
            <div className="font-bold text-slate-900">{internationalLogisticsLabel(pkg, t)}</div>
            <div className="text-xs text-slate-400">{paidFreightLabel(pkg, t)}</div>
          </div>
        ),
        weight: `${pkg.weightKg.toString()} kg`,
        chargeable: `${chargeableWeight(pkg)} kg`,
        country,
        fee: <span className="font-bold text-slate-900">{money(Number(pkg.shippingFeeUsd))}</span>,
        payment: payment === "-" ? "-" : translateStatus(commonT, payment),
        tracking: (
          <div>
            <div className="block max-w-[180px] truncate font-semibold text-slate-900">{pkg.trackingNumber || "-"}</div>
            <div className="text-xs text-slate-400">{latestTrackingLabel(pkg, t, commonT)}</div>
          </div>
        )
      },
      searchValues: {
        package: [pkg.packageNo, pkg.order?.orderNo].filter(Boolean).join(" "),
        user: pkg.user.email,
        status: pkg.status,
        channel: [pkg.shippingChannel?.name ?? "", internationalLogisticsLabel(pkg, t)].filter(Boolean).join(" "),
        weight: pkg.weightKg.toString(),
        chargeable: chargeableWeight(pkg),
        country,
        fee: pkg.shippingFeeUsd.toString(),
        payment: payment === "-" ? "" : translateStatus(commonT, payment),
        tracking: [pkg.trackingNumber ?? "", latestTrackingLabel(pkg, t, commonT)].filter(Boolean).join(" ")
      }
    };
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("page.kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("page.title")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-semibold text-slate-500">{t("page.records", { count: packages.length })}</div>
          <ExportButton
            data={exportRows}
            filename="packages-current-filter"
            label={t("page.export")}
            columns={[
              { key: "packageNo", header: t("exportColumns.packageNo") },
              { key: "orderNo", header: t("exportColumns.orderNo") },
              { key: "userEmail", header: t("exportColumns.userEmail") },
              { key: "status", header: t("exportColumns.status") },
              { key: "shippingChannel", header: t("exportColumns.shippingChannel") },
              { key: "weightKg", header: t("exportColumns.weightKg") },
              { key: "chargeableWeightKg", header: t("exportColumns.chargeableWeightKg") },
              { key: "destinationCountry", header: t("exportColumns.destinationCountry") },
              { key: "shippingFeeUsd", header: t("exportColumns.shippingFeeUsd") },
              { key: "shippingPaymentStatus", header: t("exportColumns.shippingPaymentStatus") },
              { key: "latestTrackingStatus", header: t("exportColumns.latestTrackingStatus") },
              { key: "trackingNumber", header: t("exportColumns.trackingNumber") },
              { key: "createdAt", header: t("exportColumns.createdAt") }
            ]}
          />
        </div>
      </div>

      <PackageFilters params={params} t={t} commonT={commonT} />

      <AdminDataPageTable
        columns={[
          { key: "package", label: t("table.package") },
          { key: "user", label: t("table.user") },
          { key: "status", label: t("table.status") },
          { key: "channel", label: t("table.channel") },
          { key: "weight", label: t("table.weight") },
          { key: "chargeable", label: t("table.chargeable") },
          { key: "country", label: t("table.country") },
          { key: "fee", label: t("table.fee") },
          { key: "payment", label: t("table.payment") },
          { key: "tracking", label: t("table.tracking") }
        ]}
        rows={tableRows}
        searchPlaceholder={t("table.search")}
      />

      {packages.map((pkg) => (
        <AdminModal key={pkg.id} id={`package-${pkg.id}`} title={pkg.packageNo} description={t("detailModal.description", { email: pkg.user.email, channel: pkg.shippingChannel?.name ?? t("table.noChannel") })} widthClass="max-w-5xl">
          <AdminSaveForm action={updatePackageStatus} className="grid gap-4" submitLabel={t("detailModal.submit")}>
            <input type="hidden" name="id" value={pkg.id} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.status")}
                <select name="status" defaultValue={pkg.status} className="admin-input">
                  {packageStatuses.map((status) => <option key={status} value={status}>{translateStatus(commonT, status)}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.shippingChannel")}
                <select name="shippingChannelId" defaultValue={pkg.shippingChannelId?.toString() ?? ""} className="admin-input">
                  <option value="">{t("detailModal.fields.shippingChannelPlaceholder")}</option>
                  {shippingChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.trackingNumber")}
                <input name="trackingNumber" defaultValue={pkg.trackingNumber ?? ""} placeholder={t("detailModal.fields.trackingPlaceholder")} className="admin-input" />
              </label>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm font-semibold leading-6 text-sky-900 md:col-span-2">
                <div className="text-[11px] font-black uppercase tracking-[0.1em] text-sky-700">{t("detailModal.dispatchNotice.eyebrow")}</div>
                <div className="mt-2">{t("detailModal.dispatchNotice.description")}</div>
                <div className="mt-3 grid gap-2 text-xs font-bold text-sky-800 md:grid-cols-3">
                  <div>{t("detailModal.dispatchNotice.needChannel")}</div>
                  <div>{t("detailModal.dispatchNotice.needTracking")}</div>
                  <div>{t("detailModal.dispatchNotice.readyState")}</div>
                </div>
              </div>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.weightKg")}
                <input name="weightKg" type="number" step="0.01" defaultValue={pkg.weightKg.toString()} className="admin-input" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.lengthCm")}
                <input name="lengthCm" type="number" step="0.1" defaultValue={pkg.lengthCm?.toString() ?? ""} className="admin-input" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.widthCm")}
                <input name="widthCm" type="number" step="0.1" defaultValue={pkg.widthCm?.toString() ?? ""} className="admin-input" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.heightCm")}
                <input name="heightCm" type="number" step="0.1" defaultValue={pkg.heightCm?.toString() ?? ""} className="admin-input" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                {t("detailModal.fields.shippingFeeUsd")}
                <input name="shippingFeeUsd" type="number" step="0.01" defaultValue={pkg.shippingFeeUsd.toString()} className="admin-input" />
              </label>
            </div>
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 md:grid-cols-3">
              <div><span className="font-bold text-slate-900">{t("detailModal.summary.dimensions")}</span><br />{pkg.lengthCm?.toString() ?? "-"} × {pkg.widthCm?.toString() ?? "-"} × {pkg.heightCm?.toString() ?? "-"} cm</div>
              <div><span className="font-bold text-slate-900">{t("detailModal.summary.volumeChargeable")}</span><br />{volumeWeight(pkg)} kg / {chargeableWeight(pkg)} kg</div>
              <div><span className="font-bold text-slate-900">{t("detailModal.summary.order")}</span><br />{pkg.order?.orderNo ?? t("table.noOrder")}</div>
              <div><span className="font-bold text-slate-900">{t("detailModal.summary.items")}</span><br />{t("detailModal.summary.pieces", { count: pkg.items.reduce((sum, item) => sum + item.quantity, 0) })}</div>
              <div><span className="font-bold text-slate-900">{t("detailModal.summary.internationalLogistics")}</span><br />{internationalLogisticsLabel(pkg, t)}</div>
              <div><span className="font-bold text-slate-900">{t("detailModal.summary.latestParcelStatus")}</span><br />{latestTrackingLabel(pkg, t, commonT)}</div>
              <div><span className="font-bold text-slate-900">{t("detailModal.summary.created")}</span><br />{pkg.createdAt.toLocaleString()}</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{t("detailModal.trackingOverview.eyebrow")}</div>
                  <h3 className="mt-1 text-sm font-black text-slate-900">{t("detailModal.trackingOverview.title")}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t("detailModal.trackingOverview.description")}
                  </p>
                </div>
                {trackingLink(pkg) ? (
                  <a
                    href={trackingLink(pkg) ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-action px-4 py-2"
                  >
                    {t("detailModal.trackingOverview.openCarrierTracking")}
                  </a>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <TrackingInfoCard label={t("detailModal.trackingCards.freightPayment")} value={paidFreightLabel(pkg, t)} />
                <TrackingInfoCard label={t("detailModal.trackingCards.channel")} value={internationalLogisticsLabel(pkg, t)} />
                <TrackingInfoCard label={t("detailModal.trackingCards.trackingNo")} value={pkg.trackingNumber || t("detailModal.trackingCards.notAssignedYet")} />
              </div>

              <div className="mt-4">
                <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{t("detailModal.timeline.eyebrow")}</div>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {buildPackageTimeline(pkg, t, commonT).map((step, index) => (
                    <div
                      key={`${pkg.id}-${step.label}`}
                      className={`rounded-xl border p-3 ${timelineTone(step.state)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[11px] font-black uppercase tracking-[0.08em] opacity-75">{t("detailModal.timeline.step", { index: index + 1 })}</div>
                        <span className="text-[11px] font-black uppercase tracking-[0.08em]">{timelineStatusLabel(step.state, t)}</span>
                      </div>
                      <div className="mt-2 text-sm font-black">{step.label}</div>
                      <div className="mt-2 text-xs leading-5 opacity-80">{step.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AdminSaveForm>
        </AdminModal>
      ))}
    </section>
  );
}

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildPackageWhere(params: Record<string, string | string[] | undefined>): Prisma.PackageWhereInput {
  const where: Prisma.PackageWhereInput = {};
  const status = readParam(params, "status");
  const shippingStatus = readParam(params, "shipping_status");
  const query = readParam(params, "q")?.trim();
  const country = readParam(params, "country")?.trim();

  if (status) where.status = status;
  if (shippingStatus === "ready_to_ship") where.status = "shipping_paid";
  if (query) {
    where.OR = [
      { packageNo: { contains: query } },
      { trackingNumber: { contains: query } },
      { user: { email: { contains: query } } },
      { order: { orderNo: { contains: query } } }
    ];
  }
  if (country) {
    where.order = { address: { country } };
  }
  return where;
}

function PackageFilters({
  params,
  t,
  commonT
}: {
  params: Record<string, string | string[] | undefined>;
  t: Awaited<ReturnType<typeof getTranslations<"packages">>>;
  commonT: TranslatorWithHas;
}) {
  return (
    <form action="/admin/packages" className="admin-card mb-4 grid gap-3 p-4 md:grid-cols-[1.5fr_1fr_1fr_auto]">
      <input name="q" defaultValue={readParam(params, "q") ?? ""} placeholder={t("filters.searchPlaceholder")} className="admin-input" />
      <select name="status" defaultValue={readParam(params, "status") ?? ""} className="admin-input">
        <option value="">{t("filters.statusPlaceholder")}</option>
        {packageStatuses.map((status) => <option key={status} value={status}>{translateStatus(commonT, status)}</option>)}
      </select>
      <input name="country" defaultValue={readParam(params, "country") ?? ""} placeholder={t("filters.countryPlaceholder")} className="admin-input" />
      <button className="admin-primary px-5">{t("filters.submit")}</button>
    </form>
  );
}

function volumeWeight(pkg: { lengthCm: unknown; widthCm: unknown; heightCm: unknown }) {
  const length = Number(pkg.lengthCm ?? 0);
  const width = Number(pkg.widthCm ?? 0);
  const height = Number(pkg.heightCm ?? 0);
  if (!length || !width || !height) return 0;
  return Math.round(((length * width * height) / 5000 + Number.EPSILON) * 100) / 100;
}

function chargeableWeight(pkg: { weightKg: unknown; lengthCm: unknown; widthCm: unknown; heightCm: unknown }) {
  return Math.max(Number(pkg.weightKg ?? 0), volumeWeight(pkg)).toFixed(2);
}

function isFreightPaid(pkg: PackageWithRelations) {
  return ["paid", "international_freight_paid"].includes(pkg.order?.shippingPaymentStatus ?? "") || ["shipping_paid", "shipped", "delivered"].includes(pkg.status);
}

function internationalLogisticsLabel(pkg: PackageWithRelations, t: Awaited<ReturnType<typeof getTranslations<"packages">>>) {
  if (isFreightPaid(pkg)) return pkg.shippingChannel?.name ?? t("labels.internationalLogisticsNotAssigned");
  return pkg.shippingChannel?.name ?? t("labels.awaitingFreightPayment");
}

function paidFreightLabel(pkg: PackageWithRelations, t: Awaited<ReturnType<typeof getTranslations<"packages">>>) {
  return isFreightPaid(pkg) ? t("labels.freightPaid") : t("labels.freightUnpaid");
}

function latestTrackingLabel(
  pkg: PackageWithRelations,
  t: Awaited<ReturnType<typeof getTranslations<"packages">>>,
  commonT: TranslatorWithHas
) {
  if (pkg.status === "delivered") return t("labels.delivered");
  if (pkg.status === "returned") return t("labels.returnedToSender");
  if (pkg.status === "cancelled") return t("labels.shipmentCancelled");
  if (pkg.status === "shipped" && pkg.order?.shippingStatus === "in_transit") return t("labels.inTransit");
  if (pkg.status === "shipped" && pkg.order?.shippingStatus === "customs_clearance") return t("labels.customsClearance");
  if (pkg.status === "shipped" && pkg.order?.shippingStatus === "delivery_attempted") return t("labels.deliveryAttempted");
  if (pkg.status === "shipped") return pkg.trackingNumber ? t("labels.trackingActive") : t("labels.handedToCarrier");
  if (pkg.status === "shipping_paid") return t("labels.readyForDispatch");
  if (pkg.status === "waiting_shipping_payment") return t("labels.waitingFreightPayment");
  if (pkg.status === "abnormal") return t("labels.trackingException");
  return translateStatus(commonT, pkg.status);
}

function trackingLink(pkg: PackageWithRelations) {
  if (!pkg.trackingNumber || !pkg.shippingChannel?.trackingUrl) return null;
  try {
    const url = new URL(pkg.shippingChannel.trackingUrl);
    if (url.hostname.includes("17track.net")) {
      const localePath = url.pathname.replace(/\/$/, "") || "/zh-cn";
      return `${url.origin}${localePath}/track?nums=${encodeURIComponent(pkg.trackingNumber)}`;
    }

    url.searchParams.set("trackingNumber", pkg.trackingNumber);
    return url.toString();
  } catch {
    return pkg.shippingChannel.trackingUrl;
  }
}

type TimelineStep = {
  label: string;
  detail: string;
  state: "done" | "current" | "pending" | "attention";
};

function buildPackageTimeline(
  pkg: PackageWithRelations,
  t: Awaited<ReturnType<typeof getTranslations<"packages">>>,
  commonT: TranslatorWithHas
): TimelineStep[] {
  const shipped = ["shipped", "delivered"].includes(pkg.status);
  const delivered = pkg.status === "delivered";
  const abnormal = pkg.status === "abnormal" || ["exception", "returned", "lost"].includes(pkg.order?.shippingStatus ?? "");

  return [
    {
      label: t("labels.packageCreated"),
      detail: pkg.createdAt.toLocaleString(),
      state: "done"
    },
    {
      label: t("labels.freightPaidStep"),
      detail: isFreightPaid(pkg)
        ? t("labels.freightPaidDetail", { channel: internationalLogisticsLabel(pkg, t) })
        : t("labels.waitingFreightPaymentDetail"),
      state: abnormal ? "attention" : isFreightPaid(pkg) ? "done" : ["created", "waiting_shipping_payment"].includes(pkg.status) ? "current" : "pending"
    },
    {
      label: t("labels.handedToCarrierStep"),
      detail: shipped
        ? `${pkg.shippedAt ? pkg.shippedAt.toLocaleString() : t("labels.shipmentConfirmed")}${pkg.trackingNumber ? ` · ${pkg.trackingNumber}` : ""}`
        : t("labels.notMarkedShippedYet"),
      state: abnormal ? "attention" : shipped ? "done" : pkg.status === "shipping_paid" ? "current" : "pending"
    },
    {
      label: t("labels.latestParcelStatusStep"),
      detail: delivered
        ? `${latestTrackingLabel(pkg, t, commonT)}${pkg.deliveredAt ? ` · ${pkg.deliveredAt.toLocaleString()}` : ""}`
        : `${latestTrackingLabel(pkg, t, commonT)}${pkg.trackingNumber ? ` · ${t("labels.trackingNoDetail", { trackingNumber: pkg.trackingNumber })}` : ""}`,
      state: abnormal ? "attention" : delivered ? "done" : shipped ? "current" : "pending"
    }
  ];
}

function timelineTone(state: TimelineStep["state"]) {
  if (state === "done") return "border-emerald-200 bg-emerald-50/80 text-emerald-900";
  if (state === "current") return "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";
  if (state === "attention") return "border-amber-200 bg-amber-50/80 text-amber-900";
  return "border-slate-200 bg-slate-50/80 text-slate-700";
}

function timelineStatusLabel(state: TimelineStep["state"], t: Awaited<ReturnType<typeof getTranslations<"packages">>>) {
  if (state === "done") return t("detailModal.timeline.done");
  if (state === "current") return t("detailModal.timeline.current");
  if (state === "attention") return t("detailModal.timeline.attention");
  return t("detailModal.timeline.pending");
}

function TrackingInfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">{label}</div>
      <div className="mt-2 text-sm font-black text-slate-900">{value}</div>
    </div>
  );
}

type TranslatorWithHas = {
  (key: string, values?: Record<string, string | number | Date>): string;
  has: (key: string) => boolean;
};

function translateStatus(t: TranslatorWithHas, status?: string | null) {
  const value = status || "none";
  return t.has(value) ? t(value) : statusLabel[value] ?? value.replaceAll("_", " ");
}
