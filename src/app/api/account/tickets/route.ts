import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, inactiveUserMessage, isUserActive } from "@/lib/session";
import { issueTypeFromTicketFields, relatedRecordValue, serializeTicketListItem } from "@/lib/account/ticket-records";
import { ticketCategories, ticketPriorities, type TicketCategory, type TicketPriority } from "@/types/ticket";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!isUserActive(user.status)) return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 120
  });

  return NextResponse.json({ tickets: tickets.map(serializeTicketListItem) });
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Please sign in before creating a ticket." }, { status: 401 });
    if (!isUserActive(user.status)) return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });

    const body = await request.json() as {
      category?: string;
      priority?: string;
      subject?: string;
      message?: string;
      relatedOrderId?: string;
      relatedPackageId?: string;
    };
    const category = body.category as TicketCategory;
    const priority = body.priority as TicketPriority;
    const subject = body.subject?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!ticketCategories.some((item) => item.value === category)) {
      return NextResponse.json({ error: "Please choose a category." }, { status: 400 });
    }
    if (!ticketPriorities.some((item) => item.value === priority)) {
      return NextResponse.json({ error: "Please choose a priority." }, { status: 400 });
    }
    if (subject.length < 5) {
      return NextResponse.json({ error: "Subject must be at least 5 characters." }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters." }, { status: 400 });
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: "Message must be under 1000 characters." }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNo: ticketNoForNow(new Date()),
        userId: user.id,
        orderOrTrackingNo: relatedRecordValue(body.relatedOrderId, body.relatedPackageId),
        issueType: issueTypeFromTicketFields(category, priority, subject),
        problemDescription: message,
        status: "open"
      }
    });

    revalidatePath("/account/tickets");
    revalidatePath("/admin/tickets");

    return NextResponse.json({ ticket: serializeTicketListItem(ticket) }, { status: 201 });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Unable to create ticket." }, { status: 500 });
  }
}

function ticketNoForNow(now: Date) {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `TK${date}${String(now.getTime()).slice(-6)}`;
}
