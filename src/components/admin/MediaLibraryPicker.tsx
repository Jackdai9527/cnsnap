"use client";

import { Check, Copy, ExternalLink, Image as ImageIcon, Loader2, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UppyMediaUploader, type MediaAssetSummary } from "@/components/admin/UppyMediaUploader";

type MediaLibraryPickerProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAssetSummary) => void;
  title?: string;
  usage?: string;
  allowUpload?: boolean;
};

type MediaLibraryManagerProps = {
  initialAssets: MediaAssetSummary[];
};

const usageOptions = [
  { value: "all", label: "All media" },
  { value: "media_library", label: "Media library" },
  { value: "content_image", label: "Content images" },
  { value: "homepage_material", label: "Homepage" },
  { value: "qc_photo", label: "QC photos" }
];

export function MediaLibraryManager({ initialAssets }: MediaLibraryManagerProps) {
  const [assets, setAssets] = useState(initialAssets);
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAssets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ mime: "image", take: "120" });
      if (query.trim()) params.set("q", query.trim());
      if (usage !== "all") params.set("usage", usage);
      const response = await fetch(`/api/admin/media?${params.toString()}`);
      const payload = await response.json() as { assets?: MediaAssetSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to load media.");
      setAssets(payload.assets ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load media.");
    } finally {
      setLoading(false);
    }
  }, [query, usage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAssets();
    }, 220);
    return () => window.clearTimeout(timer);
  }, [loadAssets]);

  return (
    <div className="grid gap-4">
      <section className="admin-card p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-black text-slate-900">Upload Images</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">PNG, JPG, WebP, GIF files saved to the server media directory.</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-500">{assets.length} files</span>
        </div>
        <UppyMediaUploader onUploaded={(asset) => setAssets((current) => [asset, ...current])} />
      </section>

      <section className="admin-card p-4">
        <MediaSearchBar
          query={query}
          usage={usage}
          loading={loading}
          onQuery={setQuery}
          onUsage={setUsage}
          onRefresh={() => void loadAssets()}
        />
        {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div> : null}
        <MediaGrid assets={assets} mode="manage" onDeleted={(id) => setAssets((current) => current.filter((asset) => asset.id !== id))} />
      </section>
    </div>
  );
}

export function MediaLibraryPicker({
  open,
  onClose,
  onSelect,
  title = "Media Library",
  usage,
  allowUpload = true
}: MediaLibraryPickerProps) {
  const [assets, setAssets] = useState<MediaAssetSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAssets = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ mime: "image", take: "90" });
      if (query.trim()) params.set("q", query.trim());
      if (usage) params.set("usage", usage);
      const response = await fetch(`/api/admin/media?${params.toString()}`);
      const payload = await response.json() as { assets?: MediaAssetSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to load media.");
      setAssets(payload.assets ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load media.");
    } finally {
      setLoading(false);
    }
  }, [open, query, usage]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadAssets();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [loadAssets, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="media-picker-title">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close media library" onClick={onClose} />
      <div className="relative z-10 flex max-h-[calc(100dvh-4rem)] w-[min(80vw,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="media-picker-title" className="text-xl font-extrabold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Select an image from server media.</p>
          </div>
          <button type="button" className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-[#2563eb] hover:bg-[#eff6ff] hover:text-[#2563eb]" aria-label="Close media library" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-5">
          {allowUpload ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <UppyMediaUploader compact usage={usage ?? "content_image"} onUploaded={(asset) => setAssets((current) => [asset, ...current])} />
            </div>
          ) : null}
          <MediaSearchBar
            query={query}
            usage={usage ?? "all"}
            loading={loading}
            hideUsage={Boolean(usage)}
            onQuery={setQuery}
            onUsage={() => undefined}
            onRefresh={() => void loadAssets()}
          />
          {error ? <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div> : null}
          <MediaGrid
            assets={assets}
            mode="select"
            onSelect={(asset) => {
              onSelect(asset);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MediaSearchBar({
  query,
  usage,
  loading,
  hideUsage = false,
  onQuery,
  onUsage,
  onRefresh
}: {
  query: string;
  usage: string;
  loading: boolean;
  hideUsage?: boolean;
  onQuery: (value: string) => void;
  onUsage: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative min-w-[260px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input value={query} onChange={(event) => onQuery(event.target.value)} className="admin-input w-full pl-9" placeholder="Search filename, alt text, caption, URL" />
      </label>
      {hideUsage ? null : (
        <select value={usage} onChange={(event) => onUsage(event.target.value)} className="admin-input min-w-[180px]">
          {usageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      )}
      <button type="button" className="admin-action gap-2 px-3 py-2" onClick={onRefresh} disabled={loading}>
        {loading ? <Loader2 className="animate-spin" size={15} /> : <Search size={15} />}
        {loading ? "Loading" : "Refresh"}
      </button>
    </div>
  );
}

function MediaGrid({
  assets,
  mode,
  onSelect,
  onDeleted
}: {
  assets: MediaAssetSummary[];
  mode: "manage" | "select";
  onSelect?: (asset: MediaAssetSummary) => void;
  onDeleted?: (id: number) => void;
}) {
  if (!assets.length) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
        <ImageIcon className="mx-auto text-slate-300" size={34} />
        <div className="mt-2 text-sm font-black text-slate-700">No images found</div>
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {assets.map((asset) => (
        <MediaTile key={asset.id} asset={asset} mode={mode} onSelect={onSelect} onDeleted={onDeleted} />
      ))}
    </div>
  );
}

function MediaTile({
  asset,
  mode,
  onSelect,
  onDeleted
}: {
  asset: MediaAssetSummary;
  mode: "manage" | "select";
  onSelect?: (asset: MediaAssetSummary) => void;
  onDeleted?: (id: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const url = useMemo(() => absoluteUrl(asset.url), [asset.url]);

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function deleteAsset() {
    if (!window.confirm(`Delete ${asset.originalName}?`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/media/${asset.id}`, { method: "DELETE" });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Delete failed.");
      onDeleted?.(asset.id);
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button type="button" className="block aspect-[4/3] w-full overflow-hidden bg-slate-100 text-left" onClick={() => mode === "select" && onSelect?.(asset)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset.url} alt={asset.altText || asset.originalName} className="h-full w-full object-cover transition duration-200 hover:scale-[1.02]" />
      </button>
      <div className="grid gap-2 p-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-slate-900" title={asset.originalName}>{asset.originalName}</div>
          <div className="mt-0.5 text-xs font-semibold text-slate-400">{asset.usage} · {formatSize(asset.size)}</div>
        </div>
        <input readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="admin-input h-9 text-xs" aria-label={`${asset.originalName} URL`} />
        <div className="flex flex-wrap gap-2">
          {mode === "select" ? (
            <button type="button" className="admin-primary gap-2 px-3 py-2" onClick={() => onSelect?.(asset)}>
              <Check size={15} />
              Insert
            </button>
          ) : null}
          <button type="button" className="admin-action gap-2 px-3 py-2" onClick={() => void copyUrl()}>
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <a href={asset.url} target="_blank" className="admin-action gap-2 px-3 py-2">
            <ExternalLink size={15} />
            Open
          </a>
          {mode === "manage" ? (
            <button type="button" className="admin-danger gap-2 px-3 py-2" onClick={() => void deleteAsset()} disabled={deleting}>
              {deleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function absoluteUrl(url: string) {
  if (typeof window === "undefined") return url;
  return new URL(url, window.location.origin).toString();
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(size / 1024))}KB`;
}
