"use client";

import { CheckCircle2, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Uppy from "@uppy/core";
import type { Body, Meta, State, UppyFile, UploadResult } from "@uppy/core";
import XHRUpload from "@uppy/xhr-upload";

type UppyMediaUploaderProps = {
  usage?: string;
  orderId?: number;
  packageId?: number;
  compact?: boolean;
  onUploaded?: (asset: MediaAssetSummary) => void;
};

export type MediaAssetSummary = {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  altText?: string | null;
  caption?: string | null;
  usage: string;
  orderId?: number | null;
  packageId?: number | null;
  createdAt: string;
  uploader?: { id: number; email: string; name: string | null } | null;
};

type UploadBody = Body & {
  asset?: MediaAssetSummary;
  error?: string;
};

type UploadFile = UppyFile<Meta, UploadBody>;
const uploadTimeoutMs = 120 * 1000;

export function UppyMediaUploader({
  usage = "media_library",
  orderId,
  packageId,
  compact = false,
  onUploaded
}: UppyMediaUploaderProps) {
  const t = useTranslations("orders.ordersPage.detailPage.qcUploader");
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uploadedAssetIdsRef = useRef(new Set<number>());
  const autoUploadTimerRef = useRef<number | null>(null);

  const meta = useMemo(() => ({
    usage,
    orderId: orderId ? String(orderId) : "",
    packageId: packageId ? String(packageId) : ""
  }), [orderId, packageId, usage]);

  const uppy = useMemo(() => {
    const instance = new Uppy<Meta, UploadBody>({
      autoProceed: false,
      restrictions: {
        maxFileSize: 12 * 1024 * 1024,
        allowedFileTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"]
      }
    });
    instance.use(XHRUpload, {
      endpoint: "/api/admin/media",
      fieldName: "file",
      formData: true,
      bundle: false,
      responseType: "json",
      timeout: uploadTimeoutMs,
      getResponseData: (xhr) => {
        const body = (xhr.response || parseResponseText(xhr.responseText)) as UploadBody | null;
        if (xhr.status >= 400 || body?.error) {
          throw new Error(body?.error || t("uploadFailedWithStatus", { status: xhr.status }));
        }
        return body ?? {};
      }
    });
    return instance;
  }, [t]);

  useEffect(() => {
    uppy.setMeta(meta);
  }, [meta, uppy]);

  useEffect(() => {
    function syncFiles(_prev?: State<Meta, UploadBody>, next?: State<Meta, UploadBody>) {
      const state = next ?? uppy.getState();
      setFiles(Object.values(state.files));
    }
    function onUpload() {
      setIsUploading(true);
      setStatus("");
      setError("");
    }
    function onProgress() {
      syncFiles();
    }
    function onUploadSuccess(_file: UploadFile | undefined, response: NonNullable<UploadFile["response"]>) {
      const asset = response.body?.asset;
      if (asset && !uploadedAssetIdsRef.current.has(asset.id)) {
        uploadedAssetIdsRef.current.add(asset.id);
        onUploaded?.(asset);
        setStatus(t("imageUploadedSuccessfully"));
      }
      syncFiles();
    }
    function onComplete(result: UploadResult<Meta, UploadBody>) {
      setIsUploading(false);
      const uploaded = result.successful?.map((file) => file.response?.body?.asset).filter(Boolean) as MediaAssetSummary[] | undefined;
      if (uploaded?.length) {
        setStatus(t("imagesUploadedSuccessfully", { count: uploaded.length }));
        uploaded.forEach((asset) => {
          if (!uploadedAssetIdsRef.current.has(asset.id)) {
            uploadedAssetIdsRef.current.add(asset.id);
            onUploaded?.(asset);
          }
        });
        uppy.clear();
      } else if (result.failed?.length) {
        setError(result.failed.map((file) => file.error || t("fileFailed", { name: file.name })).join("; "));
      }
      syncFiles();
    }
    function onError(err: Error | { message?: string }) {
      setIsUploading(false);
      setError(err.message || t("uploadFailed"));
      syncFiles();
    }
    function onUploadError(_file: UploadFile | undefined, err: Error, response?: { body?: UploadBody }) {
      onError(new Error(response?.body?.error || err.message || "Upload failed."));
    }
    function onRestrictionFailed(_file: UploadFile | undefined, err: Error) {
      onError(err);
    }
    function onUploadStalled(err: { message?: string }) {
      setError(err.message || t("uploadSlow"));
    }
    function onCancelAll() {
      setIsUploading(false);
      syncFiles();
    }

    uppy.on("state-update", syncFiles);
    uppy.on("upload", onUpload);
    uppy.on("upload-progress", onProgress);
    uppy.on("upload-success", onUploadSuccess);
    uppy.on("complete", onComplete);
    uppy.on("error", onError);
    uppy.on("upload-error", onUploadError);
    uppy.on("restriction-failed", onRestrictionFailed);
    uppy.on("upload-stalled", onUploadStalled);
    uppy.on("cancel-all", onCancelAll);
    syncFiles();
    return () => {
      if (autoUploadTimerRef.current) {
        window.clearTimeout(autoUploadTimerRef.current);
        autoUploadTimerRef.current = null;
      }
      uppy.off("state-update", syncFiles);
      uppy.off("upload", onUpload);
      uppy.off("upload-progress", onProgress);
      uppy.off("upload-success", onUploadSuccess);
      uppy.off("complete", onComplete);
      uppy.off("error", onError);
      uppy.off("upload-error", onUploadError);
      uppy.off("restriction-failed", onRestrictionFailed);
      uppy.off("upload-stalled", onUploadStalled);
      uppy.off("cancel-all", onCancelAll);
      uppy.cancelAll();
    };
  }, [onUploaded, t, uppy]);

  const upload = useCallback(async () => {
    const currentFiles = uppy.getFiles();
    if (!currentFiles.length) {
      setError(t("selectAtLeastOneImage"));
      return;
    }
    if (isUploading) return;
    setIsUploading(true);
    setStatus("");
    setError("");
    try {
      const result = await Promise.race([
        uppy.upload(),
        new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error(t("uploadTimedOut"))), uploadTimeoutMs + 5000);
        })
      ]);
      if (result?.failed?.length) {
        throw new Error(result.failed.map((file) => file.error || t("fileFailed", { name: file.name })).join("; "));
      }
      if (!result?.successful?.length) {
        throw new Error(t("uploadDidNotFinish"));
      }
    } catch (caught) {
      uppy.cancelAll();
      setError(caught instanceof Error ? caught.message : t("uploadFailed"));
    } finally {
      setIsUploading(false);
      const state = uppy.getState();
      setFiles(Object.values(state.files));
    }
  }, [isUploading, t, uppy]);

  function scheduleAutoUpload() {
    if (autoUploadTimerRef.current) window.clearTimeout(autoUploadTimerRef.current);
    autoUploadTimerRef.current = window.setTimeout(() => {
      autoUploadTimerRef.current = null;
      void upload();
    }, 60);
  }

  function addFiles(fileList: FileList | File[]) {
    setError("");
    setStatus("");
    let added = 0;
    Array.from(fileList).forEach((file) => {
      try {
        uppy.addFile({
          name: file.name,
          type: file.type,
          data: file
        });
        added += 1;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : t("couldNotAddFile"));
      }
    });
    if (added > 0) {
      setStatus(t("uploadStarting"));
      scheduleAutoUpload();
    }
  }

  return (
    <div className="grid gap-3">
      <div
        className={`rounded-xl border border-dashed bg-white p-4 transition ${compact ? "min-h-[170px]" : "min-h-[230px]"} ${
          isDragging ? "border-[#2563eb] bg-[#eff6ff]" : "border-slate-300 hover:border-[#2563eb] hover:bg-slate-50"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          addFiles(event.dataTransfer.files);
        }}
      >
        <div className="flex h-full min-h-[inherit] flex-col items-center justify-center text-center">
          <div className="grid size-12 place-items-center rounded-xl bg-[#eff6ff] text-[#2563eb]">
            <UploadCloud size={22} />
          </div>
          <h3 className="mt-3 text-sm font-black text-slate-900">{t("dropImagesTitle")}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{t("dropImagesHint")}</p>
          <button type="button" className="admin-action mt-3 gap-2 px-3 py-2" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={15} />
            {t("selectImages")}
          </button>
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(event) => {
              if (event.currentTarget.files) addFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </div>

      {files.length ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              {isUploading ? t("uploadingCount", { count: files.length }) : t("readyCount", { count: files.length })}
            </span>
            <button type="button" className="admin-primary gap-2 px-4 py-2" onClick={() => void upload()} disabled={isUploading}>
              {isUploading ? <Loader2 className="animate-spin" size={15} /> : <UploadCloud size={15} />}
              {isUploading ? t("uploading") : t("uploadNow")}
            </button>
            {isUploading ? (
              <button type="button" className="admin-action px-3 py-2" onClick={() => uppy.cancelAll()}>
                {t("cancel")}
              </button>
            ) : null}
          </div>
          <div className="grid gap-2">
            {files.map((file) => <QueuedFileRow key={file.id} file={file} onRemove={() => uppy.removeFile(file.id)} />)}
          </div>
        </div>
      ) : null}

      {status ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          <CheckCircle2 size={15} />
          {status}
        </div>
      ) : null}
      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</div> : null}
    </div>
  );
}

function QueuedFileRow({ file, onRemove }: { file: UploadFile; onRemove: () => void }) {
  const t = useTranslations("orders.ordersPage.detailPage.qcUploader");
  const progress = file.progress as { percentage?: number; uploadComplete?: boolean };
  const percentage = Math.max(0, Math.min(100, Math.round(progress.percentage ?? 0)));
  const complete = Boolean(file.progress.uploadComplete);

  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_120px_auto] sm:items-center">
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-slate-900">{file.name}</div>
        <div className="text-xs font-semibold text-slate-400">{formatSize(file.size ?? 0)} · {file.type || t("imageTypeFallback")}</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-[#2563eb]"}`} style={{ width: `${complete ? 100 : percentage}%` }} />
      </div>
      <button type="button" className="admin-action justify-center gap-2 px-2 py-1" onClick={onRemove} disabled={complete}>
        <Trash2 size={14} />
        {t("remove")}
      </button>
    </div>
  );
}

function formatSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(size / 1024))}KB`;
}

function parseResponseText(text: string) {
  if (!text) return null;
  try {
    return JSON.parse(text) as UploadBody;
  } catch {
    return null;
  }
}
