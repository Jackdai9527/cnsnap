import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { parseOptionalId, saveMediaAsset, serializeMediaAsset } from "@/lib/media-assets";
import { prisma } from "@/lib/db";
import { requireAdmin, requirePermission } from "@/lib/admin-session";

export async function GET(request: Request) {
  try {
    await requirePermission("media_library.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const usage = searchParams.get("usage")?.trim();
  const orderId = Number(searchParams.get("orderId") || 0);
  const packageId = Number(searchParams.get("packageId") || 0);
  const mime = searchParams.get("mime")?.trim();
  const take = Math.min(120, Math.max(1, Number(searchParams.get("take") || 60)));

  const where: Prisma.MediaAssetWhereInput = {};
  if (q) {
    where.OR = [
      { originalName: { contains: q } },
      { filename: { contains: q } },
      { altText: { contains: q } },
      { caption: { contains: q } },
      { url: { contains: q } }
    ];
  }
  if (usage && usage !== "all") where.usage = usage;
  if (orderId > 0) where.orderId = orderId;
  if (packageId > 0) where.packageId = packageId;
  if (mime === "image") where.mimeType = { startsWith: "image/" };

  const assets = await prisma.mediaAsset.findMany({
    where,
    include: { uploader: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take
  });

  return NextResponse.json({ assets: assets.map(serializeMediaAsset) });
}

export async function POST(request: Request) {
  let admin: Awaited<ReturnType<typeof requireAdmin>>;
  try {
    admin = await requirePermission("media_library.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const usage = String(formData.get("usage") || "media_library");
    const orderId = parseOptionalId(formData.get("orderId"));
    const packageId = parseOptionalId(formData.get("packageId"));

    if (usage === "qc_photo" && orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNo: true,
          purchaseStatus: true,
          warehouseStatus: true,
          orderStatus: true,
          status: true,
          warehouseReceivedAt: true
        }
      });

      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 404 });
      }

      if (!["purchased", "partial_purchased"].includes(order.purchaseStatus)) {
        return NextResponse.json({ error: "QC photos can only be uploaded after the order has been purchased and sent to the warehouse." }, { status: 400 });
      }
    }

    const asset = await saveMediaAsset({
      file,
      usage,
      orderId,
      packageId,
      uploadedBy: admin.id,
      altText: String(formData.get("altText") || ""),
      caption: String(formData.get("caption") || "")
    });

    if (usage === "qc_photo" && orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          warehouseStatus: true,
          orderStatus: true,
          status: true,
          warehouseReceivedAt: true
        }
      });

      if (existingOrder && existingOrder.warehouseStatus !== "received") {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            warehouseStatus: "received",
            orderStatus: existingOrder.orderStatus === "purchased" ? "warehouse_received" : existingOrder.orderStatus,
            status: existingOrder.status === "purchased" || existingOrder.status === "warehouse_pending" ? "warehouse_received" : existingOrder.status,
            warehouseReceivedAt: existingOrder.warehouseReceivedAt ?? new Date(),
            logs: {
              create: {
                actorId: admin.id,
                action: "warehouse_qc_uploaded",
                detail: "QC photos uploaded and warehouse status synchronized to received."
              }
            }
          }
        });
      }
    }
    const serialized = serializeMediaAsset(asset);

    return NextResponse.json({
      ...serialized,
      url: serialized.url,
      default: serialized.url,
      asset: serialized
    });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Upload failed." }, { status: 400 });
  }
}
