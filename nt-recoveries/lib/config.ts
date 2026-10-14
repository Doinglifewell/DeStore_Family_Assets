/* Everything you set before running ads lives here.

   - CALL_NUMBER, below, is the ONE place the phone number lives. Every Call
     button, the sticky bar, the footer and Google's forwarding-number setup
     read it. Swap the placeholder for the call-tracking number that routes to
     the partner tow operator. (Setting NEXT_PUBLIC_CALL_NUMBER on Vercel
     overrides it without a code change.)
   - The Google tags and the call-tracking script are read from Vercel's
     environment variables (Project → Settings → Environment Variables).
     .env.example lists them with placeholder IDs; a placeholder (all X's) or
     an empty value means that tag never loads.

   Until the number is swapped the page still works, and shows a thin banner
   saying the number is a placeholder, so ads are never run against it. */

export const BRAND = "NT Recoveries";

/** The placeholder, kept so the page can tell it is still in place. */
export const PLACEHOLDER_NUMBER = "0400 000 000";

/* ↓ THE NUMBER. Write it the way it should be read: "0412 345 678" or
     "08 8123 4567". It is shown in large text and dialled as written. */
export const CALL_NUMBER = trim(process.env.NEXT_PUBLIC_CALL_NUMBER) || "0400 000 000";

export const CALL_NUMBER_IS_PLACEHOLDER = digits(CALL_NUMBER) === digits(PLACEHOLDER_NUMBER);
/** CALL_NUMBER as a tel: link: +61 and no leading 0, no spaces ("0412 345 678" → "tel:+61412345678"). */
export const CALL_TEL = "tel:" + toE164(CALL_NUMBER);

export function toE164(n: string): string {
  const d = n.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("61")) return "+" + d;
  if (/^(13|18)\d+$/.test(d)) return d;            // 13 / 1300 / 1800 numbers have no +61 form for dialling
  return "+61" + d.replace(/^0/, "");
}

/* Google tags and call tracking (environment variables, placeholders in .env.example):
   - NEXT_PUBLIC_GA4_ID: the GA4 web stream's Measurement ID, "G-…".
   - NEXT_PUBLIC_ADS_ID: the Google Ads tag ID, "AW-…".
   - NEXT_PUBLIC_ADS_CALL_CLICK_LABEL: the label of the Ads conversion fired on
     every tap of a tel: link to CALL_NUMBER (the part after the slash in
     "AW-…/AbCdEfGhIjK").
   - NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL: optional. Google's own forwarding
     number ("Calls to a phone number on your website"). Ignored while a
     call-tracking script is set: two scripts swapping one number fight.
   - NEXT_PUBLIC_DNI_SCRIPT_URL: the call-tracking provider's dynamic number
     insertion script (https). It swaps CALL_NUMBER on the page for its own
     tracking numbers. */
/* Each written out in full: Next only fills in a NEXT_PUBLIC_ value it can see by name. */
export const GA4_ID = realId(trim(process.env.NEXT_PUBLIC_GA4_ID));
export const ADS_ID = realId(trim(process.env.NEXT_PUBLIC_ADS_ID));
export const ADS_CALL_CLICK_LABEL = realId(trim(process.env.NEXT_PUBLIC_ADS_CALL_CLICK_LABEL));
export const ADS_WEBSITE_CALL_LABEL = realId(trim(process.env.NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL));
const dni = trim(process.env.NEXT_PUBLIC_DNI_SCRIPT_URL);
export const DNI_SCRIPT_URL = /^https:\/\/\S+$/.test(dni) ? dni : "";

function trim(v: string | undefined): string {
  return (v || "").trim();
}
/** An ID, or "" while it is empty or still the placeholder (G-XXXXXXXXXX, AW-XXXXXXXXXX, XXXXXXXXXXX). */
export function realId(v: string): string {
  return v && !/^(?:G-|AW-)?X+$/i.test(v) ? v : "";
}
function digits(s: string): string {
  return s.replace(/\D/g, "");
}
