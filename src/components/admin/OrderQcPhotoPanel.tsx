"use client";

import { Check, Copy, ExternalLink, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { UppyMediaUploader, type MediaAssetSummary } from "@/components/admin/UppyMediaUploader";

type OrderQcPhotoPanelProps = {
  orderId: number;
  packageId?: number | null;
  initialAssets: MediaAssetSummary[];
  compact?: boolean;
  refreshOnUpload?: boolean;
};

export function OrderQcPhotoPanel({ orderId, packageId, initialAssets, compact = false, refreshOnUpload = true }: OrderQcPhotoPanelProps) {
  const router = useRouter();
  const [assets, setAssets] = useState(initialAssets);
  const refreshScheduledRef = useRef(false);

  return (
    <div className="grid gap-3">
      <UppyMediaUploader
        compact={compact}
        usage="qc_photo"
        orderId={orderId}
        packageId={packageId ?? undefined}
        onUploaded={(asset) => {
          setAssets((current) => [asset, ...current]);
          if (refreshOnUpload && !refreshScheduledRef.current) {
            refreshScheduledRef.current = true;
            window.setTimeout(() => {
              refreshScheduledRef.current = false;
              router.refresh();
            }, 250);
          }
        }}
      />
      <QcPhotoGrid assets={assets} onDeleted={(id) => setAssets((current) => current.filter((asset) => asset.id !== id))} />
    </div>
  );
}

export function QcPhotoGrid({ assets, onDeleted }: { assets: MediaAssetSummary[]; onDeleted?: (id: number) => void }) {
  const t = useTranslations("orders.ordersPage.detailPage.qcUploader");

  if (!assets.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2">
          <ImageIcon size={16} />
          {t("empty")}
        </span>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {assets.map((asset) => <QcPhotoTile key={asset.id} asset={asset} onDeleted={onDeleted} />)}
    </div>
  );
}

function QcPhotoTile({ asset, onDeleted }: { asset: MediaAssetSummary; onDeleted?: (id: number) => void }) {
  const t = useTranslations("orders.ordersPage.detailPage.qcUploader");
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fullUrl = useMemo(() => {
    if (typeof window === "undefined") return asset.url;
    return new URL(asset.url, window.location.origin).toString();
  }, [asset.url]);

  async function copyUrl() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function deletePhoto() {
    if (!window.confirm(t("deleteConfirm", { name: asset.originalName }))) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || t("deleteFailed"));
      onDeleted?.(asset.id);
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : t("deleteFailed"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <a href={asset.url} target="_blank" className="block aspect-[4/3] overflow-hidden bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.url} alt={asset.altText || asset.originalName} className="h-full w-full object-cover" />
      </a>
      <div className="grid gap-2 p-3">
        <div className="truncate text-sm font-black text-slate-900" title={asset.originalName}>{asset.originalName}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-action gap-2 px-3 py-2" onClick={() => void copyUrl()}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? t("copied") : t("copy")}
          </button>
          <a href={asset.url} target="_blank" className="admin-action gap-2 px-3 py-2">
            <ExternalLink size={15} />
            {t("open")}
          </a>
          <button type="button" className="admin-danger gap-2 px-3 py-2" onClick={() => void deletePhoto()} disabled={deleting}>
            {deleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
            {t("delete")}
          </button>
        </div>
      </div>
    </article>
  );
}
