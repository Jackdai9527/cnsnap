import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { mediaPublicUrl, mediaStorageRoot, uploadPublicBaseUrl } from "@/lib/storage";

const allowedImageTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"]
]);

const maxImageSize = 12 * 1024 * 1024;

type SaveMediaInput = {
  file: File;
  usage?: string;
  orderId?: number | null;
  packageId?: number | null;
  uploadedBy?: number | null;
  altText?: string | null;
  caption?: string | null;
};

type SerializableMediaAsset = {
  id: number;
  filename: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  usage: string;
  orderId: number | null;
  packageId: number | null;
  createdAt: Date;
  uploader?: { id: number; email: string; name: string | null } | null;
};

export async function saveMediaAsset({
  file,
  usage = "media_library",
  orderId,
  packageId,
  uploadedBy,
  altText,
  caption
}: SaveMediaInput) {
  const extension = allowedImageTypes.get(file.type) || extensionFromName(file.name);
  if (!extension || !isAllowedImageExtension(extension)) {
    throw new Error("Only PNG, JPG, WebP, and GIF images are supported.");
  }

  if (file.size > maxImageSize) {
    throw new Error("Image must be smaller than 12MB.");
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const uploadDir = path.join(mediaRoot(), year, month);
  await mkdir(uploadDir, { recursive: true });

  const safeBaseName = safeFilename(file.name.replace(/\.[^.]+$/, ""));
  const filename = `${safeBaseName}-${randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;
  const absolutePath = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes);

  const relativePath = path.relative(process.cwd(), absolutePath).split(path.sep).join("/");
  const url = mediaPublicUrl(year, month, filename);

  return prisma.mediaAsset.create({
    data: {
      filename,
      originalName: file.name,
      url,
      path: relativePath,
      mimeType: file.type || mimeTypeFromExtension(extension),
      size: file.size,
      usage: normalizeUsage(usage),
      orderId: orderId || null,
      packageId: packageId || null,
      uploadedBy: uploadedBy || null,
      altText: altText?.trim() || null,
      caption: caption?.trim() || null
    },
    include: { uploader: { select: { id: true, email: true, name: true } } }
  });
}

export async function deleteMediaAsset(id: number) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return null;

  await prisma.mediaAsset.delete({ where: { id } });

  const absolutePath = mediaAbsolutePathFromUrl(asset.url);
  const root = mediaRoot();
  if (absolutePath.startsWith(root + path.sep)) {
    await unlink(absolutePath).catch(() => undefined);
  }

  return asset;
}

export function serializeMediaAsset(asset: SerializableMediaAsset) {
  return {
    id: asset.id,
    filename: asset.filename,
    originalName: asset.originalName,
    url: asset.url,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    altText: asset.altText,
    caption: asset.caption,
    usage: asset.usage,
    orderId: asset.orderId,
    packageId: asset.packageId,
    createdAt: asset.createdAt.toISOString(),
    uploader: asset.uploader
  };
}

export function normalizeUsage(value?: string | null) {
  const usage = (value || "media_library").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  return usage || "media_library";
}

export function parseOptionalId(value: FormDataEntryValue | string | null | undefined) {
  const id = Number(value || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function mediaRoot() {
  return mediaStorageRoot();
}

function mediaAbsolutePathFromUrl(url: string) {
  const mediaBase = `${uploadPublicBaseUrl()}/media`;
  const mediaPath = url.replace(new RegExp(`^${escapeForRegex(mediaBase)}/?`), "");
  return path.join(mediaRoot(), ...mediaPath.split("/").filter(Boolean));
}

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeFilename(value: string) {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "image";
}

function extensionFromName(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function isAllowedImageExtension(extension: string) {
  return ["png", "jpg", "jpeg", "webp", "gif"].includes(extension.toLowerCase());
}

function mimeTypeFromExtension(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}
