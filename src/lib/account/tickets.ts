import type { TicketDetail, TicketListItem } from "@/types/ticket";

export const mockTickets: TicketDetail[] = [
  {
    id: "T-1001",
    ticketNo: "TK-20260612-1001",
    subject: "Please confirm the color before purchasing",
    category: "order",
    relatedOrderNo: "CN10041",
    priority: "normal",
    status: "open",
    createdAt: "2026-06-12 17:05",
    lastReplyAt: "2026-06-12 17:05",
    messages: [
      {
        id: "MSG-1001-1",
        ticketId: "T-1001",
        senderType: "user",
        senderName: "Jack Chen",
        content: "The seller listing shows two similar black colors. Please ask the seller to confirm the shirt color before purchasing.",
        attachments: ["https://picsum.photos/seed/ticket-color-check/640/420"],
        createdAt: "2026-06-12 17:05"
      }
    ]
  },
  {
    id: "T-1002",
    ticketNo: "TK-20260612-1002",
    subject: "Package shipping fee looks higher than expected",
    category: "package",
    relatedOrderNo: "CN10038",
    relatedPackageNo: "PK2038",
    priority: "high",
    status: "pending",
    createdAt: "2026-06-12 12:18",
    lastReplyAt: "2026-06-12 14:22",
    messages: [
      {
        id: "MSG-1002-1",
        ticketId: "T-1002",
        senderType: "user",
        senderName: "Jack Chen",
        content: "The package is only one pair of sneakers. Could you verify the chargeable weight and dimensions before I pay shipping?",
        attachments: [],
        createdAt: "2026-06-12 12:18"
      },
      {
        id: "MSG-1002-2",
        ticketId: "T-1002",
        senderType: "admin",
        senderName: "CNSnap Support",
        content: "We have asked the warehouse to remeasure the package. The ticket is pending warehouse confirmation.",
        attachments: [],
        createdAt: "2026-06-12 14:22"
      }
    ]
  },
  {
    id: "T-1003",
    ticketNo: "TK-20260611-1003",
    subject: "ONLYPAY card payment shows pending",
    category: "payment",
    relatedOrderNo: "CN10038",
    priority: "normal",
    status: "replied",
    createdAt: "2026-06-11 20:34",
    lastReplyAt: "2026-06-12 09:16",
    messages: [
      {
        id: "MSG-1003-1",
        ticketId: "T-1003",
        senderType: "user",
        senderName: "Jack Chen",
        content: "My card payment was submitted, but the order still says partially paid. Can you check the gateway result?",
        attachments: [],
        createdAt: "2026-06-11 20:34"
      },
      {
        id: "MSG-1003-2",
        ticketId: "T-1003",
        senderType: "admin",
        senderName: "Finance Desk",
        content: "The card payment was captured successfully. We updated the payment record and left the shipping balance open.",
        attachments: [],
        createdAt: "2026-06-12 09:16"
      }
    ]
  },
  {
    id: "T-1004",
    ticketNo: "TK-20260609-1004",
    subject: "Refund for seller price adjustment",
    category: "refund",
    relatedOrderNo: "CN10018",
    priority: "low",
    status: "resolved",
    createdAt: "2026-06-09 10:02",
    lastReplyAt: "2026-06-10 11:40",
    messages: [
      {
        id: "MSG-1004-1",
        ticketId: "T-1004",
        senderType: "user",
        senderName: "Jack Chen",
        content: "The seller reduced the final product price. Please refund the difference to my wallet.",
        attachments: [],
        createdAt: "2026-06-09 10:02"
      },
      {
        id: "MSG-1004-2",
        ticketId: "T-1004",
        senderType: "admin",
        senderName: "CNSnap Support",
        content: "Refund completed. The adjustment appears in your wallet transaction list.",
        attachments: [],
        createdAt: "2026-06-10 11:40"
      },
      {
        id: "MSG-1004-3",
        ticketId: "T-1004",
        senderType: "system",
        senderName: "System",
        content: "Ticket marked as resolved by support.",
        attachments: [],
        createdAt: "2026-06-10 11:41"
      }
    ]
  },
  {
    id: "T-1005",
    ticketNo: "TK-20260605-1005",
    subject: "Change account contact email",
    category: "account",
    priority: "normal",
    status: "closed",
    createdAt: "2026-06-05 08:45",
    lastReplyAt: "2026-06-05 16:20",
    messages: [
      {
        id: "MSG-1005-1",
        ticketId: "T-1005",
        senderType: "user",
        senderName: "Jack Chen",
        content: "I need to update the contact email used for order notifications.",
        attachments: [],
        createdAt: "2026-06-05 08:45"
      },
      {
        id: "MSG-1005-2",
        ticketId: "T-1005",
        senderType: "admin",
        senderName: "Account Desk",
        content: "The account contact email was updated after verification. This ticket is now closed.",
        attachments: [],
        createdAt: "2026-06-05 16:20"
      }
    ]
  },
  {
    id: "T-1006",
    ticketNo: "TK-20260613-1006",
    subject: "Tracking stopped after airline handover",
    category: "shipping",
    relatedPackageNo: "PK2022",
    priority: "urgent",
    status: "open",
    createdAt: "2026-06-13 09:28",
    lastReplyAt: "2026-06-13 09:28",
    messages: [
      {
        id: "MSG-1006-1",
        ticketId: "T-1006",
        senderType: "user",
        senderName: "Jack Chen",
        content: "Tracking has not moved since airline handover. Please check whether the parcel needs a carrier inquiry.",
        attachments: ["https://picsum.photos/seed/ticket-logistics/640/420"],
        createdAt: "2026-06-13 09:28"
      }
    ]
  }
];

export function listMockTickets(): TicketListItem[] {
  return mockTickets.map((ticket) => ({
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    subject: ticket.subject,
    category: ticket.category,
    relatedOrderNo: ticket.relatedOrderNo,
    relatedPackageNo: ticket.relatedPackageNo,
    priority: ticket.priority,
    status: ticket.status,
    lastReplyAt: ticket.lastReplyAt,
    createdAt: ticket.createdAt
  }));
}

export function findMockTicket(id: string) {
  return mockTickets.find((ticket) => ticket.id === id || ticket.ticketNo === id);
}
