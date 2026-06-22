import type { SupportTicket, User } from "@prisma/client";
import type { TicketCategory, TicketDetail, TicketListItem, TicketMessage, TicketPriority, TicketStatus } from "@/types/ticket";

type SupportTicketWithUser = SupportTicket & {
  user?: Pick<User, "email" | "name"> | null;
};

const validCategories: TicketCategory[] = ["order", "package", "shipping", "payment", "recharge", "refund", "diy_order", "account", "affiliate", "other"];
const validPriorities: TicketPriority[] = ["low", "normal", "high", "urgent"];
const validStatuses: TicketStatus[] = ["open", "pending", "replied", "resolved", "closed"];

export function issueTypeFromTicketFields(category: TicketCategory, priority: TicketPriority, subject: string) {
  return JSON.stringify({ category, priority, subject });
}

export function parseTicketIssueType(issueType: string): { category: TicketCategory; priority: TicketPriority; subject: string } {
  try {
    const parsed = JSON.parse(issueType) as Partial<{ category: string; priority: string; subject: string }>;
    const category = validCategories.includes(parsed.category as TicketCategory) ? parsed.category as TicketCategory : "other";
    const priority = validPriorities.includes(parsed.priority as TicketPriority) ? parsed.priority as TicketPriority : "normal";
    return {
      category,
      priority,
      subject: parsed.subject?.trim() || categoryLabel(category)
    };
  } catch {
    return {
      category: inferCategory(issueType),
      priority: "normal",
      subject: issueType || "Support request"
    };
  }
}

export function normalizeTicketStatus(status: string): TicketStatus {
  if (validStatuses.includes(status as TicketStatus)) return status as TicketStatus;
  if (status === "in_progress") return "pending";
  if (status === "waiting_user") return "replied";
  return "open";
}

export function serializeTicketListItem(ticket: SupportTicketWithUser): TicketListItem {
  const issue = parseTicketIssueType(ticket.issueType);
  const related = parseRelatedRecord(ticket.orderOrTrackingNo);
  return {
    id: String(ticket.id),
    ticketNo: ticket.ticketNo,
    subject: issue.subject,
    category: issue.category,
    relatedOrderNo: related.orderNo,
    relatedPackageNo: related.packageNo,
    priority: issue.priority,
    status: normalizeTicketStatus(ticket.status),
    lastReplyAt: ticket.repliedAt ? formatTicketDate(ticket.repliedAt) : undefined,
    createdAt: formatTicketDate(ticket.createdAt)
  };
}

export function serializeTicketDetail(ticket: SupportTicketWithUser): TicketDetail {
  const listItem = serializeTicketListItem(ticket);
  const messages: TicketMessage[] = [
    {
      id: `${ticket.id}-user`,
      ticketId: String(ticket.id),
      senderType: "user" as const,
      senderName: ticket.user?.name || ticket.user?.email || "Customer",
      content: ticket.problemDescription,
      attachments: [],
      createdAt: formatTicketDate(ticket.createdAt)
    }
  ];

  if (ticket.adminReply) {
    messages.push({
      id: `${ticket.id}-admin`,
      ticketId: String(ticket.id),
      senderType: "admin" as const,
      senderName: "CNSnap Support",
      content: ticket.adminReply,
      attachments: [],
      createdAt: formatTicketDate(ticket.repliedAt ?? ticket.updatedAt)
    });
  }

  return {
    ...listItem,
    messages
  };
}

export function relatedRecordValue(orderId?: string, packageId?: string) {
  const order = orderId?.trim();
  const pkg = packageId?.trim();
  if (order && pkg) return `Order: ${order} / Package: ${pkg}`;
  if (order) return order;
  if (pkg) return pkg;
  return "General support";
}

function parseRelatedRecord(value: string) {
  const orderMatch = value.match(/(?:Order:\s*)?([A-Z]{0,4}\d{2,})/i);
  const packageMatch = value.match(/(?:Package:\s*)?(PK\d+|\d+)/i);
  const hasPackageHint = /package|tracking|parcel|PK/i.test(value);

  if (value.includes(" / ")) {
    const [orderPart, packagePart] = value.split(" / ");
    return {
      orderNo: orderPart.replace(/^Order:\s*/i, "").trim() || undefined,
      packageNo: packagePart.replace(/^Package:\s*/i, "").trim() || undefined
    };
  }

  if (hasPackageHint && packageMatch) {
    return { orderNo: undefined, packageNo: packageMatch[1] };
  }
  return { orderNo: orderMatch?.[1], packageNo: undefined };
}

function inferCategory(issueType: string): TicketCategory {
  const value = issueType.toLowerCase();
  if (value.includes("package") || value.includes("parcel") || value.includes("tracking")) return "package";
  if (value.includes("shipping") || value.includes("logistics")) return "shipping";
  if (value.includes("payment") || value.includes("klarna") || value.includes("card")) return "payment";
  if (value.includes("refund")) return "refund";
  if (value.includes("account") || value.includes("email")) return "account";
  if (value.includes("order") || value.includes("purchase")) return "order";
  return "other";
}

function categoryLabel(category: TicketCategory) {
  return category.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTicketDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
