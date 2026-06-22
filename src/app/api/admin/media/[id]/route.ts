import { NextResponse } from "next/server";
import { deleteMediaAsset, serializeMediaAsset } from "@/lib/media-assets";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin-session";

type MediaRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: MediaRouteProps) {
  try {
    await requirePermission("media_library.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid media id." }, { status: 400 });

  try {
    const body = await request.json() as { altText?: string; caption?: string; usage?: string };
    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: {
        altText: body.altText?.trim() || null,
        caption: body.caption?.trim() || null,
        usage: body.usage?.trim() || undefined
      },
      include: { uploader: { select: { id: true, email: true, name: true } } }
    });
    return NextResponse.json({ asset: serializeMediaAsset(asset) });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Update failed." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: MediaRouteProps) {
  try {
    await requirePermission("media_library.manage");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number((await params).id);
  if (!id) return NextResponse.json({ error: "Invalid media id." }, { status: 400 });

  try {
    const asset = await deleteMediaAsset(id);
    if (!asset) return NextResponse.json({ error: "Media asset not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Delete failed." }, { status: 400 });
  }
}
