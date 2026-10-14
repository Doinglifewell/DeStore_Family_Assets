/* Everything you set before running ads lives here, read from Vercel's
   environment variables (Project → Settings → Environment Variables), so
   nothing is changed in code to go live. Copy .env.example for local runs.

   Until a value is set, the page still works:
   - the phone number falls back to a placeholder in ACMA's range reserved for
     drama, which rings nobody, and the page shows a thin banner saying so, so
     ads are never run against a number that can't be answered;
   - no Google tag loads at all. */

export const BRAND = "NT Recoveries";

/* The number every Call button dials. Put your call-tracking number here (a
   number from CallRail, Delacon or similar, or your own mobile). Write it the
   way it should be read: "08 8123 4567" or "0412 345 678". */
const PLACEHOLDER_PHONE = "08 5550 0123";
export const PHONE = (process.env.NEXT_PUBLIC_PHONE || "").trim() || PLACEHOLDER_PHONE;
export const PHONE_IS_PLACEHOLDER = PHONE === PLACEHOLDER_PHONE;
/** The number as a tel: link: +61 and no leading 0, no spaces ("08 8123 4567" → "tel:+61881234567"). */
export const PHONE_TEL = "tel:" + toE164(PHONE);

export function toE164(n: string): string {
  const d = n.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("61")) return "+" + d;
  if (/^(13|18)\d+$/.test(d)) return d;            // 13 / 1300 / 1800 numbers have no +61 form for dialling
  return "+61" + d.replace(/^0/, "");
}

/* Google tags. Leave a value empty and that tag never loads.
   - NEXT_PUBLIC_GA4_ID: the GA4 web stream's Measurement ID, "G-XXXXXXXXXX".
   - NEXT_PUBLIC_ADS_ID: the Google Ads tag ID, "AW-XXXXXXXXXX".
   - NEXT_PUBLIC_ADS_CALL_CLICK_LABEL: the label of a "Phone call leads: clicks on
     your number on your mobile website" conversion (the part after the slash in
     "AW-XXXXXXXXXX/AbCdEfGhIjK"). Fired when somebody taps a Call button.
   - NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL: the label of a "Calls to a phone number on
     your website" conversion. Google then shows a forwarding number in place of
     PHONE to people who came from an ad, and counts the calls it gets. */
export const GA4_ID = (process.env.NEXT_PUBLIC_GA4_ID || "").trim();
export const ADS_ID = (process.env.NEXT_PUBLIC_ADS_ID || "").trim();
export const ADS_CALL_CLICK_LABEL = (process.env.NEXT_PUBLIC_ADS_CALL_CLICK_LABEL || "").trim();
export const ADS_WEBSITE_CALL_LABEL = (process.env.NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL || "").trim();
