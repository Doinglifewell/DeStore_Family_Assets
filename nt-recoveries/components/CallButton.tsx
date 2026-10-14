"use client";
/* The page's one action. A plain tel: link, so it dials even with JavaScript
   off or a tag blocked; the tap is counted on the way out (GA4 "click_to_call"
   and the Google Ads click conversion), never in the way of the call. */

import type { ReactNode } from "react";
import { ADS_CALL_CLICK_LABEL, ADS_ID, PHONE, PHONE_TEL } from "@/lib/config";

type Gtag = (...args: unknown[]) => void;

export function countCall(where: string) {
  const g = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof g !== "function") return;
  try {
    g("event", "click_to_call", { link_location: where, transport_type: "beacon" });
    if (ADS_ID && ADS_CALL_CLICK_LABEL) g("event", "conversion", { send_to: `${ADS_ID}/${ADS_CALL_CLICK_LABEL}`, transport_type: "beacon" });
  } catch { /* a tag that throws never stops the call */ }
}

export function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

/** The big amber button: "Call now" and the number, dialling PHONE. */
export function CallButton({ where, children, className = "" }: { where: string; children?: ReactNode; className?: string }) {
  return (
    <a href={PHONE_TEL} onClick={() => countCall(where)} data-call={where}
      className={`call-btn ${className}`} aria-label={`Call ${PHONE}`}>
      <PhoneIcon className="h-7 w-7 shrink-0" />
      {children ?? (
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[20px] font-bold">Call now</span>
          <span className="text-[17px] font-semibold tabular-nums">{PHONE}</span>
        </span>
      )}
    </a>
  );
}

/** A call link in a sentence (the footer): the same number, counted the same way. */
export function CallLink({ where, className = "", children }: { where: string; className?: string; children: ReactNode }) {
  return <a href={PHONE_TEL} onClick={() => countCall(where)} data-call={where} className={className}>{children}</a>;
}
