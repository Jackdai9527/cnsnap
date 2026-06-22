import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser, inactiveUserMessage, isUserActive } from "@/lib/session";
import { serializeTicketDetail } from "@/lib/account/ticket-records";

type TicketDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: TicketDetailRouteProps) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  if (!isUserActive(user.status)) return NextResponse.json({ error: inactiveUserMessage }, { status: 403 });

  const id = (await params).id;
  const ticket = await prisma.supportTicket.findFirst({
    where: /^\d+$/.test(id)
      ? { id: Number(id), userId: user.id }
      : { ticketNo: id, userId: user.id },
    include: { user: { select: { email: true, name: true } } }
  });

  if (!ticket) return NextResponse.json({ ticket: null }, { status: 404 });
  return NextResponse.json({ ticket: serializeTicketDetail(ticket) });
}
