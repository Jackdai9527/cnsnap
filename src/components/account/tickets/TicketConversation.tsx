import Image from "next/image";
import { Bot, Headphones, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketMessage } from "@/types/ticket";

function senderIcon(senderType: TicketMessage["senderType"]) {
  if (senderType === "admin") return <Headphones className="size-4" />;
  if (senderType === "system") return <Bot className="size-4" />;
  return <UserRound className="size-4" />;
}

export function TicketConversation({ messages }: { messages: TicketMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isUser = message.senderType === "user";
        const isSystem = message.senderType === "system";
        return (
          <article key={message.id} className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
            {!isUser ? (
              <div className={cn("mt-1 grid size-9 shrink-0 place-items-center rounded-full", isSystem ? "bg-slate-100 text-slate-500" : "bg-sky-50 text-sky-600")}>
                {senderIcon(message.senderType)}
              </div>
            ) : null}
            <div className={cn("max-w-[760px] rounded-3xl border p-4", isUser ? "border-pink-100 bg-pink-50/70" : isSystem ? "border-slate-200 bg-slate-50" : "border-sky-100 bg-white")}>
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-black text-slate-950">{message.senderName}</div>
                <div className="text-xs font-semibold text-slate-400">{message.createdAt}</div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{message.content}</p>
              {message.attachments.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.attachments.map((attachment) => (
                    <a key={attachment} href={attachment} target="_blank" rel="noreferrer" className="relative block size-20 overflow-hidden rounded-2xl border border-white bg-slate-100 shadow-sm">
                      <Image src={attachment} alt="Ticket attachment" fill sizes="80px" className="object-cover" />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            {isUser ? (
              <div className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-600">
                {senderIcon(message.senderType)}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
