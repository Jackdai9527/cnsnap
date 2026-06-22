export type TicketCategory =
  | "order"
  | "package"
  | "shipping"
  | "payment"
  | "recharge"
  | "refund"
  | "diy_order"
  | "account"
  | "affiliate"
  | "other";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketStatus = "open" | "pending" | "replied" | "resolved" | "closed";

export type TicketSenderType = "user" | "admin" | "system";

export type TicketListItem = {
  id: string;
  ticketNo: string;
  subject: string;
  category: TicketCategory;
  relatedOrderNo?: string;
  relatedPackageNo?: string;
  priority: TicketPriority;
  status: TicketStatus;
  lastReplyAt?: string;
  createdAt: string;
};

export type TicketMessage = {
  id: string;
  ticketId: string;
  senderType: TicketSenderType;
  senderName: string;
  content: string;
  attachments: string[];
  createdAt: string;
};

export type TicketDetail = TicketListItem & {
  messages: TicketMessage[];
};

export const ticketCategories: Array<{ value: TicketCategory; label: string }> = [
  { value: "order", label: "Order" },
  { value: "package", label: "Package" },
  { value: "shipping", label: "Shipping" },
  { value: "payment", label: "Payment" },
  { value: "recharge", label: "Recharge" },
  { value: "refund", label: "Refund" },
  { value: "diy_order", label: "DIY Order" },
  { value: "account", label: "Account" },
  { value: "affiliate", label: "Affiliate" },
  { value: "other", label: "Other" }
];

export const ticketPriorities: Array<{ value: TicketPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" }
];

export const ticketStatuses: Array<{ value: TicketStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "replied", label: "Replied" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" }
];

export function ticketCategoryLabel(category: TicketCategory) {
  return ticketCategories.find((item) => item.value === category)?.label ?? category;
}
