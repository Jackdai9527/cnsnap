import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-session";
import { helpUploadPublicUrl, helpUploadStorageRoot } from "@/lib/storage";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.ms-excel", "xls"],
  ["text/csv", "csv"]
]);

export async function POST(request: Request) {
  try {
    await requirePermission("help_articles.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type) || extensionFromName(file.name);
  if (!extension || !isAllowedExtension(extension)) {
    return NextResponse.json({ error: "Only image, xlsx, xls, and csv files are supported." }, { status: 400 });
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be smaller than 8MB." }, { status: 400 });
  }

  const uploadDir = helpUploadStorageRoot();
  await mkdir(uploadDir, { recursive: true });

  const safeBaseName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "file";
  const filename = `${safeBaseName}-${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  const url = helpUploadPublicUrl(filename);
  return NextResponse.json({
    url,
    default: url,
    name: file.name,
    type: file.type,
    size: file.size
  });
}

function extensionFromName(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function isAllowedExtension(extension: string) {
  return ["png", "jpg", "jpeg", "webp", "gif", "svg", "xlsx", "xls", "csv"].includes(extension);
}
