/* The page's one action. A plain tel: link to CALL_NUMBER, so it dials even
   with JavaScript off or a tag blocked. Taps are counted by lib/ntr-track.js,
   which listens on the whole page, so nothing here has to run in the browser.

   No aria-label: the visible words ("Call now" and the number) are the
   button's name, so when a call-tracking script swaps the number on screen,
   a screen reader reads the same new number. Every number on the page sits
   in a [data-number] element; the standalone HTML copy fills them from its
   own CALL_NUMBER. */

import type { ReactNode } from "react";
import { CALL_NUMBER, CALL_TEL } from "@/lib/config";

export function PhoneIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
    </svg>
  );
}

/** The big amber button. "hero": full width with the number in large text. "bar": the sticky bar's. */
export function CallButton({ where, size = "hero" }: { where: string; size?: "hero" | "bar" }) {
  const hero = size === "hero";
  return (
    <a href={CALL_TEL} data-call={where} className={`call-btn w-full ${hero ? "call-btn-hero" : ""}`}>
      <PhoneIcon className={hero ? "h-9 w-9 shrink-0" : "h-7 w-7 shrink-0"} />
      <span className="flex flex-col items-start leading-tight">
        <span className={hero ? "text-[19px] font-bold" : "text-[18px] font-bold"}>Call now</span>
        <span data-number className={hero ? "call-number font-bold tabular-nums" : "text-[19px] font-bold tabular-nums"}>{CALL_NUMBER}</span>
      </span>
    </a>
  );
}

/** A call link in a sentence (the footer): the same number. */
export function CallLink({ where, className = "", children }: { where: string; className?: string; children: ReactNode }) {
  return <a href={CALL_TEL} data-call={where} className={className}>{children}</a>;
}
