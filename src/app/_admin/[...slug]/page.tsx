import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { HtmlEditor } from "@/components/admin/HtmlEditor";
import { StatusPill } from "@/components/ui/StatusPill";
import { Can } from "@/components/admin/Can";
import { AdminModal } from "@/components/admin/AdminModal";
import { AdminSaveForm } from "@/components/admin/AdminSaveForm";
import { ExportButton } from "@/components/admin/ExportButton";
import { ImportCsvDialog, type CsvImportField } from "@/components/admin/import/ImportCsvDialog";
import { MediaLibraryManager } from "@/components/admin/MediaLibraryPicker";
import { AdminDataPage } from "@/components/admin/modules/AdminDataPage";
import { AdminDataPageTable, type AdminDataTableRow } from "@/components/admin/modules/AdminDataPageTable";
import { OrderQcPhotoPanel } from "@/components/admin/OrderQcPhotoPanel";
import { AdminFaqSortableList } from "@/components/admin/sortable/AdminFaqSortableList";
import { ShippingCalculator } from "@/components/shipping/ShippingCalculator";
import { countryName, countryOptions } from "@/lib/countries";
import { money } from "@/lib/currency";
import { adminRoleFilterValues, rolePermissions } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { serializeMediaAsset } from "@/lib/media-assets";
import { defaultEnabledCurrencies, formatBeijingTime, getLatestExchangeRateSnapshot, parseCurrencyList } from "@/lib/exchange-rates";
import { getSensitiveKeywords } from "@/lib/risk-control";
import { getOnlyPaySettings, onlyPayReady } from "@/modules/payment/onlypay";
import { getPayPalSettings, paypalClientId, paypalProvider, paypalReady } from "@/modules/payment/paypal";
import { getSepaSettings, sepaProvider, sepaReady } from "@/modules/payment/sepa";
import {
  addWalletAdjustment,
  clearApiLogs,
  clearOperationLogs,
  confirmWalletRechargePayment,
  deleteSensitiveKeywordAction,
  deleteValueAddedService,
  importStorefrontProductsCsvAction,
  importStorefrontProductAction,
  importSensitiveKeywordsAction,
  importShippingRateRules,
  refreshExchangeRatesAction,
  refundPayPalPaymentAction,
  updateApiLogRetention,
  updateOperationLogRetention,
  updateSettingsBatch,
  updateStorefrontProductAction,
  upsertValueAddedService
} from "../actions";
import AdminHelpPage from "../help/page";
import AdminShippingPage from "../shipping/page";

type CatchAllAdminPageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type SettingDefinition = {
  key: string;
  defaultValue: string;
  label: string;
  description: string;
  persistLabel?: string;
  persistDescription?: string;
  secret?: boolean;
  options?: string[];
  html?: boolean;
};

async function getLogRetentionDays(key: "operation_log_retention_days" | "api_log_retention_days") {
  const setting = await prisma.setting.findUnique({ where: { key } }).catch(() => null);
  const days = Number(setting?.value || 7);
  return Number.isFinite(days) && days > 0 ? days : 7;
}

export default async function CatchAllAdminPage({ params, searchParams }: CatchAllAdminPageProps) {
  const settingsT = await getTranslations("settings");
  const financePagesT = await getTranslations("finance.pages");
  const route = (await params).slug.join("/");
  const resolvedSearchParams = searchParams ? await searchParams : {};

  if (route === "order-logs") return <OrderLogsPage />;
  if (route === "warehouse/inbound") return <WarehouseInboundPage />;
  if (route === "packages/shipping-records") return <ShippingRecordsPage />;
  if (route === "products/cache") return <ProductCachePage />;
  if (route === "products/library") return <StorefrontProductLibraryPage />;
  if (route === "products/import") return <StorefrontProductImportPage />;
  if (route === "products/categories") return <ProductCategoriesPage />;
  if (route === "products/value-added-services") return <ValueAddedServicesPage />;
  if (route === "products/api-logs") return <ApiLogsPage />;
  if (route === "users/addresses") return <UserAddressesPage />;
  if (route === "users/tags") return <UserTagsPage />;
  if (route === "users/risk") return <RiskUsersPage />;
  if (route === "finance/payments") return <PaymentsPage />;
  if (route === "finance/wallet-transactions") return <WalletTransactionsPage />;
  if (route === "finance/recharges") return <FinanceTransactionsPage type="recharge" variant="recharge" />;
  if (route === "finance/refunds") return <FinanceTransactionsPage type="refund" variant="refund" />;
  if (route === "finance/exchange-rate") return <SettingsModulePage title={financePagesT("exchangeRate.title")} kicker={financePagesT("exchangeRate.kicker")} definitions={getCurrencySettingDefinitions(settingsT).filter((item) => item.key.includes("exchange_rate") || item.key.includes("default_currency"))} permission="settings.manage" />;
  if (route === "finance/service-fees") return <SettingsModulePage title={financePagesT("serviceFees.title")} kicker={financePagesT("serviceFees.kicker")} definitions={getServiceFeeSettingDefinitions(settingsT)} permission="settings.manage" />;
  if (route === "shipping/channels") return <AdminShippingPage />;
  if (route === "shipping/countries") return <ShippingCountriesPage />;
  if (route === "shipping/rate-rules") return <ShippingRateRulesPage />;
  if (route === "shipping/restrictions") return <ShippingRestrictionsPage />;
  if (route === "shipping/calculator") return <AdminShippingCalculatorPage />;
  if (route === "marketing/affiliate") return <MarketingOverviewPage />;
  if (route === "marketing/affiliate-users") return <AffiliateUsersPage />;
  if (route === "marketing/commissions") return <CommissionRecordsPage />;
  if (route === "marketing/affiliate-settings") return <SettingsModulePage title={settingsT("modules.affiliateSettings")} kicker={settingsT("modules.marketingKicker")} definitions={affiliateSettingDefinitions} permission="affiliate.manage" />;
  if (route === "content/media-library") return <MediaLibraryPage />;
  if (route === "content/help-articles") return <AdminHelpPage />;
  if (route === "content/faq") return <ContentFaqPage />;
  if (route === "content/announcements") return <AnnouncementsPage />;
  if (route === "content/email-templates") return <EmailTemplatesPage />;
  if (route === "settings/general") return <SettingsModulePage title={settingsT("modules.generalSettings")} kicker={settingsT("modules.systemKicker")} definitions={getGeneralSettingDefinitions(settingsT)} />;
  if (route === "settings/api") return <SettingsModulePage title={settingsT("modules.apiSettings")} kicker={settingsT("modules.systemKicker")} definitions={getApiSettingDefinitions(settingsT)} />;
  if (route === "settings/smtp") return <SettingsModulePage title={settingsT("modules.smtpSettings")} kicker={settingsT("modules.systemKicker")} definitions={getSmtpSettingDefinitions(settingsT)} />;
  if (route === "settings/languages") redirect("/admin/settings/general");
  if (route === "settings/currencies") return <CurrencySettingsPage />;
  if (route === "settings/sensitive-keywords") return <SensitiveKeywordsPage />;
  if (route === "settings/admin-users") return <AdminUsersSettingsPage />;
  if (route === "settings/roles") return <RolesPermissionsPage />;
  if (route === "settings/operation-logs") return <OperationLogsPage searchParams={resolvedSearchParams} />;

  return (
    <AdminDataPage
      kicker={settingsT("modules.adminModuleKicker")}
      title={settingsT("modules.notConfiguredTitle")}
      description={settingsT("modules.notConfiguredDescription", { route })}
      columns={[{ key: "path", label: settingsT("modules.path") }, { key: "status", label: settingsT("modules.status") }]}
      rows={[{ id: "route", cells: { path: `/admin/${route}`, status: <StatusPill status="pending" /> } }]}
      actions={<Link href="/admin" className="admin-action px-4 py-2">{settingsT("modules.backToDashboard")}</Link>}
    />
  );
}

async function MediaLibraryPage() {
  const t = await getTranslations("legacy-admin.mediaLibrary");
  const assets = await prisma.mediaAsset.findMany({
    include: { uploader: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 120
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
        </div>
        <Link href="/admin/content/help-articles" className="admin-action px-4 py-2">{t("contentEditor")}</Link>
      </div>
      <MediaLibraryManager initialAssets={assets.map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        originalName: asset.originalName,
        url: asset.url,
        mimeType: asset.mimeType,
        size: asset.size,
        altText: asset.altText,
        caption: asset.caption,
        usage: asset.usage,
        orderId: asset.orderId,
        packageId: asset.packageId,
        createdAt: asset.createdAt.toISOString(),
        uploader: asset.uploader
      }))} />
    </section>
  );
}

async function OrderLogsPage() {
  const t = await getTranslations("legacy-admin.orderLogs");
  const retentionDays = await getLogRetentionDays("operation_log_retention_days");
  const now = new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  await prisma.operationLog.deleteMany({
    where: {
      createdAt: { lt: cutoff }
    }
  });
  const logs = await prisma.operationLog.findMany({
    include: { actor: true, order: true },
    orderBy: { createdAt: "desc" },
    take: 80
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>
        <LogToolbar
          retentionDays={retentionDays}
          retentionAction={updateOperationLogRetention}
          clearAction={clearOperationLogs}
          clearConfirmation="Clear all order logs? This cannot be undone."
          labels={{
            retention: t("toolbar.retention"),
            days: t("toolbar.days"),
            apply: t("toolbar.apply"),
            save: t("toolbar.saveRetention"),
            clear: t("toolbar.clearAllLogs")
          }}
        />
      </div>

      <AdminDataPageTable
        columns={[
          { key: "time", label: t("columns.time") },
          { key: "order", label: t("columns.order") },
          { key: "actor", label: t("columns.actor") },
          { key: "type", label: t("columns.type") },
          { key: "detail", label: t("columns.detail"), className: "max-w-[420px] truncate" },
          { key: "notify", label: t("columns.notify") }
        ]}
        rows={logs.map((log) => ({
          id: String(log.id),
          cells: {
            time: formatDate(log.createdAt),
            order: log.order?.orderNo ?? "-",
            actor: log.actor?.email ?? t("values.system"),
            type: <StatusPill status={log.action} />,
            detail: log.detail ?? "-",
            notify: t("values.no")
          },
          searchValues: {
            time: formatDateTime(log.createdAt),
            order: log.order?.orderNo ?? "",
            actor: log.actor?.email ?? t("values.system"),
            type: log.action,
            detail: log.detail ?? "",
            notify: t("values.no")
          }
        }))}
        searchPlaceholder={t("searchPlaceholder")}
      />
    </section>
  );
}

async function WarehouseInboundPage() {
  const t = await getTranslations("legacy-admin.warehouseInbound");
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { purchaseStatus: "purchased", warehouseStatus: { not: "received" } },
        { warehouseStatus: "pending", paymentStatus: "paid" },
        { warehouseStatus: "partial_received" }
      ]
    },
    include: {
      user: true,
      items: true,
      packages: { orderBy: { createdAt: "desc" }, take: 1 },
      mediaAssets: { where: { usage: "qc_photo" }, include: { uploader: { select: { id: true, email: true, name: true } } }, orderBy: { createdAt: "desc" } }
    },
    orderBy: { updatedAt: "desc" },
    take: 80
  });

  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: orders.length })}
      filters={[{ label: t("filtersLabel"), value: t("filtersValue") }]}
      columns={[
        { key: "order", label: t("columns.order") },
        { key: "user", label: t("columns.user") },
        { key: "items", label: t("columns.items") },
        { key: "purchase", label: t("columns.purchase") },
        { key: "warehouse", label: t("columns.warehouse") },
        { key: "qc", label: t("columns.qc") },
        { key: "updated", label: t("columns.updated") }
      ]}
      rows={orders.map((order) => ({
        id: String(order.id),
        cells: {
          order: order.orderNo,
          user: order.user.email,
          items: t("itemsSummary", { types: order.items.length, pcs: order.items.reduce((sum, item) => sum + item.quantity, 0) }),
          purchase: <StatusPill status={order.purchaseStatus} />,
          warehouse: <StatusPill status={order.warehouseStatus} />,
          qc: t("qcCount", { count: order.mediaAssets.length }),
          updated: formatDate(order.updatedAt)
        },
        detail: [
          [t("detail.order"), <Link key="order" href={`/admin/orders/${order.id}`} className="text-[#2563eb]">{order.orderNo}</Link>],
          [t("detail.user"), order.user.email],
          [t("detail.items"), t("itemsSummary", { types: order.items.length, pcs: order.items.reduce((sum, item) => sum + item.quantity, 0) })],
          [t("detail.purchase"), <StatusPill key="purchase" status={order.purchaseStatus} />],
          [t("detail.warehouse"), <StatusPill key="warehouse" status={order.warehouseStatus} />],
          [t("detail.qcUpload"), <OrderQcPhotoPanel key="qc" orderId={order.id} packageId={order.packages[0]?.id} initialAssets={order.mediaAssets.map(serializeMediaAsset)} compact />]
        ]
      }))}
    />
  );
}

async function ShippingRecordsPage() {
  const t = await getTranslations("legacy-admin.shippingRecords");
  const packages = await prisma.package.findMany({
    where: { OR: [{ status: "shipping_paid" }, { status: "shipped" }, { status: "delivered" }] },
    include: { user: true, order: true, shippingChannel: true },
    orderBy: { updatedAt: "desc" },
    take: 80
  });

  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: packages.length })}
      columns={[
        { key: "package", label: t("columns.package") },
        { key: "order", label: t("columns.order") },
        { key: "user", label: t("columns.user") },
        { key: "channel", label: t("columns.channel") },
        { key: "fee", label: t("columns.fee") },
        { key: "tracking", label: t("columns.tracking"), className: "max-w-[220px] truncate" },
        { key: "status", label: t("columns.status") }
      ]}
      rows={packages.map((pkg) => ({
        id: String(pkg.id),
        cells: {
          package: pkg.packageNo,
          order: pkg.order?.orderNo ?? "-",
          user: pkg.user.email,
          channel: pkg.shippingChannel?.name ?? "-",
          fee: money(Number(pkg.shippingFeeUsd)),
          tracking: pkg.trackingNumber || "-",
          status: <StatusPill status={pkg.status} />
        }
      }))}
    />
  );
}

async function ProductCachePage() {
  const t = await getTranslations("legacy-admin.productCache");
  const products = await prisma.productCache.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });

  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: products.length })}
      columns={[
        { key: "product", label: t("columns.product"), className: "min-w-[420px]" },
        { key: "platform", label: t("columns.platform") },
        { key: "price", label: t("columns.price") },
        { key: "shop", label: t("columns.shop") },
        { key: "expires", label: t("columns.expires") },
        { key: "updated", label: t("columns.updated") }
      ]}
      rows={products.map((product) => ({
        id: String(product.id),
        cells: {
          product: (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.mainImage} alt="" className="size-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <div>
                <div className="max-w-[420px] truncate font-bold text-slate-900">{product.title}</div>
                <div className="text-xs text-slate-400">{product.sourceItemId}</div>
              </div>
            </div>
          ),
          platform: product.platform,
          price: `${money(Number(product.priceUsd))} / CN ￥${Number(product.priceCny).toFixed(2)}`,
          shop: product.shopName ?? "-",
          expires: formatDate(product.cacheExpiredAt),
          updated: formatDate(product.updatedAt)
        },
        detail: [
          [t("detail.title"), product.title],
          [t("detail.sourceUrl"), <Link key="source" href={product.sourceUrl} target="_blank" className="text-[#465fff]">{product.sourceUrl}</Link>],
          [t("detail.platform"), product.platform],
          [t("detail.itemId"), product.sourceItemId],
          [t("detail.price"), `${money(Number(product.priceUsd))} / CN ￥${Number(product.priceCny).toFixed(2)}`],
          [t("detail.attributes"), jsonBrief(product.attributes)]
        ]
      }))}
    />
  );
}

async function StorefrontProductImportPage() {
  const t = await getTranslations("legacy-admin.productImport");
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_360px]">
      <div className="admin-card overflow-hidden rounded-[24px] border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="mt-1 text-3xl font-black text-slate-950">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>
        <AdminSaveForm action={importStorefrontProductAction} permission="products.view" className="p-6" submitLabel={t("submit")}>
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-900" htmlFor="storefront-source-input">
                {t("sourceLabel")}
              </label>
              <textarea
                id="storefront-source-input"
                name="sourceInput"
                rows={5}
                placeholder={t("sourcePlaceholder")}
                className="admin-input min-h-36 w-full"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {t("sourceHelp")}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <span className="mb-2 block text-sm font-black text-slate-900">{t("storefrontRank")}</span>
                <input name="storefrontRank" type="number" min="0" defaultValue="0" className="admin-input w-full bg-white" />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <input name="featureOnHomepage" type="checkbox" className="size-4" />
                {t("featureHomepage")}
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700 md:col-span-2">
                <input name="importAllPages" type="checkbox" className="size-4" />
                {t("importAllPages")}
              </label>
            </div>
          </div>
        </AdminSaveForm>

        <AdminSaveForm action={importStorefrontProductsCsvAction} permission="products.view" className="border-t border-slate-200 p-6" submitLabel={t("importCsv")}>
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-black text-slate-900" htmlFor="storefront-csv-input">
                {t("csvTitle")}
              </label>
              <textarea
                id="storefront-csv-input"
                name="csvText"
                rows={8}
                placeholder={t("csvPlaceholder")}
                className="admin-input min-h-48 w-full font-mono text-xs"
              />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {t("csvHelp")}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <span className="mb-2 block text-sm font-black text-slate-900">{t("defaultRankStart")}</span>
                <input name="storefrontRankStart" type="number" min="0" defaultValue="0" className="admin-input w-full bg-white" />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <input name="featureOnHomepage" type="checkbox" className="size-4" />
                {t("featureRowsHomepage")}
              </label>
            </div>
          </div>
        </AdminSaveForm>
      </div>

      <aside className="grid gap-4">
        <div className="admin-card rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="text-sm font-black text-slate-900">{t("notesTitle")}</div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>{t("notes.single")}</li>
            <li>{t("notes.shop")}</li>
            <li>{t("notes.csv")}</li>
            <li>{t("notes.active")}</li>
            <li>{t("notes.homepage")}</li>
          </ul>
        </div>
        <div className="admin-card rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="text-sm font-black text-slate-900">{t("workflowTitle")}</div>
          <ol className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <li>{t("workflow.step1")}</li>
            <li>{t("workflow.step2")}</li>
            <li>{t("workflow.step3")}</li>
          </ol>
        </div>
      </aside>
    </section>
  );
}

async function StorefrontProductLibraryPage() {
  const t = await getTranslations("legacy-admin.storefrontLibrary");
  const products = await prisma.productCache.findMany({
    where: {
      OR: [{ isStorefrontActive: true }, { importSource: { not: "manual" } }, { sourceShopId: { not: null } }]
    },
    orderBy: [{ storefrontRank: "asc" }, { updatedAt: "desc" }],
    take: 200
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/products/import" className="admin-primary px-4 py-2 text-sm">{t("importProducts")}</Link>
        </div>
      </div>

      <div className="grid gap-4">
        {products.length ? (
          products.map((product) => (
            <AdminSaveForm
              key={product.id}
              action={updateStorefrontProductAction}
              permission="products.view"
              submitLabel={t("saveProduct")}
              className="admin-card overflow-hidden rounded-[24px] border border-slate-200 bg-white"
            >
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid gap-5 p-5 lg:grid-cols-[120px_minmax(0,1fr)_340px]">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.mainImage} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-black uppercase text-[#d9142f]">{product.platform}</span>
                    {product.isStorefrontActive ? <StatusPill status="active" /> : <StatusPill status="disabled" />}
                    {product.isHomepageFeatured ? <span className="rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-black uppercase text-[#2563eb]">{t("homepageBadge")}</span> : null}
                  </div>
                  <div className="mt-3 text-lg font-black text-slate-950">{product.title}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-500">
                    {product.sourceShopName ?? product.shopName ?? t("unknownShop")} · CN ￥{Number(product.priceCny).toFixed(2)}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {product.sourceItemId} · {product.importSource}
                  </div>
                  <div className="mt-3">
                    <Link href={product.sourceUrl} target="_blank" className="text-sm font-bold text-[#2563eb]">
                      {t("openSourceUrl")}
                    </Link>
                  </div>
                </div>
                <div className="grid gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <input name="isStorefrontActive" type="checkbox" defaultChecked={product.isStorefrontActive} className="size-4" />
                    {t("publishCatalog")}
                  </label>
                  <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                    <input name="isHomepageFeatured" type="checkbox" defaultChecked={product.isHomepageFeatured} className="size-4" />
                    {t("showHomepage")}
                  </label>
                  <label className="text-sm font-semibold text-slate-700">
                    <span className="mb-2 block text-xs font-black uppercase text-slate-500">{t("storefrontRank")}</span>
                    <input name="storefrontRank" type="number" min="0" defaultValue={product.storefrontRank} className="admin-input w-full bg-white" />
                  </label>
                </div>
              </div>
            </AdminSaveForm>
          ))
        ) : (
          <div className="admin-card rounded-[24px] border border-dashed border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500">
            {t("empty")}
          </div>
        )}
      </div>
    </section>
  );
}

async function ProductCategoriesPage() {
  const t = await getTranslations("legacy-admin.productCategories");
  const products = await prisma.productCache.findMany({ select: { platform: true, attributes: true, title: true } });
  const map = new Map<string, { count: number; platforms: Set<string> }>();
  for (const product of products) {
    const category = readJsonField(product.attributes, "category") || "uncategorized";
    const entry = map.get(category) ?? { count: 0, platforms: new Set<string>() };
    entry.count += 1;
    entry.platforms.add(product.platform);
    map.set(category, entry);
  }
  const rows = Array.from(map.entries()).map(([category, value], index) => ({
    id: `${index}-${category}`,
    cells: {
      category: category === "uncategorized" ? t("values.uncategorized") : category,
      products: value.count,
      platforms: Array.from(value.platforms).join(", "),
      restrictions: category === "electronics" ? t("values.batteryReview") : t("values.standard"),
      status: <StatusPill status="active" />
    }
  }));

  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: rows.length })}
      actions={<span className="admin-primary px-4 py-2">{t("addCategory")}</span>}
      columns={[
        { key: "category", label: t("columns.category") },
        { key: "products", label: t("columns.products") },
        { key: "platforms", label: t("columns.platforms") },
        { key: "restrictions", label: t("columns.restrictions") },
        { key: "status", label: t("columns.status") }
      ]}
      rows={rows}
    />
  );
}

async function ValueAddedServicesPage() {
  const services = await prisma.valueAddedService.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }]
  });
  const activeCount = services.filter((service) => service.isActive).length;

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">Product center</div>
          <h1 className="admin-page-title mt-1">Value-added Services</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Configure checkout value-added services such as packaging, inspection, photo shooting, tag removal, and warehouse handling. Active services appear on the customer checkout page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">{activeCount}/{services.length} active</span>
          <Can permission="value_added_services.manage">
            <Link href="#value-added-service-new" className="admin-primary px-4 py-2">Add service</Link>
          </Can>
          <Link href="/checkout" target="_blank" className="admin-action px-4 py-2">Preview checkout</Link>
        </div>
      </div>

      <AdminDataPageTable
        columns={[
          { key: "service", label: "Service", className: "min-w-[340px]" },
          { key: "charge", label: "Charge" },
          { key: "mode", label: "Mode" },
          { key: "range", label: "Applicable Range", className: "max-w-[360px] truncate" },
          { key: "sort", label: "Sort" },
          { key: "status", label: "Status" },
          { key: "action", label: "Action" }
        ]}
        rows={services.map((service) => ({
          id: String(service.id),
          cells: {
            service: (
              <div>
                <div className="font-bold text-slate-900">{service.name}</div>
                <div className="mt-1 text-xs text-slate-400">{service.code} · {service.description}</div>
              </div>
            ),
            charge: (
              <div>
                <div className="font-black text-slate-900">{money(Number(service.priceUsd))}</div>
                <div className="mt-1 text-xs text-slate-400">{service.chargeStandard}</div>
              </div>
            ),
            mode: service.priceMode,
            range: service.applicableRange ?? "-",
            sort: service.sortOrder,
            status: <StatusPill status={service.isActive ? "active" : "inactive"} />,
            action: (
              <div className="flex flex-wrap gap-2">
                <Link href={`#value-added-service-${service.id}`} className="admin-action">Edit</Link>
              </div>
            )
          },
          searchValues: {
            service: `${service.name} ${service.code} ${service.description}`,
            charge: `${service.priceUsd.toString()} ${service.chargeStandard}`,
            mode: service.priceMode,
            range: service.applicableRange ?? "",
            sort: String(service.sortOrder),
            status: service.isActive ? "active" : "inactive",
            action: "edit"
          },
          actionHref: `#value-added-service-${service.id}`,
          actionLabel: "Edit"
        }))}
        searchPlaceholder="Search value-added services..."
        showRowActions={false}
      />

      <AdminModal
        id="value-added-service-new"
        title="Add Value-added Service"
        description="Create a service that can be selected by customers during checkout."
        widthClass="max-w-4xl"
      >
        <ValueAddedServiceForm service={null} nextSortOrder={services.length + 1} />
      </AdminModal>

      {services.map((service) => (
        <AdminModal
          key={service.id}
          id={`value-added-service-${service.id}`}
          title={`Edit ${service.name}`}
          description={`${service.code} appears on the checkout page when active.`}
          widthClass="max-w-4xl"
        >
          <ValueAddedServiceForm service={{
            id: service.id,
            code: service.code,
            name: service.name,
            description: service.description,
            applicableRange: service.applicableRange,
            chargeStandard: service.chargeStandard,
            priceUsd: Number(service.priceUsd),
            priceMode: service.priceMode,
            serviceTime: service.serviceTime,
            buyerNotice: service.buyerNotice,
            serviceGuarantee: service.serviceGuarantee,
            specialNote: service.specialNote,
            sortOrder: service.sortOrder,
            isActive: service.isActive
          }} />
        </AdminModal>
      ))}
    </section>
  );
}

type EditableValueAddedService = {
  id: number;
  code: string;
  name: string;
  description: string;
  applicableRange: string | null;
  chargeStandard: string;
  priceUsd: number;
  priceMode: string;
  serviceTime: string | null;
  buyerNotice: string | null;
  serviceGuarantee: string | null;
  specialNote: string | null;
  sortOrder: number;
  isActive: boolean;
};

function ValueAddedServiceForm({
  service,
  nextSortOrder = 1
}: {
  service: EditableValueAddedService | null;
  nextSortOrder?: number;
}) {
  return (
    <div className="grid gap-4">
      <AdminSaveForm
        action={upsertValueAddedService}
        permission="value_added_services.manage"
        submitLabel={service ? "Save service" : "Create service"}
        className="grid gap-4"
      >
        {service ? <input type="hidden" name="id" value={service.id} /> : null}
        <div className="grid gap-3 md:grid-cols-[140px_1fr_160px_150px]">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Code
            <input name="code" defaultValue={service?.code ?? `VAS-${String(nextSortOrder).padStart(2, "0")}`} className="admin-input" required />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Service name
            <input name="name" defaultValue={service?.name ?? ""} className="admin-input" placeholder="Detailed Inspection" required />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Price USD
            <input name="priceUsd" type="number" min="0" step="0.01" defaultValue={service?.priceUsd ?? 0} className="admin-input" required />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Sort order
            <input name="sortOrder" type="number" min="0" step="1" defaultValue={service?.sortOrder ?? nextSortOrder} className="admin-input" />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Charge standard
            <input name="chargeStandard" defaultValue={service?.chargeStandard ?? ""} className="admin-input" placeholder="US $0.88/item" required />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Price mode
            <select name="priceMode" defaultValue={service?.priceMode ?? "per_piece"} className="admin-input">
              <option value="per_piece">per_piece</option>
              <option value="per_item">per_item</option>
              <option value="per_photo">per_photo</option>
              <option value="per_split">per_split</option>
              <option value="base_plus_quote">base_plus_quote</option>
              <option value="custom_quote">custom_quote</option>
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Description
          <textarea name="description" defaultValue={service?.description ?? ""} className="admin-input min-h-24" required />
        </label>

        <label className="grid gap-1 text-xs font-bold text-slate-600">
          Applicable range
          <textarea name="applicableRange" defaultValue={service?.applicableRange ?? ""} className="admin-input min-h-20" />
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Service time
            <textarea name="serviceTime" defaultValue={service?.serviceTime ?? ""} className="admin-input min-h-28" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Buyer notice
            <textarea name="buyerNotice" defaultValue={service?.buyerNotice ?? ""} className="admin-input min-h-28" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Service guarantee
            <textarea name="serviceGuarantee" defaultValue={service?.serviceGuarantee ?? ""} className="admin-input min-h-28" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Special note
            <textarea name="specialNote" defaultValue={service?.specialNote ?? ""} className="admin-input min-h-28" />
          </label>
        </div>

        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
          <input name="isActive" type="checkbox" defaultChecked={service?.isActive ?? true} className="size-4 accent-[#2563eb]" />
          Active on checkout page
        </label>
      </AdminSaveForm>

      {service ? (
        <Can permission="value_added_services.manage">
          <form action={deleteValueAddedService} className="rounded-xl border border-red-200 bg-red-50 p-4">
            <input type="hidden" name="id" value={service.id} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-black text-red-700">Delete this service</div>
                <p className="mt-1 text-xs font-semibold leading-5 text-red-600">Deleting removes it from future checkouts. Existing order snapshots remain unchanged.</p>
              </div>
              <button className="admin-danger border-red-300 bg-white px-4 py-2">Delete</button>
            </div>
          </form>
        </Can>
      ) : null}
    </div>
  );
}

async function ApiLogsPage() {
  const t = await getTranslations("legacy-admin.apiLogs");
  const retentionDays = await getLogRetentionDays("api_log_retention_days");
  const now = new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  await prisma.apiLog.deleteMany({
    where: {
      createdAt: { lt: cutoff }
    }
  });
  const logs = await prisma.apiLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
        </div>
        <LogToolbar
          retentionDays={retentionDays}
          retentionAction={updateApiLogRetention}
          clearAction={clearApiLogs}
          clearConfirmation={t("clearConfirmation")}
          labels={{
            retention: t("toolbar.retention"),
            days: t("toolbar.days"),
            apply: t("toolbar.apply"),
            save: t("toolbar.saveRetention"),
            clear: t("toolbar.clearAllLogs")
          }}
        />
      </div>

      <AdminDataPageTable
        columns={[
          { key: "time", label: t("columns.time") },
          { key: "provider", label: t("columns.provider") },
          { key: "endpoint", label: t("columns.endpoint") },
          { key: "status", label: t("columns.status") },
          { key: "latency", label: t("columns.latency") },
          { key: "error", label: t("columns.error"), className: "max-w-[360px] truncate" }
        ]}
        rows={logs.map((log) => ({
          id: String(log.id),
          cells: {
            time: formatDateTime(log.createdAt),
            provider: log.provider,
            endpoint: log.endpoint,
            status: <StatusPill status={log.status} />,
            latency: `${log.latencyMs}ms`,
            error: log.error ?? "-"
          },
          searchValues: {
            time: formatDateTime(log.createdAt),
            provider: log.provider,
            endpoint: log.endpoint,
            status: log.status,
            latency: String(log.latencyMs),
            error: log.error ?? ""
          }
        }))}
        searchPlaceholder={t("searchPlaceholder")}
      />
    </section>
  );
}

function LogToolbar({
  retentionDays,
  retentionAction,
  clearAction,
  clearConfirmation,
  labels
}: {
  retentionDays: number;
  retentionAction: (formData: FormData) => Promise<void | { message?: string }>;
  clearAction: (formData: FormData) => Promise<void | { message?: string }>;
  clearConfirmation: string;
  labels?: {
    retention: string;
    days: string;
    apply: string;
    save: string;
    clear: string;
  };
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <span className="text-xs font-semibold text-slate-500">{labels?.retention ?? "Retention"}</span>
      <AdminSaveForm action={retentionAction} className="contents" submitLabel={labels?.save ?? "Save retention"} hideFooter>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-2 py-1.5">
          <input name="days" type="number" min="1" defaultValue={retentionDays} className="admin-input h-8 w-16 border-0 bg-white px-2 text-center" />
          <span className="text-xs font-semibold text-slate-500">{labels?.days ?? "days"}</span>
          <button className="admin-action px-3 py-1.5 text-xs">{labels?.apply ?? "Apply"}</button>
        </div>
      </AdminSaveForm>
      <AdminSaveForm action={clearAction} className="contents" submitLabel={labels?.clear ?? "Clear all logs"} confirmationText={clearConfirmation} hideFooter>
        <button className="inline-flex items-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100">
          {labels?.clear ?? "Clear all logs"}
        </button>
      </AdminSaveForm>
    </div>
  );
}

async function UserAddressesPage() {
  const t = await getTranslations("users.adminModules.addresses");
  const addresses = await prisma.address.findMany({ include: { user: true }, orderBy: { updatedAt: "desc" }, take: 100 });
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: addresses.length })}
      columns={[
        { key: "user", label: t("columns.user") },
        { key: "contact", label: t("columns.contact") },
        { key: "country", label: t("columns.country") },
        { key: "city", label: t("columns.city") },
        { key: "address", label: t("columns.address"), className: "max-w-[420px] truncate" },
        { key: "default", label: t("columns.default") }
      ]}
      rows={addresses.map((address) => ({
        id: String(address.id),
        cells: {
          user: address.user.email,
          contact: `${address.contactName} · ${address.phone}`,
          country: countryName(address.country),
          city: [address.state, address.city, address.postalCode].filter(Boolean).join(" / "),
          address: [address.line1, address.line2].filter(Boolean).join(", "),
          default: address.isDefault ? t("values.yes") : t("values.no")
        }
      }))}
    />
  );
}

async function UserTagsPage() {
  const t = await getTranslations("users.adminModules.tags");
  const users = await prisma.user.findMany({ include: { orders: true }, orderBy: { createdAt: "desc" } });
  const tagRows = [
    {
      id: "vip",
      cells: { tag: t("rows.vip.tag"), rule: t("rows.vip.rule"), users: users.filter((user) => Number(user.walletBalance) > 100).length, status: <StatusPill status="active" /> }
    },
    {
      id: "new",
      cells: { tag: t("rows.new.tag"), rule: t("rows.new.rule"), users: users.filter((user) => !user.orders.length).length, status: <StatusPill status="active" /> }
    },
    {
      id: "risk-review",
      cells: { tag: t("rows.riskReview.tag"), rule: t("rows.riskReview.rule"), users: users.filter((user) => user.status !== "active").length, status: <StatusPill status="active" /> }
    }
  ];
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: tagRows.length })}
      actions={<span className="admin-primary px-4 py-2">{t("addTag")}</span>}
      columns={[
        { key: "tag", label: t("columns.tag") },
        { key: "rule", label: t("columns.rule") },
        { key: "users", label: t("columns.users") },
        { key: "status", label: t("columns.status") }
      ]}
      rows={tagRows}
    />
  );
}

async function RiskUsersPage() {
  const t = await getTranslations("users.adminModules.risk");
  const users = await prisma.user.findMany({
    where: { OR: [{ status: { not: "active" } }, { orders: { some: { riskStatus: { not: "normal" } } } }] },
    include: { orders: { orderBy: { updatedAt: "desc" }, take: 5 } },
    orderBy: { updatedAt: "desc" },
    take: 80
  });
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: users.length })}
      columns={[
        { key: "user", label: t("columns.user") },
        { key: "status", label: t("columns.status") },
        { key: "risk", label: t("columns.risk") },
        { key: "wallet", label: t("columns.wallet") },
        { key: "updated", label: t("columns.updated") }
      ]}
      rows={users.map((user) => ({
        id: String(user.id),
        cells: {
          user: user.email,
          status: <StatusPill status={user.status} />,
          risk: user.orders.filter((order) => order.riskStatus !== "normal").length,
          wallet: money(Number(user.walletBalance)),
          updated: formatDate(user.updatedAt)
        }
      }))}
    />
  );
}

async function PaymentsPage() {
  const t = await getTranslations("finance.paymentsWorkbench");
  const commonT = await getTranslations("common.statuses");
  const [payments, onlyPaySettings, paypalSettings, sepaSettings] = await Promise.all([
    prisma.payment.findMany({
      include: { user: true, order: true, package: true },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    getOnlyPaySettings(),
    getPayPalSettings(),
    getSepaSettings()
  ]);
  const onlyPayPayments = payments.filter((payment) => payment.provider === "onlypay");
  const paypalPayments = payments.filter((payment) => payment.provider === paypalProvider);
  const sepaPayments = payments.filter((payment) => payment.provider === sepaProvider);
  const balancePayments = payments.filter((payment) =>
    payment.provider === "wallet"
    || payment.provider === "balance"
    || payment.paymentMethod === "wallet_balance"
    || ((payment.type === "pay_order" || payment.type === "pay_shipping") && !payment.paymentMethod)
  );
  const paidAmount = payments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const pendingCount = payments.filter((payment) => isPendingPayment(payment.status)).length;
  const paymentExportRows = payments.map((payment) => ({
    paymentNo: payment.paymentNo,
    providerOrderNo: payment.providerOrderNo ?? "",
    gatewayOrderNo: payment.gatewayOrderNo ?? "",
    userEmail: payment.user.email,
    orderNo: payment.order?.orderNo ?? "",
    packageNo: payment.package?.packageNo ?? "",
    type: payment.type,
    provider: payment.provider,
    status: payment.status,
    amount: `${payment.currency} ${Number(payment.amount).toFixed(2)}`,
    currency: payment.currency,
    paymentMethod: payment.paymentMethod ?? "",
    paidAt: payment.paidAt ? formatDateTime(payment.paidAt) : "",
    failedAt: payment.failedAt ? formatDateTime(payment.failedAt) : "",
    createdAt: formatDateTime(payment.createdAt)
  }));
  const gatewayRows = [
    {
      id: "gateway-onlypay",
      gateway: t("gatewayRows.onlypay.gateway"),
      provider: "onlypay",
      method: onlyPaySettings.title,
      status: gatewayStatus(onlyPayReady(onlyPaySettings), onlyPaySettings.enabled),
      mode: t("gatewayRows.onlypay.mode"),
      currency: t("gatewayRows.onlypay.currency"),
      records: onlyPayPayments.length,
      pending: onlyPayPayments.filter((payment) => isPendingPayment(payment.status)).length,
      summary: [
        [t("gatewayRows.onlypay.summary.merchantId"), maskSecret(onlyPaySettings.mchId)],
        [t("gatewayRows.onlypay.summary.applicationId"), maskSecret(onlyPaySettings.appId)],
        [t("gatewayRows.onlypay.summary.productId"), onlyPaySettings.productId || "-"],
        [t("gatewayRows.onlypay.summary.submitUrl"), onlyPaySettings.submitUrl],
        [t("gatewayRows.onlypay.summary.signatureKey"), onlyPaySettings.signKey ? t("common.configured") : t("common.missing")]
      ] as Array<[string, string]>,
      endpoints: [
        [t("gatewayRows.onlypay.endpoints.createOrder"), "POST /api/payments/onlypay/create"],
        [t("gatewayRows.onlypay.endpoints.notifyCallback"), "POST /api/payments/onlypay/notify"],
        [t("gatewayRows.onlypay.endpoints.returnUrl"), "GET /payment/onlypay/return"]
      ] as Array<[string, string]>,
      definitions: onlyPaySettingDefinitions,
      modalTitle: t("gatewayRows.onlypay.modalTitle"),
      modalDescription: t("gatewayRows.onlypay.modalDescription")
    },
    {
      id: "gateway-paypal",
      gateway: t("gatewayRows.paypal.gateway"),
      provider: paypalProvider,
      method: paypalSettings.title,
      status: gatewayStatus(paypalReady(paypalSettings), paypalSettings.enabled),
      mode: paypalSettings.mode,
      currency: paypalSettings.currency,
      records: paypalPayments.length,
      pending: paypalPayments.filter((payment) => isPendingPayment(payment.status)).length,
      summary: [
        [t("gatewayRows.paypal.summary.clientId"), maskSecret(paypalClientId(paypalSettings))],
        [t("gatewayRows.paypal.summary.clientSecret"), (paypalSettings.mode === "live" ? paypalSettings.liveClientSecret : paypalSettings.sandboxClientSecret) ? t("common.configured") : t("common.missing")],
        [t("gatewayRows.paypal.summary.advancedCards"), paypalSettings.advancedCardEnabled ? commonT("enabled") : commonT("disabled")],
        [t("gatewayRows.paypal.summary.brandName"), paypalSettings.brandName || "-"],
        [t("gatewayRows.paypal.summary.currency"), paypalSettings.currency],
        [t("gatewayRows.paypal.summary.webhookId"), paypalSettings.webhookId ? t("common.configured") : t("common.missing")]
      ] as Array<[string, string]>,
      endpoints: [
        [t("gatewayRows.paypal.endpoints.createOrder"), "POST /api/payments/paypal/create"],
        [t("gatewayRows.paypal.endpoints.captureOrder"), "POST /api/payments/paypal/capture"],
        [t("gatewayRows.paypal.endpoints.webhook"), "POST /api/payments/paypal/webhook"],
        [t("gatewayRows.paypal.endpoints.refund"), "POST /api/payments/paypal/refund"]
      ] as Array<[string, string]>,
      definitions: paypalSettingDefinitions,
      modalTitle: t("gatewayRows.paypal.modalTitle"),
      modalDescription: t("gatewayRows.paypal.modalDescription")
    },
    {
      id: "gateway-sepa",
      gateway: t("gatewayRows.sepa.gateway"),
      provider: sepaProvider,
      method: sepaSettings.title,
      status: gatewayStatus(sepaReady(sepaSettings), sepaSettings.enabled),
      mode: t("gatewayRows.sepa.mode"),
      currency: "EUR",
      records: sepaPayments.length,
      pending: sepaPayments.filter((payment) => isPendingPayment(payment.status)).length,
      summary: [
        [t("gatewayRows.sepa.summary.beneficiary"), sepaSettings.beneficiaryName || t("common.missing")],
        [t("gatewayRows.sepa.summary.iban"), maskSecret(sepaSettings.iban)],
        [t("gatewayRows.sepa.summary.bic"), sepaSettings.bic || t("common.missing")],
        [t("gatewayRows.sepa.summary.bank"), sepaSettings.bankName || "-"],
        [t("gatewayRows.sepa.summary.usdToEur"), String(sepaSettings.usdEurRate)]
      ] as Array<[string, string]>,
      endpoints: [
        [t("gatewayRows.sepa.endpoints.createConfirmation"), "POST /api/payments/sepa/create"],
        [t("gatewayRows.sepa.endpoints.eligibility"), t("gatewayRows.sepa.endpoints.eligibilityValue")]
      ] as Array<[string, string]>,
      definitions: sepaSettingDefinitions,
      modalTitle: t("gatewayRows.sepa.modalTitle"),
      modalDescription: t("gatewayRows.sepa.modalDescription")
    },
    {
      id: "gateway-balance",
      gateway: t("gatewayRows.balance.gateway"),
      provider: "wallet",
      method: t("gatewayRows.balance.method"),
      status: "ready" as const,
      mode: t("gatewayRows.balance.mode"),
      currency: "USD",
      records: balancePayments.length,
      pending: balancePayments.filter((payment) => isPendingPayment(payment.status)).length,
      summary: [
        [t("gatewayRows.balance.summary.fundingSource"), t("gatewayRows.balance.summary.fundingSourceValue")],
        [t("gatewayRows.balance.summary.usage"), t("gatewayRows.balance.summary.usageValue")],
        [t("gatewayRows.balance.summary.visibleLabel"), t("gatewayRows.balance.summary.visibleLabelValue")],
        [t("gatewayRows.balance.summary.settlement"), t("gatewayRows.balance.summary.settlementValue")]
      ] as Array<[string, string]>,
      endpoints: [
        [t("gatewayRows.balance.endpoints.wallet"), "/account/wallet"],
        [t("gatewayRows.balance.endpoints.recharge"), "/account/recharge"],
        [t("gatewayRows.balance.endpoints.affiliate"), t("gatewayRows.balance.endpoints.affiliateValue")]
      ] as Array<[string, string]>,
      definitions: [],
      modalTitle: t("gatewayRows.balance.modalTitle"),
      modalDescription: t("gatewayRows.balance.modalDescription")
    }
  ];
  const gatewayTableRows: AdminDataTableRow[] = gatewayRows.map((gateway) => ({
    id: gateway.id,
    cells: {
      gateway: (
        <div>
          <div className="font-bold text-slate-900">{gateway.gateway}</div>
          <div className="mt-1 text-xs text-slate-400">{gateway.method}</div>
        </div>
      ),
              status: <GatewayStatusBadge status={gateway.status} />,
              provider: <span className="font-black uppercase text-[#465fff]">{gateway.provider}</span>,
              mode: gateway.mode,
              currency: gateway.currency,
              records: gateway.records,
              pending: gateway.pending,
              action: gateway.definitions.length ? <Link href={`#${gateway.id}`} className="admin-action">{t("gatewayTable.edit")}</Link> : <span className="text-xs font-bold text-slate-400">{t("gatewayTable.builtIn")}</span>
            },
    searchValues: {
      gateway: `${gateway.gateway} ${gateway.method}`,
      status: gateway.status,
      provider: gateway.provider,
      mode: gateway.mode,
      currency: gateway.currency,
      records: String(gateway.records),
      pending: String(gateway.pending),
      action: ""
    }
  }));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <GatewayMetric label={t("metrics.total")} value={String(payments.length)} compact />
          <GatewayMetric label={t("metrics.pending")} value={String(pendingCount)} compact />
          <GatewayMetric label={t("metrics.paid")} value={money(paidAmount)} compact />
          <GatewayMetric label={t("metrics.gateways")} value={String(gatewayRows.length)} compact />
          <div className="col-span-2 sm:col-span-4">
            <ExportButton
              data={paymentExportRows}
              filename="payments-current-page"
              label={t("export.label")}
              columns={[
                { key: "paymentNo", header: t("export.paymentNo") },
                { key: "providerOrderNo", header: t("export.providerOrderNo") },
                { key: "gatewayOrderNo", header: t("export.gatewayOrderNo") },
                { key: "userEmail", header: t("export.userEmail") },
                { key: "orderNo", header: t("export.orderNo") },
                { key: "packageNo", header: t("export.packageNo") },
                { key: "type", header: t("export.type") },
                { key: "provider", header: t("export.provider") },
                { key: "status", header: t("export.status") },
                { key: "amount", header: t("export.amount") },
                { key: "paymentMethod", header: t("export.paymentMethod") },
                { key: "paidAt", header: t("export.paidAt") },
                { key: "failedAt", header: t("export.failedAt") },
                { key: "createdAt", header: t("export.createdAt") }
              ]}
            />
          </div>
        </div>
      </div>

      <AdminDataPageTable
        columns={[
          { key: "gateway", label: t("gatewayTable.gateway"), className: "min-w-[260px]" },
          { key: "status", label: t("gatewayTable.status") },
          { key: "provider", label: t("gatewayTable.provider") },
          { key: "mode", label: t("gatewayTable.mode") },
          { key: "currency", label: t("gatewayTable.currency") },
          { key: "records", label: t("gatewayTable.records") },
          { key: "pending", label: t("gatewayTable.pending") },
          { key: "action", label: t("gatewayTable.action") }
        ]}
        rows={gatewayTableRows}
        searchPlaceholder={t("gatewayTable.search")}
        showRowActions={false}
      />

      {gatewayRows.filter((gateway) => gateway.definitions.length).map((gateway) => (
        <AdminModal key={gateway.id} id={gateway.id} title={gateway.modalTitle} description={gateway.modalDescription}>
          <div className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {gateway.summary.map(([label, value]) => (
                <GatewayStat key={`${gateway.id}-${label}`} label={label} value={value} />
              ))}
            </div>
            <div className="grid gap-3 border-t border-slate-200 pt-4 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
              {gateway.endpoints.map(([label, value]) => (
                <div key={`${gateway.id}-${label}`}>
                  <div className="font-black text-slate-900">{label}</div>
                  <code className="mt-1 block break-all text-xs">{value}</code>
                </div>
              ))}
            </div>
            <GatewaySettingsTable definitions={gateway.definitions} />
          </div>
        </AdminModal>
      ))}

      <div className="mt-6">
        <AdminDataPage
          kicker={t("records.kicker")}
          title={t("records.title")}
          description={t("records.description")}
          countLabel={t("records.countLabel", { count: payments.length })}
          filters={[
            { label: t("records.filters.provider.label"), value: t("records.filters.provider.value") },
            { label: t("records.filters.statuses.label"), value: t("records.filters.statuses.value") }
          ]}
          columns={[
            { key: "payment", label: t("records.columns.payment") },
            { key: "user", label: t("records.columns.user") },
            { key: "type", label: t("records.columns.type") },
            { key: "provider", label: t("records.columns.provider") },
            { key: "status", label: t("records.columns.status") },
            { key: "amount", label: t("records.columns.amount") },
            { key: "method", label: t("records.columns.method") },
            { key: "action", label: t("records.columns.action") },
            { key: "created", label: t("records.columns.created") }
          ]}
          rows={payments.map((payment) => ({
            id: String(payment.id),
            cells: {
              payment: (
                <div>
                  <div className="font-bold text-slate-900">{payment.paymentNo}</div>
                  <div className="text-xs text-slate-400">{payment.providerOrderNo ?? "-"}</div>
                </div>
              ),
              user: payment.user.email,
              type: payment.type,
              provider: <span className="font-black uppercase text-[#465fff]">{gatewayLabel(payment.provider)}</span>,
              status: <StatusPill status={payment.status} />,
              amount: `${payment.currency} ${Number(payment.amount).toFixed(2)}`,
              method: paymentMethodLabel(payment.paymentMethod, payment.provider, payment.type),
              action: payment.type === "wallet_recharge" && payment.status !== "paid" ? (
                <Can permission="refunds.approve">
                  <form action={confirmWalletRechargePayment}>
                    <input type="hidden" name="id" value={payment.id} />
                    <button className="admin-primary px-3 py-1.5">{t("records.actions.confirmTopUp")}</button>
                  </form>
                </Can>
              ) : payment.provider === paypalProvider && payment.status === "paid" ? (
                <Can permission="refunds.approve">
                  <form action={refundPayPalPaymentAction} className="flex items-center gap-2">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <button className="admin-action px-3 py-1.5">{t("records.actions.refund")}</button>
                  </form>
                </Can>
              ) : "-",
              created: formatDate(payment.createdAt)
            },
            detail: [
              [t("records.detail.paymentId"), payment.id],
              [t("records.detail.paymentNo"), payment.paymentNo],
              [t("records.detail.provider"), payment.provider],
              [t("records.detail.providerOrderNo"), payment.providerOrderNo ?? "-"],
              [t("records.detail.gatewayOrderNo"), payment.gatewayOrderNo ?? "-"],
              [t("records.detail.order"), payment.order?.orderNo ?? "-"],
              [t("records.detail.package"), payment.package?.packageNo ?? "-"],
              [t("records.detail.type"), payment.type],
              [t("records.detail.status"), payment.status],
              [t("records.detail.amount"), `${payment.currency} ${Number(payment.amount).toFixed(2)}`],
              [t("records.detail.paymentMethod"), paymentMethodLabel(payment.paymentMethod, payment.provider, payment.type)],
              [t("records.detail.created"), formatDateTime(payment.createdAt)],
              [t("records.detail.paidAt"), payment.paidAt ? formatDateTime(payment.paidAt) : "-"],
              [t("records.detail.failedAt"), payment.failedAt ? formatDateTime(payment.failedAt) : "-"],
              [t("records.detail.redirectUrl"), payment.redirectUrl ? <Link key="redirect" href={payment.redirectUrl} target="_blank" className="text-[#465fff]">{t("records.detail.openRedirectUrl")}</Link> : "-"],
              [t("records.detail.requestPayload"), jsonBrief(payment.requestPayload)],
              [t("records.detail.responsePayload"), jsonBrief(payment.responsePayload)],
              [t("records.detail.callbackPayload"), jsonBrief(payment.callbackPayload)]
            ]
          }))}
        />
      </div>
    </section>
  );
}

async function WalletTransactionsPage() {
  const t = await getTranslations("finance.walletTransactions");
  const [users, transactions] = await Promise.all([
    prisma.user.findMany({ orderBy: { email: "asc" } }),
    prisma.walletTransaction.findMany({
      include: { user: true, order: true, package: true },
      orderBy: { createdAt: "desc" },
      take: 100
    })
  ]);
  return (
    <section>
      <Can permission="refunds.approve">
        <form action={addWalletAdjustment} className="admin-card mb-5 grid gap-3 p-4 lg:grid-cols-[1fr_150px_180px_1fr_auto] lg:items-end">
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            {t("adjustmentForm.user")}
            <select name="userId" className="admin-input">
              {users.map((user) => <option key={user.id} value={user.id}>{user.email} · {money(Number(user.walletBalance))}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            {t("adjustmentForm.amount")}
            <input name="amount" required type="number" step="0.01" placeholder={t("adjustmentForm.amountPlaceholder")} className="admin-input" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            {t("adjustmentForm.type")}
            <select name="type" className="admin-input">
              <option value="recharge">{t("adjustmentForm.types.recharge")}</option>
              <option value="deduction">{t("adjustmentForm.types.deduction")}</option>
              <option value="refund">{t("adjustmentForm.types.refund")}</option>
              <option value="manual_adjustment">{t("adjustmentForm.types.manualAdjustment")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            {t("adjustmentForm.note")}
            <input name="note" placeholder={t("adjustmentForm.notePlaceholder")} className="admin-input" />
          </label>
          <button className="admin-primary h-10 px-4">{t("adjustmentForm.apply")}</button>
        </form>
      </Can>

      <AdminDataPage
        kicker={t("kicker")}
        title={t("title")}
        description={t("description")}
        countLabel={t("countLabel", { count: transactions.length })}
        columns={[
          { key: "time", label: t("columns.time") },
          { key: "user", label: t("columns.user") },
          { key: "type", label: t("columns.type") },
          { key: "amount", label: t("columns.amount") },
          { key: "balance", label: t("columns.balance") },
          { key: "related", label: t("columns.related") },
          { key: "note", label: t("columns.note"), className: "max-w-[320px] truncate" }
        ]}
        rows={transactions.map((tx) => ({
          id: String(tx.id),
          cells: {
            time: formatDateTime(tx.createdAt),
            user: tx.user.email,
            type: <StatusPill status={tx.type} />,
            amount: `${tx.currency} ${Number(tx.amount).toFixed(2)}`,
            balance: `${tx.currency} ${Number(tx.balanceAfter).toFixed(2)}`,
            related: tx.order?.orderNo ?? tx.package?.packageNo ?? "-",
            note: tx.note ?? "-"
          }
        }))}
      />
    </section>
  );
}

async function FinanceTransactionsPage({ type, variant }: { type: string; variant: "recharge" | "refund" }) {
  const t = await getTranslations(`finance.pages.${variant}`);
  const transactions = await prisma.walletTransaction.findMany({
    where: { type },
    include: { user: true, order: true, package: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: transactions.length })}
      columns={[
        { key: "time", label: t("columns.time") },
        { key: "user", label: t("columns.user") },
        { key: "amount", label: t("columns.amount") },
        { key: "balance", label: t("columns.balance") },
        { key: "related", label: t("columns.related") },
        { key: "note", label: t("columns.note"), className: "max-w-[420px] truncate" }
      ]}
      rows={transactions.map((tx) => ({
        id: String(tx.id),
        cells: {
          time: formatDateTime(tx.createdAt),
          user: tx.user.email,
          amount: `${tx.currency} ${Number(tx.amount).toFixed(2)}`,
          balance: `${tx.currency} ${Number(tx.balanceAfter).toFixed(2)}`,
          related: tx.order?.orderNo ?? tx.package?.packageNo ?? "-",
          note: tx.note ?? "-"
        }
      }))}
    />
  );
}

async function ShippingCountriesPage() {
  const t = await getTranslations("shipping.adminModules.countries");
  const channels = await prisma.shippingChannel.findMany({ include: { rates: true }, orderBy: [{ sortOrder: "asc" }, { code: "asc" }] });
  const countries = new Map<string, { channels: string[]; rates: number }>();
  for (const channel of channels) {
    for (const code of channel.supportedCountries as string[]) {
      const row = countries.get(code) ?? { channels: [], rates: 0 };
      row.channels.push(channel.code);
      row.rates += channel.rates.filter((rate) => rate.countryCode === code).length;
      countries.set(code, row);
    }
  }
  const rows = Array.from(countries.entries()).map(([code, value]) => ({
    id: code,
    cells: {
      country: countryName(code),
      code,
      enabled: <StatusPill status="active" />,
      currency: countryOptions.find((country) => country.iso2 === code)?.currency || "-",
      channels: value.channels.join(", "),
      rates: value.rates
    }
  }));

  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: rows.length })}
      actions={<Link href="/admin/shipping" className="admin-action px-4 py-2">{t("manageChannels")}</Link>}
      columns={[
        { key: "country", label: t("columns.country") },
        { key: "code", label: t("columns.code") },
        { key: "enabled", label: t("columns.enabled") },
        { key: "currency", label: t("columns.currency") },
        { key: "channels", label: t("columns.channels") },
        { key: "rates", label: t("columns.rates") }
      ]}
      rows={rows}
    />
  );
}

async function ShippingRateRulesPage() {
  const t = await getTranslations("shipping.adminModules.rateRules");
  const rates = await prisma.shippingRate.findMany({ include: { channel: true }, orderBy: [{ channel: { code: "asc" } }, { countryName: "asc" }] });
  const importFields: CsvImportField[] = [
    { key: "ruleName", header: "ruleName" },
    { key: "channelCode", header: "channelCode", validateAs: "channelCode" },
    { key: "countryCode", header: "countryCode", validateAs: "countryCode" },
    { key: "firstWeightKg", header: "firstWeightKg", validateAs: "positiveNumber" },
    { key: "firstWeightFee", header: "firstWeightFee", validateAs: "nonNegativeNumber" },
    { key: "additionalWeightKg", header: "additionalWeightKg", validateAs: "positiveNumber" },
    { key: "additionalWeightFee", header: "additionalWeightFee", validateAs: "nonNegativeNumber" },
    { key: "minChargeWeight", header: "minChargeWeight", validateAs: "positiveNumber" },
    { key: "volumeDivisor", header: "volumeDivisor", validateAs: "positiveNumber" },
    { key: "markup", header: "markup", validateAs: "nonNegativeNumber" },
    { key: "status", header: "status", validateAs: "status" }
  ];
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {t("description")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">{t("countLabel", { count: rates.length })}</span>
          <ImportCsvDialog
            title={t("importDialog.title")}
            description={t("importDialog.description")}
            fields={importFields}
            templateFilename="shipping-rate-rules-template.csv"
            action={importShippingRateRules}
          />
          <Link href="/admin/shipping" className="admin-action px-4 py-2">{t("editRateRows")}</Link>
        </div>
      </div>

      <AdminDataPageTable
        columns={[
          { key: "rule", label: t("columns.rule") },
          { key: "channel", label: t("columns.channel") },
          { key: "country", label: t("columns.country") },
          { key: "weight", label: t("columns.weight") },
          { key: "rate", label: t("columns.rate") },
          { key: "volume", label: t("columns.volume") },
          { key: "status", label: t("columns.status") }
        ]}
        rows={rates.map((rate) => ({
          id: String(rate.id),
          cells: {
            rule: `${rate.channel.code}-${rate.countryCode}`,
            channel: rate.channel.name,
            country: `${rate.countryName || countryName(rate.countryCode)} (${rate.countryCode})`,
            weight: `${rate.startWeightKg.toString()}-${rate.maxWeightKg.toString()} kg`,
            rate: `CN ￥${rate.freightRmbPerKg.toString()}/kg + CN ￥${rate.handlingFeeRmb.toString()}`,
            volume: rate.channel.volumeDivisor,
            status: <StatusPill status={rate.channel.isActive ? "active" : "inactive"} />
          },
          searchValues: {
            rule: `${rate.channel.code}-${rate.countryCode}`,
            channel: rate.channel.name,
            country: `${rate.countryName || countryName(rate.countryCode)} ${rate.countryCode}`,
            weight: `${rate.startWeightKg.toString()}-${rate.maxWeightKg.toString()}`,
            rate: `${rate.freightRmbPerKg.toString()} ${rate.handlingFeeRmb.toString()}`,
            volume: String(rate.channel.volumeDivisor),
            status: rate.channel.isActive ? "active" : "inactive"
          }
        }))}
        searchPlaceholder={t("search")}
      />
    </section>
  );
}

async function ShippingRestrictionsPage() {
  const t = await getTranslations("shipping.adminModules.restrictions");
  const channels = await prisma.shippingChannel.findMany({ orderBy: [{ sortOrder: "asc" }, { code: "asc" }] });
  const rows = channels.flatMap((channel) => (channel.forbiddenCategories as string[]).map((category) => ({
    id: `${channel.id}-${category}`,
    cells: {
      category,
      channel: channel.name,
      countries: t("values.countries", { count: (channel.supportedCountries as string[]).length }),
      type: <StatusPill status="restricted" />,
      review: t("values.reviewRequired"),
      userTip: t("values.userTip")
    }
  })));
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: rows.length })}
      columns={[
        { key: "category", label: t("columns.category") },
        { key: "channel", label: t("columns.channel") },
        { key: "countries", label: t("columns.countries") },
        { key: "type", label: t("columns.type") },
        { key: "review", label: t("columns.review") },
        { key: "userTip", label: t("columns.userTip") }
      ]}
      rows={rows}
    />
  );
}

async function AdminShippingCalculatorPage() {
  const t = await getTranslations("shipping.adminModules.calculator");
  return (
    <section>
      <div className="mb-5">
        <div className="admin-kicker">{t("kicker")}</div>
        <h1 className="admin-page-title mt-1">{t("title")}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
      </div>
      <div className="admin-card p-5">
        <ShippingCalculator />
      </div>
    </section>
  );
}

async function MarketingOverviewPage() {
  const t = await getTranslations("legacy-admin.marketingOverview");
  const [users, orders] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.order.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 })
  ]);
  const rows = [
    { id: "affiliate-users", cells: { metric: t("rows.affiliateUsers.metric"), value: users.filter((user) => user.referredBy).length, note: t("rows.affiliateUsers.note"), status: <StatusPill status="tracking" /> } },
    { id: "referral-codes", cells: { metric: t("rows.referralCodes.metric"), value: users.filter((user) => user.referralCode).length, note: t("rows.referralCodes.note"), status: <StatusPill status="active" /> } },
    { id: "eligible-orders", cells: { metric: t("rows.eligibleOrders.metric"), value: orders.filter((order) => Number(order.totalUsd) > 0).length, note: t("rows.eligibleOrders.note"), status: <StatusPill status="pending" /> } }
  ];
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      columns={[
        { key: "metric", label: t("columns.metric") },
        { key: "value", label: t("columns.value") },
        { key: "note", label: t("columns.note") },
        { key: "status", label: t("columns.status") }
      ]}
      rows={rows}
    />
  );
}

async function AffiliateUsersPage() {
  const t = await getTranslations("legacy-admin.affiliateUsers");
  const users = await prisma.user.findMany({ where: { referralCode: { not: "" } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: users.length })}
      columns={[
        { key: "user", label: t("columns.user") },
        { key: "code", label: t("columns.code") },
        { key: "referredBy", label: t("columns.referredBy") },
        { key: "wallet", label: t("columns.wallet") },
        { key: "joined", label: t("columns.joined") }
      ]}
      rows={users.map((user) => ({
        id: String(user.id),
        cells: {
          user: user.email,
          code: user.referralCode,
          referredBy: user.referredBy ?? "-",
          wallet: money(Number(user.walletBalance)),
          joined: formatDate(user.createdAt)
        }
      }))}
    />
  );
}

async function CommissionRecordsPage() {
  const t = await getTranslations("legacy-admin.commissionRecords");
  const orders = await prisma.order.findMany({ include: { user: true }, orderBy: { paidAt: "desc" }, take: 100 });
  const rows = orders.filter((order) => Number(order.totalUsd) > 0).map((order) => ({
    id: String(order.id),
    cells: {
      order: order.orderNo,
      user: order.user.email,
      base: money(Number(order.totalUsd)),
      rate: "0%",
      commission: money(0),
      status: <StatusPill status="not_configured" />
    }
  }));
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: rows.length })}
      columns={[
        { key: "order", label: t("columns.order") },
        { key: "user", label: t("columns.user") },
        { key: "base", label: t("columns.base") },
        { key: "rate", label: t("columns.rate") },
        { key: "commission", label: t("columns.commission") },
        { key: "status", label: t("columns.status") }
      ]}
      rows={rows}
    />
  );
}

async function ContentFaqPage() {
  const t = await getTranslations("legacy-admin.contentFaq");
  const articles = sortHelpArticlesByOrder(
    await prisma.helpArticle.findMany({
      where: { OR: [{ category: { contains: "FAQ" } }, { category: { contains: "Faq" } }, { category: { contains: "faq" } }] },
      orderBy: [{ updatedAt: "desc" }]
    })
  );
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-500">{t("countLabel", { count: articles.length })}</span>
          <Link href="/admin/content/help-articles#help-new" className="admin-primary px-4 py-2">{t("addFaq")}</Link>
        </div>
      </div>

      <AdminFaqSortableList
        items={articles.map((article) => ({
          id: article.id,
          title: article.title,
          slug: article.slug,
          category: article.category,
          locale: article.locale,
          isPublished: article.isPublished
        }))}
      />

      <AdminDataPageTable
        columns={[
          { key: "title", label: t("columns.title") },
          { key: "slug", label: t("columns.slug") },
          { key: "locale", label: t("columns.locale") },
          { key: "status", label: t("columns.status") },
          { key: "updated", label: t("columns.updated") }
        ]}
        rows={articles.map((article) => ({
          id: String(article.id),
          cells: {
            title: article.title,
            slug: article.slug,
            locale: article.locale,
            status: <StatusPill status={article.isPublished ? "published" : "draft"} />,
            updated: formatDate(article.updatedAt)
          },
          searchValues: {
            title: article.title,
            slug: article.slug,
            locale: article.locale,
            status: article.isPublished ? "published" : "draft",
            updated: article.updatedAt.toISOString()
          }
        }))}
        searchPlaceholder={t("searchPlaceholder")}
      />
    </section>
  );
}

async function AnnouncementsPage() {
  const t = await getTranslations("legacy-admin.announcements");
  const pages = await prisma.page.findMany({ where: { slug: { contains: "announcement" } }, orderBy: { updatedAt: "desc" } });
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: pages.length })}
      actions={null}
      columns={[
        { key: "title", label: t("columns.title") },
        { key: "slug", label: t("columns.slug") },
        { key: "status", label: t("columns.status") },
        { key: "updated", label: t("columns.updated") }
      ]}
      rows={pages.map((page) => ({
        id: String(page.id),
        cells: {
          title: page.title,
          slug: page.slug,
          status: <StatusPill status={page.isPublished ? "published" : "draft"} />,
          updated: formatDate(page.updatedAt)
        }
      }))}
    />
  );
}

async function EmailTemplatesPage() {
  const t = await getTranslations("legacy-admin.emailTemplates");
  const logs = await prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const templates = new Map<string, { count: number; lastStatus: string; lastSent?: Date }>();
  for (const log of logs) {
    const entry = templates.get(log.template) ?? { count: 0, lastStatus: log.status, lastSent: log.createdAt };
    entry.count += 1;
    if (!entry.lastSent || log.createdAt > entry.lastSent) {
      entry.lastSent = log.createdAt;
      entry.lastStatus = log.status;
    }
    templates.set(log.template, entry);
  }
  const rows = Array.from(templates.entries()).map(([template, value]) => ({
    id: template,
    cells: {
      template,
      sends: value.count,
      status: <StatusPill status={value.lastStatus} />,
      lastSent: value.lastSent ? formatDateTime(value.lastSent) : "-",
      editor: t("values.editorPending")
    }
  }));
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: rows.length })}
      columns={[
        { key: "template", label: t("columns.template") },
        { key: "sends", label: t("columns.sends") },
        { key: "status", label: t("columns.status") },
        { key: "lastSent", label: t("columns.lastSent") },
        { key: "editor", label: t("columns.editor") }
      ]}
      rows={rows}
    />
  );
}

async function AdminUsersSettingsPage() {
  const t = await getTranslations("legacy-admin.adminUsers");
  const admins = await prisma.user.findMany({ where: { role: { in: adminRoleFilterValues } }, orderBy: { createdAt: "desc" } });
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: admins.length })}
      actions={<Link href="/admin/users" className="admin-action px-4 py-2">{t("openUsers")}</Link>}
      columns={[
        { key: "email", label: t("columns.email") },
        { key: "name", label: t("columns.name") },
        { key: "status", label: t("columns.status") },
        { key: "locale", label: t("columns.locale") },
        { key: "created", label: t("columns.created") }
      ]}
      rows={admins.map((admin) => ({
        id: String(admin.id),
        cells: {
          email: admin.email,
          name: admin.name ?? "-",
          status: <StatusPill status={admin.status} />,
          locale: admin.locale,
          created: formatDate(admin.createdAt)
        }
      }))}
    />
  );
}

async function RolesPermissionsPage() {
  const t = await getTranslations("legacy-admin.rolesPermissions");
  const roles = [
    ["super_admin", t("scopes.superAdmin")],
    ["operations", t("scopes.operations")],
    ["purchasing", t("scopes.purchasing")],
    ["warehouse", t("scopes.warehouse")],
    ["finance", t("scopes.finance")],
    ["customer_support", t("scopes.customerSupport")],
    ["content_manager", t("scopes.contentManager")]
  ];
  return (
    <AdminDataPage
      kicker={t("kicker")}
      title={t("title")}
      description={t("description")}
      countLabel={t("countLabel", { count: roles.length })}
      columns={[
        { key: "role", label: t("columns.role") },
        { key: "scope", label: t("columns.scope") },
        { key: "permissions", label: t("columns.permissions"), className: "max-w-[520px] truncate" },
        { key: "status", label: t("columns.status") }
      ]}
      rows={roles.map(([role, scope]) => ({
        id: role.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        cells: { role, scope, permissions: rolePermissions[role as keyof typeof rolePermissions].join(", "), status: <StatusPill status="active" /> }
      }))}
    />
  );
}

async function OperationLogsPage({ searchParams = {} }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const t = await getTranslations("legacy-admin.operationLogs");
  const retentionDays = await getLogRetentionDays("operation_log_retention_days");
  const now = new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  await prisma.operationLog.deleteMany({
    where: {
      createdAt: { lt: cutoff }
    }
  });
  const actor = readSearchParam(searchParams, "actor");
  const action = readSearchParam(searchParams, "action");
  const targetType = readSearchParam(searchParams, "targetType");
  const from = readSearchParam(searchParams, "from");
  const to = readSearchParam(searchParams, "to");
  const createdAt =
    from || to
      ? {
          gte: from ? new Date(`${from}T00:00:00`) : undefined,
          lte: to ? new Date(`${to}T23:59:59`) : undefined
        }
      : undefined;
  const logs = await prisma.operationLog.findMany({
    where: {
      actorEmail: actor ? { contains: actor } : undefined,
      action: action || undefined,
      targetType: targetType || undefined,
      createdAt
    },
    include: { actor: true, order: true },
    orderBy: { createdAt: "desc" },
    take: 200
  });
  const [actions, targetTypes] = await Promise.all([
    prisma.operationLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    prisma.operationLog.findMany({ distinct: ["targetType"], select: { targetType: true }, where: { targetType: { not: null } }, orderBy: { targetType: "asc" } })
  ]);

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LogToolbar
            retentionDays={retentionDays}
            retentionAction={updateOperationLogRetention}
            clearAction={clearOperationLogs}
            clearConfirmation={t("clearConfirmation")}
            labels={{
              retention: t("toolbar.retention"),
              days: t("toolbar.days"),
              apply: t("toolbar.apply"),
              save: t("toolbar.saveRetention"),
              clear: t("toolbar.clearAllLogs")
            }}
          />
          <span className="text-sm font-semibold text-slate-500">{t("countLabel", { count: logs.length })}</span>
        </div>
      </div>

      <form className="admin-card mb-4 grid gap-3 p-4 lg:grid-cols-[1fr_220px_200px_150px_150px_auto]">
        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {t("filters.actor")}
          <input name="actor" defaultValue={actor} placeholder={t("filters.actorPlaceholder")} className="admin-input normal-case tracking-normal" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {t("filters.action")}
          <select name="action" defaultValue={action} className="admin-input normal-case tracking-normal">
            <option value="">{t("filters.allActions")}</option>
            {actions.map((item) => <option key={item.action} value={item.action}>{item.action}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {t("filters.object")}
          <select name="targetType" defaultValue={targetType} className="admin-input normal-case tracking-normal">
            <option value="">{t("filters.allObjects")}</option>
            {targetTypes.map((item) => item.targetType ? <option key={item.targetType} value={item.targetType}>{item.targetType}</option> : null)}
          </select>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {t("filters.from")}
          <input name="from" type="date" defaultValue={from} className="admin-input normal-case tracking-normal" />
        </label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {t("filters.to")}
          <input name="to" type="date" defaultValue={to} className="admin-input normal-case tracking-normal" />
        </label>
        <div className="flex items-end gap-2">
          <button className="admin-primary px-4 py-2.5">{t("filters.submit")}</button>
          <Link href="/admin/settings/operation-logs" className="admin-action px-4 py-2.5">{t("filters.reset")}</Link>
        </div>
      </form>

      <AdminDataPageTable
        columns={[
          { key: "time", label: t("columns.time") },
          { key: "actor", label: t("columns.actor") },
          { key: "action", label: t("columns.action") },
          { key: "object", label: t("columns.object") },
          { key: "target", label: t("columns.target"), className: "max-w-[220px] truncate" },
          { key: "message", label: t("columns.message"), className: "max-w-[340px] truncate" },
          { key: "ip", label: t("columns.ip") }
        ]}
        rows={logs.map((log) => ({
          id: String(log.id),
          cells: {
            time: formatDateTime(log.createdAt),
            actor: log.actorEmail ?? log.actor?.email ?? t("values.system"),
            action: <StatusPill status={log.action} />,
            object: log.targetType ?? (log.orderId ? t("values.order") : "-"),
            target: log.targetLabel ?? log.order?.orderNo ?? log.targetId ?? "-",
            message: log.message ?? log.detail ?? "-",
            ip: log.ip ?? "-"
          },
          searchValues: {
            time: formatDateTime(log.createdAt),
            actor: log.actorEmail ?? log.actor?.email ?? t("values.system"),
            action: log.action,
            object: log.targetType ?? "",
            target: log.targetLabel ?? log.order?.orderNo ?? log.targetId ?? "",
            message: log.message ?? log.detail ?? "",
            ip: log.ip ?? ""
          },
          actionHref: `#operation-log-${log.id}`,
          actionLabel: t("view")
        }))}
        searchPlaceholder={t("searchPlaceholder")}
      />

      {logs.map((log) => (
        <AdminModal key={log.id} id={`operation-log-${log.id}`} title={t("detailTitle")} description={`#${log.id}`}>
          <div className="grid gap-3 md:grid-cols-2">
            <LogDetail label={t("detail.time")} value={formatDateTime(log.createdAt)} />
            <LogDetail label={t("detail.actor")} value={log.actorEmail ?? log.actor?.email ?? t("values.system")} />
            <LogDetail label={t("detail.action")} value={log.action} />
            <LogDetail label={t("detail.targetType")} value={log.targetType ?? "-"} />
            <LogDetail label={t("detail.targetId")} value={log.targetId ?? "-"} />
            <LogDetail label={t("detail.targetLabel")} value={log.targetLabel ?? log.order?.orderNo ?? "-"} />
            <LogDetail label={t("detail.ip")} value={log.ip ?? "-"} />
            <LogDetail label={t("detail.userAgent")} value={log.userAgent ?? "-"} />
            <LogDetail label={t("detail.message")} value={log.message ?? log.detail ?? "-"} wide />
            <LogDetail label={t("detail.oldValue")} value={jsonBrief(log.oldValue)} wide />
            <LogDetail label={t("detail.newValue")} value={jsonBrief(log.newValue)} wide />
          </div>
        </AdminModal>
      ))}
    </section>
  );
}

async function SettingsModulePage({ title, kicker, definitions, compact = false, permission = "settings.manage" }: { title: string; kicker: string; definitions: SettingDefinition[]; compact?: boolean; permission?: string }) {
  const t = await getTranslations("settings");
  const settings = await prisma.setting.findMany({ where: { key: { in: definitions.map((item) => item.key) } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return (
    <section>
      {!compact ? (
        <div className="mb-5">
          <div className="admin-kicker">{kicker}</div>
          <h1 className="admin-page-title mt-1">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("modulePage.description", { title: title.toLowerCase() })}</p>
        </div>
      ) : (
        <div className="mb-3">
          <div className="admin-kicker">{kicker}</div>
          <h2 className="mt-1 text-xl font-black text-slate-900">{title}</h2>
        </div>
      )}
      <AdminSaveForm action={updateSettingsBatch} permission={permission} className="admin-card p-5" submitLabel={t("modulePage.save", { title })}>
        <div className="admin-table-wrap shadow-none">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("modulePage.setting")}</th>
                <th>{t("modulePage.value")}</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((definition) => (
                <tr key={definition.key}>
                  <td>
                    <SettingHiddenInputs definition={definition} />
                    <div className="font-bold text-slate-900">{definition.label}</div>
                    <div className="mt-1 text-xs text-slate-400">{definition.key}</div>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{definition.description}</p>
                  </td>
                  <td className={definition.html ? "min-w-[min(78vw,560px)] whitespace-normal" : "min-w-[280px]"}>
                    <SettingValueControl
                      definition={definition}
                      value={map.get(definition.key) ?? definition.defaultValue}
                      htmlClassName="min-w-[min(78vw,560px)] max-w-3xl"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSaveForm>
    </section>
  );
}

async function GatewaySettingsTable({ definitions }: { definitions: SettingDefinition[] }) {
  const t = await getTranslations("finance.gatewaySettings");
  const settings = await prisma.setting.findMany({ where: { key: { in: definitions.map((item) => item.key) } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));

  return (
    <AdminSaveForm action={updateSettingsBatch} permission="payments.update" className="admin-card p-5" submitLabel={t("save")}>
      <div className="admin-table-wrap shadow-none">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t("columns.setting")}</th>
              <th>{t("columns.value")}</th>
            </tr>
          </thead>
          <tbody>
            {definitions.map((definition) => (
              <tr key={definition.key}>
                <td className="min-w-[260px] max-w-[420px] whitespace-normal">
                  <SettingHiddenInputs definition={definition} />
                  <div className="font-bold text-slate-900">{definition.label}</div>
                  <div className="mt-1 text-xs text-slate-400">{definition.key}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{definition.description}</p>
                </td>
                <td className={definition.html ? "min-w-[min(74vw,560px)] whitespace-normal" : "min-w-[300px]"}>
                  <SettingValueControl
                    definition={definition}
                    value={map.get(definition.key) ?? definition.defaultValue}
                    htmlClassName="min-w-[min(74vw,560px)] max-w-3xl"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminSaveForm>
  );
}

async function CurrencySettingsPage() {
  const t = await getTranslations("legacy-admin.currencySettings");
  await prisma.$queryRaw`SELECT 1`;
  const definitions = getCurrencySettingDefinitions(await getTranslations("settings"));
  const [settings, latest] = await Promise.all([
    prisma.setting.findMany({ where: { key: { in: definitions.map((item) => item.key) } } }),
    getLatestExchangeRateSnapshot()
  ]);
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  const enabledCurrencies = parseCurrencyList(map.get("enabled_frontend_currencies"));
  const rates = (latest?.rates as Record<string, number> | undefined) ?? {};

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
        </div>
        <Can permission="settings.manage">
          <form action={refreshExchangeRatesAction}>
            <button className="admin-primary px-4 py-2">{t("refreshNow")}</button>
          </form>
        </Can>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-4">
        <GatewayStat label={t("stats.lastStatus")} value={latest?.status ?? t("values.noSyncYet")} />
        <GatewayStat label={t("stats.fetchedAt")} value={formatBeijingTime(latest?.fetchedAt)} />
        <GatewayStat label={t("stats.providerUpdatedAt")} value={formatBeijingTime(latest?.providerUpdatedAt)} />
        <GatewayStat label={t("stats.providerNextAt")} value={formatBeijingTime(latest?.providerNextAt)} />
      </div>

      {latest?.error ? (
        <div className="admin-card mb-5 border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{latest.error}</div>
      ) : null}

      <AdminSaveForm action={updateSettingsBatch} permission="settings.manage" className="admin-card mb-6 p-5" submitLabel={t("save")}>
        <div className="admin-table-wrap shadow-none">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t("columns.setting")}</th>
                <th>{t("columns.value")}</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((definition) => (
                <tr key={definition.key}>
                  <td>
                    <SettingHiddenInputs definition={definition} />
                    <div className="font-bold text-slate-900">{definition.label}</div>
                    <div className="mt-1 text-xs text-slate-400">{definition.key}</div>
                    <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{definition.description}</p>
                  </td>
                  <td className={definition.html ? "min-w-[min(78vw,560px)] whitespace-normal" : "min-w-[300px]"}>
                    <SettingValueControl
                      definition={definition}
                      value={map.get(definition.key) ?? definition.defaultValue}
                      inputClassName="admin-input w-full max-w-xl"
                      htmlClassName="min-w-[min(78vw,560px)] max-w-3xl"
                      htmlMinHeight={120}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSaveForm>

      <AdminDataPage
        kicker={t("table.kicker")}
        title={t("table.title")}
        description={t("table.description")}
        countLabel={t("table.countLabel", { count: enabledCurrencies.length })}
        columns={[
          { key: "currency", label: t("table.columns.currency") },
          { key: "rate", label: t("table.columns.rate") },
          { key: "status", label: t("table.columns.status") }
        ]}
        rows={enabledCurrencies.map((currency) => ({
          id: currency,
          cells: {
            currency,
            rate: rates[currency] ? Number(rates[currency]).toFixed(6) : "-",
            status: rates[currency] ? <StatusPill status="active" /> : <StatusPill status="pending" />
          }
        }))}
      />
    </section>
  );
}

function SettingHiddenInputs({ definition }: { definition: SettingDefinition }) {
  return (
    <>
      <input type="hidden" name="settingKey" value={definition.key} />
      <input type="hidden" name={`label:${definition.key}`} value={definition.persistLabel ?? definition.label} />
      <input type="hidden" name={`description:${definition.key}`} value={definition.persistDescription ?? definition.description} />
    </>
  );
}

function SettingValueControl({
  definition,
  value,
  inputClassName = "admin-input w-full max-w-sm",
  htmlClassName = "min-w-[min(78vw,560px)] max-w-3xl",
  htmlMinHeight = 160
}: {
  definition: SettingDefinition;
  value: string;
  inputClassName?: string;
  htmlClassName?: string;
  htmlMinHeight?: number;
}) {
  const name = `value:${definition.key}`;

  if (definition.html) {
    return (
      <div className={htmlClassName}>
        <HtmlEditor name={name} defaultValue={value} minHeight={htmlMinHeight} />
      </div>
    );
  }

  if (definition.options) {
    return (
      <select name={name} defaultValue={value} className={inputClassName}>
        {definition.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }

  return <input name={name} defaultValue={value} type={definition.secret ? "password" : "text"} className={inputClassName} />;
}

async function SensitiveKeywordsPage() {
  const t = await getTranslations("legacy-admin.sensitiveKeywords");
  const keywords = await getSensitiveKeywords();
  const tableRows: AdminDataTableRow[] = keywords.map((keyword) => ({
    id: String(keyword.id),
    cells: {
      keyword: <span className="font-bold text-slate-900">{keyword.term}</span>,
      created: formatBeijingTime(keyword.createdAt),
      action: (
        <Can permission="settings.manage">
          <form action={deleteSensitiveKeywordAction}>
            <input type="hidden" name="id" value={keyword.id} />
            <button className="admin-danger">{t("delete")}</button>
          </form>
        </Can>
      )
    },
    searchValues: {
      keyword: keyword.term,
      created: keyword.createdAt.toISOString(),
      action: ""
    }
  }));

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="admin-kicker">{t("kicker")}</div>
          <h1 className="admin-page-title mt-1">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{t("description")}</p>
        </div>
        <Can permission="settings.manage">
          <Link href="/api/admin/sensitive-keywords/export" className="admin-action px-4 py-2">{t("exportTxt")}</Link>
        </Can>
      </div>

      <section className="admin-card mb-6 p-5">
        <Can permission="settings.manage">
          <form action={importSensitiveKeywordsAction} className="grid gap-4 lg:grid-cols-[1fr_260px_auto] lg:items-end">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              {t("pasteKeywords")}
              <textarea name="keywords" className="admin-input min-h-36 w-full" placeholder={t("pastePlaceholder")} />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              {t("importTxt")}
              <input name="file" type="file" accept=".txt,text/plain" className="admin-input w-full" />
            </label>
            <button className="admin-primary h-10 px-4">{t("import")}</button>
          </form>
        </Can>
      </section>

      <AdminDataPageTable
        columns={[
          { key: "keyword", label: t("columns.keyword") },
          { key: "created", label: t("columns.created") },
          { key: "action", label: t("columns.action") }
        ]}
        rows={tableRows}
        searchPlaceholder={t("searchPlaceholder")}
        showRowActions={false}
      />
    </section>
  );
}

const generalSettingBaseDefinitions: Array<Omit<SettingDefinition, "label" | "description"> & { translationKey: string; persistLabel: string; persistDescription: string }> = [
  { key: "site_name", defaultValue: "CNSnap", translationKey: "siteName", persistLabel: "Website Name", persistDescription: "Brand name displayed in the frontend header and emails." },
  { key: "site_logo_text", defaultValue: "CNSnap", translationKey: "siteLogoText", persistLabel: "Logo Text", persistDescription: "Text fallback for logo display." },
  { key: "support_email", defaultValue: "support@cnsnap.com", translationKey: "supportEmail", persistLabel: "Support Email", persistDescription: "Customer support mailbox used in the frontend floating bar and account pages." },
  { key: "floating_app_qr_code_url", defaultValue: "", translationKey: "floatingAppQrCodeUrl", persistLabel: "Floating App QR Code URL", persistDescription: "Public image URL used in the PC right floating bar download panel." },
  { key: "floating_ios_download_url", defaultValue: "", translationKey: "floatingIosDownloadUrl", persistLabel: "Floating iOS Download URL", persistDescription: "App Store or TestFlight link used in the PC right floating bar." },
  { key: "floating_android_download_url", defaultValue: "", translationKey: "floatingAndroidDownloadUrl", persistLabel: "Floating Android Download URL", persistDescription: "Google Play or APK landing link used in the PC right floating bar." },
  { key: "floating_discord_url", defaultValue: "https://discord.gg/t7xmAYwZhU", translationKey: "floatingDiscordUrl", persistLabel: "Floating Discord URL", persistDescription: "Discord community link used by the PC right floating bar." },
  { key: "default_language", defaultValue: "en", translationKey: "defaultLanguage", persistLabel: "Default Language", persistDescription: "Default frontend and admin language.", options: ["en", "zh-CN"] },
  { key: "admin_language", defaultValue: "en", translationKey: "adminLanguage", persistLabel: "Admin Language", persistDescription: "Admin interface language.", options: ["en", "zh-CN"] },
  { key: "default_currency", defaultValue: "USD", translationKey: "defaultCurrency", persistLabel: "Default Currency", persistDescription: "Default settlement currency.", options: ["USD", "EUR", "CNY"] },
  { key: "default_timezone", defaultValue: "Asia/Shanghai", translationKey: "defaultTimezone", persistLabel: "Default Timezone", persistDescription: "Timezone used for operation dashboards." },
  { key: "order_no_prefix", defaultValue: "HT", translationKey: "orderNoPrefix", persistLabel: "Order Number Prefix", persistDescription: "Prefix used when generating order numbers." },
  { key: "package_no_prefix", defaultValue: "PK", translationKey: "packageNoPrefix", persistLabel: "Package Number Prefix", persistDescription: "Prefix used when generating package numbers." },
  { key: "registration_enabled", defaultValue: "true", translationKey: "registrationEnabled", persistLabel: "Open Registration", persistDescription: "Allow new frontend user registrations.", options: ["true", "false"] },
  { key: "diy_order_enabled", defaultValue: "true", translationKey: "diyOrderEnabled", persistLabel: "Enable DIY Order", persistDescription: "Allow customers to submit manual quote requests.", options: ["true", "false"] },
  { key: "affiliate_enabled", defaultValue: "false", translationKey: "affiliateEnabled", persistLabel: "Enable Affiliate", persistDescription: "Enable referral and commission features.", options: ["true", "false"] },
  { key: "maintenance_mode", defaultValue: "false", translationKey: "maintenanceMode", persistLabel: "Maintenance Mode", persistDescription: "Reserve flag for temporary frontend maintenance.", options: ["true", "false"] }
];

const apiSettingBaseDefinitions: Array<Omit<SettingDefinition, "label" | "description"> & { translationKey: string; persistLabel: string; persistDescription: string }> = [
  { key: "onebound_gateway", defaultValue: "https://api-gw.fan-b.com", translationKey: "oneboundGateway", persistLabel: "OneBound Base URL", persistDescription: "Gateway base URL for product parsing and search." },
  { key: "onebound_api_key", defaultValue: "", translationKey: "oneboundApiKey", persistLabel: "OneBound API Key", persistDescription: "API key for item_get and item_search." },
  { key: "onebound_api_secret", defaultValue: "", translationKey: "oneboundApiSecret", persistLabel: "OneBound API Secret", persistDescription: "Secret key for OneBound requests.", secret: true },
  { key: "onebound_timeout_ms", defaultValue: "30000", translationKey: "oneboundTimeoutMs", persistLabel: "API Timeout", persistDescription: "Request timeout in milliseconds." },
  { key: "onebound_retry_count", defaultValue: "1", translationKey: "oneboundRetryCount", persistLabel: "Retry Count", persistDescription: "Retry attempts for transient gateway failures." },
  { key: "product_cache_hours", defaultValue: "24", translationKey: "productCacheHours", persistLabel: "Product Cache Hours", persistDescription: "How long product detail cache remains fresh." },
  { key: "search_cache_minutes", defaultValue: "30", translationKey: "searchCacheMinutes", persistLabel: "Search Cache Minutes", persistDescription: "Reserved cache TTL for keyword search results." }
];

const smtpSettingBaseDefinitions: Array<Omit<SettingDefinition, "label" | "description"> & { translationKey: string; persistLabel: string; persistDescription: string }> = [
  { key: "smtp_host", defaultValue: "", translationKey: "smtpHost", persistLabel: "SMTP Host", persistDescription: "SMTP server hostname." },
  { key: "smtp_port", defaultValue: "587", translationKey: "smtpPort", persistLabel: "SMTP Port", persistDescription: "SMTP port." },
  { key: "smtp_user", defaultValue: "", translationKey: "smtpUser", persistLabel: "SMTP User", persistDescription: "SMTP username." },
  { key: "smtp_password", defaultValue: "", translationKey: "smtpPassword", persistLabel: "SMTP Password", persistDescription: "SMTP password or app password.", secret: true },
  { key: "smtp_from_email", defaultValue: "no-reply@localhost", translationKey: "smtpFromEmail", persistLabel: "From Email", persistDescription: "Default sender email." },
  { key: "smtp_from_name", defaultValue: "CNSnap", translationKey: "smtpFromName", persistLabel: "From Name", persistDescription: "Default sender name." },
  { key: "smtp_secure", defaultValue: "false", translationKey: "smtpSecure", persistLabel: "SSL/TLS", persistDescription: "Use secure SMTP connection.", options: ["true", "false"] }
];

function getGeneralSettingDefinitions(t: Awaited<ReturnType<typeof getTranslations>>) {
  return generalSettingBaseDefinitions.map((definition) => ({
    ...definition,
    label: t(`generalDefinitions.${definition.translationKey}.label`),
    description: t(`generalDefinitions.${definition.translationKey}.description`)
  })) as SettingDefinition[];
}

function getApiSettingDefinitions(t: Awaited<ReturnType<typeof getTranslations>>) {
  return apiSettingBaseDefinitions.map((definition) => ({
    ...definition,
    label: t(`apiDefinitions.${definition.translationKey}.label`),
    description: t(`apiDefinitions.${definition.translationKey}.description`)
  })) as SettingDefinition[];
}

function getSmtpSettingDefinitions(t: Awaited<ReturnType<typeof getTranslations>>) {
  return smtpSettingBaseDefinitions.map((definition) => ({
    ...definition,
    label: t(`smtpDefinitions.${definition.translationKey}.label`),
    description: t(`smtpDefinitions.${definition.translationKey}.description`)
  })) as SettingDefinition[];
}

function getCurrencySettingDefinitions(t: Awaited<ReturnType<typeof getTranslations>>) {
  return [
    {
      key: "exchange_rate_api_key",
      defaultValue: "",
      label: t("financeDefinitions.exchangeRateApiKey.label"),
      description: t("financeDefinitions.exchangeRateApiKey.description"),
      persistLabel: "ExchangeRate-API Key",
      persistDescription: "API key for https://www.exchangerate-api.com/ CNY latest rates.",
      secret: true
    },
    {
      key: "enabled_frontend_currencies",
      defaultValue: defaultEnabledCurrencies.join(","),
      label: t("financeDefinitions.enabledFrontendCurrencies.label"),
      description: t("financeDefinitions.enabledFrontendCurrencies.description"),
      persistLabel: "Frontend Currencies",
      persistDescription: "Comma-separated currency codes shown in the frontend currency switcher."
    },
    {
      key: "default_currency",
      defaultValue: "USD",
      label: t("financeDefinitions.defaultCurrency.label"),
      description: t("financeDefinitions.defaultCurrency.description"),
      persistLabel: "Default Currency",
      persistDescription: "Default customer-facing currency.",
      options: defaultEnabledCurrencies
    },
    {
      key: "settlement_currency",
      defaultValue: "CNY",
      label: t("financeDefinitions.settlementCurrency.label"),
      description: t("financeDefinitions.settlementCurrency.description"),
      persistLabel: "Settlement Currency",
      persistDescription: "Source shopping and purchasing settlement currency.",
      options: ["CNY"]
    },
    {
      key: "currency_decimal_places",
      defaultValue: "2",
      label: t("financeDefinitions.currencyDecimalPlaces.label"),
      description: t("financeDefinitions.currencyDecimalPlaces.description"),
      persistLabel: "Decimal Places",
      persistDescription: "Displayed decimal precision for prices."
    },
    {
      key: "exchange_rate_updated_at",
      defaultValue: "",
      label: t("financeDefinitions.exchangeRateUpdatedAt.label"),
      description: t("financeDefinitions.exchangeRateUpdatedAt.description"),
      persistLabel: "Legacy Rate Updated At",
      persistDescription: "Legacy manual timestamp retained for compatibility."
    }
  ] as SettingDefinition[];
}

function getServiceFeeSettingDefinitions(t: Awaited<ReturnType<typeof getTranslations>>) {
  return [
    { key: "service_fee_enabled", defaultValue: "true", label: t("financeDefinitions.serviceFeeEnabled.label"), description: t("financeDefinitions.serviceFeeEnabled.description"), options: ["true", "false"] },
    { key: "service_fee_rate", defaultValue: "0.05", label: t("financeDefinitions.serviceFeeRate.label"), description: t("financeDefinitions.serviceFeeRate.description") },
    { key: "min_service_fee_usd", defaultValue: "2", label: t("financeDefinitions.minServiceFeeUsd.label"), description: t("financeDefinitions.minServiceFeeUsd.description") },
    { key: "manual_price_adjustment", defaultValue: "true", label: t("financeDefinitions.manualPriceAdjustment.label"), description: t("financeDefinitions.manualPriceAdjustment.description"), options: ["true", "false"] }
  ] as SettingDefinition[];
}

const affiliateSettingDefinitions: SettingDefinition[] = [
  { key: "affiliate_enabled", defaultValue: "false", label: "Enable Affiliate", description: "Turn on referral and commission features.", options: ["true", "false"] },
  { key: "affiliate_default_rate", defaultValue: "0", label: "Default Commission Rate", description: "Default commission rate for paid orders." },
  { key: "affiliate_cookie_days", defaultValue: "30", label: "Attribution Window", description: "Referral attribution window in days." },
  { key: "affiliate_min_payout_usd", defaultValue: "50", label: "Minimum Payout", description: "Minimum payable commission balance in USD." }
];

const onlyPaySettingDefinitions: SettingDefinition[] = [
  { key: "onlypay_enabled", defaultValue: "false", label: "Enable ONLYPAY", description: "Set true to allow frontend order checkout through ONLYPAY.", options: ["true", "false"] },
  { key: "onlypay_title", defaultValue: "Credit Card / Wallet Payment", label: "Checkout Title", description: "Button title displayed to customers." },
  { key: "onlypay_mch_id", defaultValue: "", label: "Merchant ID", description: "ONLYPAY mchId issued by the gateway." },
  { key: "onlypay_app_id", defaultValue: "", label: "Application ID", description: "ONLYPAY appId issued by the gateway." },
  { key: "onlypay_sign_key", defaultValue: "", label: "Signature Key", description: "ONLYPAY signKey used to sign create-order requests and verify callbacks.", secret: true },
  { key: "onlypay_submit_url", defaultValue: "https://international.storepay.cn/api/pay/create_order", label: "Submit URL", description: "ONLYPAY create order endpoint." },
  { key: "onlypay_product_id", defaultValue: "8000", label: "Product ID", description: "ONLYPAY productId. The WordPress plugin defaults to 8000." }
];

const paypalSettingDefinitions: SettingDefinition[] = [
  { key: "paypal_enabled", defaultValue: "false", label: "Enable PayPal Checkout", description: "Set true to show PayPal Checkout on unpaid orders and wallet recharge.", options: ["true", "false"] },
  { key: "paypal_title", defaultValue: "PayPal Checkout", label: "Checkout Title", description: "Payment method title displayed to customers." },
  { key: "paypal_mode", defaultValue: "sandbox", label: "Mode", description: "Use sandbox for testing and live for production payments.", options: ["sandbox", "live"] },
  { key: "paypal_sandbox_client_id", defaultValue: "", label: "Sandbox Client ID", description: "Client ID from the PayPal sandbox REST app." },
  { key: "paypal_sandbox_client_secret", defaultValue: "", label: "Sandbox Client Secret", description: "Client secret from the PayPal sandbox REST app.", secret: true },
  { key: "paypal_live_client_id", defaultValue: "", label: "Live Client ID", description: "Client ID from the PayPal live REST app." },
  { key: "paypal_live_client_secret", defaultValue: "", label: "Live Client Secret", description: "Client secret from the PayPal live REST app.", secret: true },
  { key: "paypal_advanced_card_enabled", defaultValue: "false", label: "Advanced Card Payments", description: "Set true to load PayPal card fields. The merchant account must be eligible for Advanced Card Payments.", options: ["true", "false"] },
  { key: "paypal_brand_name", defaultValue: "CNSnap", label: "Brand Name", description: "Brand displayed in the PayPal checkout context." },
  { key: "paypal_currency", defaultValue: "USD", label: "Currency", description: "Currency code used for PayPal orders. USD is recommended for the current checkout totals." }
];

const sepaSettingDefinitions: SettingDefinition[] = [
  { key: "sepa_enabled", defaultValue: "false", label: "Enable SEPA", description: "Set true to show SEPA Instant Payments for EU addresses or EUR orders.", options: ["true", "false"] },
  { key: "sepa_title", defaultValue: "SEPA Instant Payments", label: "Checkout Title", description: "Payment method title displayed to customers." },
  { key: "sepa_description", defaultValue: "<p>Transfer the payable amount in EUR to our SEPA account, then submit your bank account holder name and the last four characters of the transaction reference.</p>", label: "Checkout Description", description: "HTML description shown above bank details.", html: true },
  { key: "sepa_beneficiary_name", defaultValue: "", label: "Beneficiary Name", description: "Full receiving account holder name." },
  { key: "sepa_iban", defaultValue: "", label: "IBAN", description: "International Bank Account Number for EUR transfers." },
  { key: "sepa_bic", defaultValue: "", label: "BIC / SWIFT", description: "Receiving bank BIC or SWIFT code." },
  { key: "sepa_reference", defaultValue: "CNSNAP-{orderNo}", label: "Payment Reference", description: "Reference customers should include in bank transfer. Use {orderNo} to inject order number." },
  { key: "sepa_bank_name", defaultValue: "", label: "Bank Name", description: "Receiving bank name." },
  { key: "sepa_bank_address", defaultValue: "", label: "Bank Address", description: "Full receiving bank branch address." },
  { key: "sepa_tips", defaultValue: "After completing the transfer, please enter the last 4 characters of your transaction ID or the last 4 digits of your bank account number.", label: "Transaction ID Tips", description: "Short helper text under the transaction reference field." },
  { key: "sepa_instructions", defaultValue: "<p>We will confirm your SEPA transfer within the next 12 hours after submission.</p>", label: "Instructions", description: "HTML instructions shown after the SEPA confirmation form.", html: true },
  { key: "sepa_usd_eur_rate", defaultValue: "0.92", label: "USD to EUR Rate", description: "Used to convert unpaid USD order amount into EUR for SEPA transfers." }
];

function GatewayStat({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-3 ${wide ? "md:col-span-2" : ""}`}>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 break-all text-sm font-bold text-slate-900">{value || "-"}</div>
    </div>
  );
}

function GatewayMetric({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`admin-card ${compact ? "min-w-28 p-3" : "p-5"}`}>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className={`${compact ? "mt-1 text-base" : "mt-2 text-3xl"} font-black text-slate-900`}>{value}</div>
    </div>
  );
}

function GatewayStatusBadge({ status }: { status: "ready" | "incomplete" | "disabled" }) {
  const tone = {
    ready: "border-jade/40 bg-jade/10 text-jade",
    incomplete: "border-[#b9822b]/40 bg-[#b9822b]/10 text-[#b9822b]",
    disabled: "border-slate-200 bg-slate-100 text-slate-500"
  }[status];
  const label = {
    ready: "Ready",
    incomplete: "Incomplete",
    disabled: "Disabled"
  }[status];

  return <span className={`inline-flex items-center border px-2 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function gatewayStatus(ready: boolean, enabled: boolean): "ready" | "incomplete" | "disabled" {
  if (ready) return "ready";
  return enabled ? "incomplete" : "disabled";
}

function isPendingPayment(status: string) {
  return ["pending", "redirected", "processing", "awaiting_transfer"].includes(status);
}

function maskSecret(value: string) {
  if (!value) return "Missing";
  if (value.length <= 6) return "Configured";
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function gatewayLabel(provider: string) {
  if (provider === "onlypay") return "ONLYPAY";
  if (provider === paypalProvider) return "PayPal Checkout";
  if (provider === sepaProvider) return "SEPA Instant";
  if (provider === "wallet" || provider === "balance") return "CNSnap Balance";
  return provider;
}

function paymentMethodLabel(method?: string | null, provider?: string | null, type?: string | null) {
  if (method === "wallet_balance" || provider === "wallet" || provider === "balance") return "CNSnap Balance";
  if ((type === "pay_order" || type === "pay_shipping") && !method) return "CNSnap Balance";
  if (method === "manual_invoice") return "Manual Invoice";
  if (method === "manual") return "Manual Payment";
  return method ?? "-";
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(date: Date) {
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function readSearchParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function sortHelpArticlesByOrder<T extends { sortOrder?: number | null; updatedAt: Date }>(articles: T[]) {
  return [...articles].sort((left, right) => {
    const orderDiff = Number(left.sortOrder ?? 0) - Number(right.sortOrder ?? 0);
    if (orderDiff) return orderDiff;
    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });
}

function LogDetail({ label, value, wide = false }: { label: string; value: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm ${wide ? "md:col-span-2" : ""}`}>
      <div className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">{label}</div>
      <div className="mt-1 break-words font-semibold text-slate-800">{value || "-"}</div>
    </div>
  );
}

function jsonBrief(value: unknown) {
  if (value == null) return "-";
  try {
    return JSON.stringify(value).slice(0, 500);
  } catch {
    return String(value);
  }
}

function readJsonField(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  const field = record[key];
  return typeof field === "string" ? field : "";
}
