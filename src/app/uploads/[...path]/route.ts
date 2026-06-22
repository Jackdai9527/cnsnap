import { existsSync } from "fs";
import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { uploadStorageRoot } from "@/lib/storage";

const contentTypes = new Map([
  ["png", "image/png"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["gif", "image/gif"],
  ["svg", "image/svg+xml"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["xls", "application/vnd.ms-excel"],
  ["csv", "text/csv"]
]);

export async function GET(_: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts = [] } = await context.params;
  if (!parts.length) {
    return new NextResponse("Not found", { status: 404 });
  }

  const root = uploadStorageRoot();
  const filePath = path.join(root, ...parts);
  const normalizedRoot = `${root}${path.sep}`;
  const normalizedFilePath = path.normalize(filePath);

  if (!normalizedFilePath.startsWith(normalizedRoot) && normalizedFilePath !== root) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  if (!existsSync(normalizedFilePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileStat = await stat(normalizedFilePath);
  if (!fileStat.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const extension = path.extname(normalizedFilePath).slice(1).toLowerCase();
  const contentType = contentTypes.get(extension) || "application/octet-stream";
  const body = await readFile(normalizedFilePath);

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(fileStat.size),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
