/* ─────────────────────────────────────────────────────────────────────────
   WHERE EACH TRACKING PIECE GOES

   1. CALL-TRACKING NUMBER
      Set NEXT_PUBLIC_PHONE (lib/config.ts). Every Call button, the sticky bar
      and the footer read it, so it changes everywhere at once. A provider that
      swaps numbers by script (CallRail, Delacon, Calltrak…) instead: paste its
      snippet in the CALL-TRACKING SCRIPT slot below, and keep PHONE as the
      number its script looks for on the page.

   2. GA4
      Set NEXT_PUBLIC_GA4_ID ("G-…"). Loads gtag.js once and counts page views.
      Every tap on a Call button also sends a "click_to_call" event with where
      it was tapped (hero, sticky, footer). In GA4 → Admin → Events, mark
      click_to_call as a key event.

   3. GOOGLE ADS CONVERSIONS
      Set NEXT_PUBLIC_ADS_ID ("AW-…"), then either or both labels:
      - NEXT_PUBLIC_ADS_CALL_CLICK_LABEL: counts a tap on a Call button as a
        conversion (fired in components/CallButton.tsx).
      - NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL: Google's forwarding number. For
        visitors from an ad, gtag swaps PHONE on the page for a Google number
        and counts real calls (and their length) to it. PHONE must appear on
        the page written exactly as in NEXT_PUBLIC_PHONE, which it does.
      Calls straight from the ad (a call asset) are counted by Google Ads
      itself and need nothing here.

   Nothing loads until its ID is set, so the page stays fast and nothing
   is counted against an account you haven't made yet.
   ───────────────────────────────────────────────────────────────────────── */

import Script from "next/script";
import { ADS_ID, ADS_WEBSITE_CALL_LABEL, GA4_ID, PHONE } from "@/lib/config";

export function Tracking() {
  const ids = [GA4_ID, ADS_ID].filter(Boolean);
  if (!ids.length) return null;
  const config = [
    GA4_ID && `gtag('config', ${JSON.stringify(GA4_ID)});`,
    ADS_ID && `gtag('config', ${JSON.stringify(ADS_ID)});`,
    ADS_ID && ADS_WEBSITE_CALL_LABEL &&
      `gtag('config', ${JSON.stringify(`${ADS_ID}/${ADS_WEBSITE_CALL_LABEL}`)}, { phone_conversion_number: ${JSON.stringify(PHONE)} });`,
  ].filter(Boolean).join("\n");
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ids[0])}`} strategy="afterInteractive" />
      <Script id="gtag-init" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
${config}
`}</Script>
      {/* CALL-TRACKING SCRIPT: a third-party number-swap snippet goes here, e.g.
          <Script src="https://cdn.callrail.com/companies/…/swap.js" strategy="afterInteractive" /> */}
    </>
  );
}
