"use client";

import { ArrowLeft } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { UserActionForm } from "@/components/user/UserActionForm";
import { createSupportTicket } from "@/app/user/actions";

const issueTypes = [
  "Klarna Payment Issue",
  "International Logistics",
  "Not Shipped",
  "Not Packed",
  "Cannot Submit Parcel",
  "Parcel Weight/Volume",
  "Payment Failed",
  "Shipping Info Change",
  "Parcel Missing Items",
  "Coupon & Activity Issue",
  "Purchase Failed Order",
  "Rush Shipment",
  "Rush Warehouse",
  "Not Listed",
  "QC Photo"
];

export function TicketCreateModal() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    window.setTimeout(() => setMounted(true), 0);
  }, []);

  useEffect(() => {
    function syncOpen() {
      setOpen(window.location.hash === "#ticket-create");
    }

    function openFromTrigger(event: MouseEvent) {
      const target = event.target as Element | null;
      const trigger = target?.closest('a[href="#ticket-create"]');
      if (!trigger) return;
      event.preventDefault();
      window.history.pushState(null, "", "#ticket-create");
      setOpen(true);
    }

    syncOpen();
    document.addEventListener("click", openFromTrigger, true);
    window.addEventListener("hashchange", syncOpen);
    window.addEventListener("popstate", syncOpen);
    return () => {
      document.removeEventListener("click", openFromTrigger, true);
      window.removeEventListener("hashchange", syncOpen);
      window.removeEventListener("popstate", syncOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (!mounted) return null;

  function close() {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setOpen(false);
  }

  return createPortal(
    <section id="ticket-create" className={`ticket-container fixed inset-0 z-[1000] items-start justify-center overflow-y-auto bg-slate-950/45 px-4 py-8 backdrop-blur-sm ${open ? "flex" : "hidden"}`}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close ticket form" onClick={close} />
      <div className="relative z-10 mt-4 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,0.22)] md:mt-8">
        <button type="button" onClick={close} className="back-btn inline-flex items-center gap-2 text-sm font-bold text-[#667085] hover:text-[#2563eb]"><ArrowLeft size={16} /> Back</button>
        <div className="page-title mt-4 font-display text-4xl font-black text-[#101828]">Create</div>
        <UserActionForm action={createSupportTicket} className="form-wrapper mt-6 grid gap-5" submitLabel="Submit">
          <label className="form-row grid gap-2">
            <span className="form-label text-sm font-extrabold text-[#101828]"><span className="required text-[#d9142f]">*</span>Order / Tracking No</span>
            <input name="orderOrTrackingNo" required placeholder="Order No(K) / Tracking No(Y)" className="input" />
          </label>
          <label className="form-row grid gap-2">
            <span className="form-label text-sm font-extrabold text-[#101828]"><span className="required text-[#d9142f]">*</span>Issue Type</span>
            <select name="issueType" required defaultValue="" className="input">
              <option value="" disabled>Select</option>
              {issueTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="form-row align-start grid gap-2">
            <span className="form-label text-sm font-extrabold text-[#101828]"><span className="required text-[#d9142f]">*</span>Problem Description</span>
            <textarea
              name="problemDescription"
              required
              maxLength={1000}
              placeholder="Please describe your issue and request in detail so we can resolve it quickly."
              className="input min-h-40"
            />
          </label>
        </UserActionForm>
      </div>
    </section>,
    document.body
  );
}
