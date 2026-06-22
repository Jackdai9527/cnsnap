import path from "path";

function normalizeStoragePath(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return defaultStorageRoot();
  return path.isAbsolute(trimmed) ? trimmed : path.join(process.cwd(), trimmed);
}

function defaultStorageRoot() {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "storage");
}

export function storageRoot() {
  return normalizeStoragePath(process.env.STORAGE_ROOT || "");
}

export function uploadStorageRoot() {
  return path.join(storageRoot(), "uploads");
}

export function mediaStorageRoot() {
  return path.join(uploadStorageRoot(), "media");
}

export function helpUploadStorageRoot() {
  return path.join(uploadStorageRoot(), "help");
}

export function uploadPublicBaseUrl() {
  const value = (process.env.UPLOADS_BASE_URL || "/uploads").trim();
  if (!value) return "/uploads";
  return value.startsWith("/") ? value.replace(/\/+$/, "") || "/uploads" : `/${value.replace(/^\/+|\/+$/g, "")}`;
}

export function mediaPublicUrl(year: string, month: string, filename: string) {
  return `${uploadPublicBaseUrl()}/media/${year}/${month}/${filename}`;
}

export function helpUploadPublicUrl(filename: string) {
  return `${uploadPublicBaseUrl()}/help/${filename}`;
}
