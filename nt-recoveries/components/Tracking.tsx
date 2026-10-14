/* ─────────────────────────────────────────────────────────────────────────
   WHERE EACH TRACKING PIECE GOES

   1. THE CALL-TRACKING NUMBER
      CALL_NUMBER in lib/config.ts (the one place it lives). Every Call
      button, the sticky bar and the footer read it. It routes to the partner
      tow operator; the page never names them.

   2. THE CALL-TRACKING PROVIDER'S NUMBER SWAP (dynamic number insertion)
      Set NEXT_PUBLIC_DNI_SCRIPT_URL to the https address of the provider's
      script (CallRail, Delacon, CallTrackingMetrics, Calltrak…). It loads on
      every visit and swaps CALL_NUMBER on the page for a tracking number per
      visitor or per ad. In the provider's settings, the number to replace is
      CALL_NUMBER exactly as written in lib/config.ts. A provider that gives
      a snippet rather than one script address: paste it in the DNI SNIPPET
      slot below instead.

   3. GA4
      Set NEXT_PUBLIC_GA4_ID ("G-…"). Loads gtag.js once and counts page
      views. Every tap on a tel: link sends a "click_to_call" event saying
      where it was tapped (hero, sticky, footer). In GA4 → Admin → Events,
      mark click_to_call as a key event.

   4. GOOGLE ADS CONVERSIONS
      Set NEXT_PUBLIC_ADS_ID ("AW-…") and NEXT_PUBLIC_ADS_CALL_CLICK_LABEL:
      every tap on a tel: link fires that conversion.
      NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL (optional) is Google's own
      forwarding number, which counts real calls; it is left off while a
      call-tracking script is set, because two scripts swapping one number
      fight. Import the provider's calls into Google Ads instead.
      Calls straight from the ad (a call asset) are counted by Google Ads
      itself and need nothing here.

   Taps on "Call 000" are never counted. Placeholder IDs (G-XXXXXXXXXX…)
   count as unset, and with nothing set no script is added at all, so the
   page stays fast and sends nothing anywhere.

   The code that does all of it is lib/ntr-track.js, shared with the
   standalone nt-recoveries.html so the two can't drift.
   ───────────────────────────────────────────────────────────────────────── */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ADS_CALL_CLICK_LABEL, ADS_ID, ADS_WEBSITE_CALL_LABEL, DNI_SCRIPT_URL, GA4_ID } from "@/lib/config";

/* Read at build time: the page is static, so this runs once, on the build machine. */
const RUNTIME = readFileSync(join(process.cwd(), "lib/ntr-track.js"), "utf8");

export function Tracking() {
  if (!GA4_ID && !ADS_ID && !DNI_SCRIPT_URL) return null;
  const cfg = { ga4: GA4_ID, ads: ADS_ID, adsCallLabel: ADS_CALL_CLICK_LABEL, adsWebsiteLabel: ADS_WEBSITE_CALL_LABEL, dni: DNI_SCRIPT_URL };
  // "<" escaped so nothing in a value can close the script tag.
  const code = `window.NTR=${JSON.stringify(cfg).replace(/</g, "\\u003c")};\n${RUNTIME}`;
  return (
    <>
      {/* A plain inline script, at the end of <body>: it runs as the page is
          read, before any tap, without waiting for React. */}
      <script id="ntr-track" dangerouslySetInnerHTML={{ __html: code }} />
      {/* DNI SNIPPET: a provider snippet that is more than one script address
          goes here, e.g. <script dangerouslySetInnerHTML={{ __html: `…` }} /> */}
    </>
  );
}
