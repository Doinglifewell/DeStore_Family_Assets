/* Makes nt-recoveries.html, the standalone copy of the page, from the Next
   build itself, so the two can't drift: the same markup, the same compiled
   styles, the same tracking code (lib/ntr-track.js). Inter is embedded, so
   the file needs nothing else to look right.

   npm run html                      builds, then writes nt-recoveries.html
   node scripts/make-html.mjs --from <distDir> --out <file>
                                     from a build that already exists (the tests use this)

   Re-run it after any change to the page. tests/landing.test.mjs fails while
   the committed file differs from what this makes. */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : ""; };

export function makeHtml(dist) {
  let html = readFileSync(join(dist, "server/app/index.html"), "utf8");
  const config = readFileSync(join(root, "lib/config.ts"), "utf8");
  const placeholder = (config.match(/PLACEHOLDER_NUMBER = "([^"]+)"/) || [])[1];
  if (!placeholder) throw new Error("PLACEHOLDER_NUMBER not found in lib/config.ts");

  // The stylesheet, inlined, with the one font file the page uses (latin) embedded.
  const cssHref = (html.match(/<link rel="stylesheet" href="\/_next\/([^"]+\.css)"[^>]*>/) || [])[1];
  const fontHref = (html.match(/<link rel="preload" href="\/_next\/(static\/media\/[^"]+\.woff2)" as="font"[^>]*>/) || [])[1];
  if (!cssHref || !fontHref) throw new Error("stylesheet or font not found in the build");
  const font = readFileSync(join(dist, fontHref)).toString("base64");
  const css = readFileSync(join(dist, cssHref), "utf8")
    .replace(/@font-face\{[^}]*\}/g, (block) => {
      if (!block.includes("/_next/" + fontHref)) return /font-family:Inter;/.test(block) ? "" : block;
      return block.replace(/url\([^)]*\)/, `url(data:font/woff2;base64,${font})`);
    })
    .replace(/\/\*# sourceMappingURL=[^*]*\*\//g, "")
    .trim();
  const icon = "data:image/svg+xml," + encodeURIComponent(readFileSync(join(root, "app/icon.svg"), "utf8").trim()).replace(/%20/g, " ");

  html = html
    .replace(/<!--[\s\S]*?-->/g, "")                                    // Next's markers and build id
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")                  // Next's runtime: nothing on this page needs it
    .replace(/<link rel="preload"[^>]*>/g, "")
    .replace(/<meta name="next-size-adjust"[^>]*>/g, "")
    .replace(/<link rel="stylesheet"[^>]*>/, () => `<style>${css}</style>`)
    .replace(/<link rel="icon" href="[^"]*"/, () => `<link rel="icon" href="${icon}"`);

  const settings = `<script>
/* ── SETTINGS: the only things to change in this file ──────────────────────
   CALL_NUMBER is the one place the phone number lives: swap in the
   call-tracking number, written as it should be read. Every Call button, the
   pinned bar and the footer take it from here. A value left as its
   placeholder (all X's) or empty keeps that tag off. */
var CALL_NUMBER = ${JSON.stringify(placeholder)};
var GA4_ID = "G-XXXXXXXXXX";                // GA4 Measurement ID
var ADS_ID = "AW-XXXXXXXXXX";               // Google Ads tag ID
var ADS_CALL_CLICK_LABEL = "XXXXXXXXXXX";   // Ads conversion fired on every tap of a Call link
var ADS_WEBSITE_CALL_LABEL = "";            // optional: Google's forwarding number (off while DNI_SCRIPT_URL is set)
var DNI_SCRIPT_URL = "";                    // the call-tracking provider's number-swap script, https://…
window.NTR = { callNumber: CALL_NUMBER, placeholder: ${JSON.stringify(placeholder)}, ga4: GA4_ID, ads: ADS_ID,
  adsCallLabel: ADS_CALL_CLICK_LABEL, adsWebsiteLabel: ADS_WEBSITE_CALL_LABEL, dni: DNI_SCRIPT_URL };
</script>
<!-- DNI SNIPPET: a call-tracking provider snippet that is more than one script address goes here. -->
`;
  const runtime = `<script>\n${readFileSync(join(root, "lib/ntr-track.js"), "utf8").trim()}\n</script>`;
  html = html.replace(/<\/title>/, (t) => `${t}\n${settings}`).replace(/<\/body>/, `${runtime}\n</body>`);

  const header = `<!--
  NT Recoveries: a Darwin tow-truck demand test, call only. One page, one job:
  get the visitor to call. The number routes to a partner tow operator.

  Made by scripts/make-html.mjs from the Next.js page in this folder: change
  the page there and run \`npm run html\`, rather than editing this file. The
  exception is the SETTINGS block in <head>, which is meant to be edited here:

  1. CALL_NUMBER: the call-tracking number. Until it is swapped, a dark
     "Placeholder number" line shows at the top of the page.
  2. GA4_ID, ADS_ID, ADS_CALL_CLICK_LABEL: every tap on a Call link sends a
     GA4 "click_to_call" event (mark it as a key event in GA4) and the Google
     Ads conversion. Taps on 000 are never counted.
  3. DNI_SCRIPT_URL: the call-tracking provider's dynamic number insertion
     script. Tell the provider the number to replace is CALL_NUMBER.

  For phones with JavaScript off (rare), the number written in the links is
  the placeholder; search for ${placeholder} and its tel: form to change those too.
-->
`;
  return html.replace(/^<!DOCTYPE html>/i, (d) => `${d}\n${header}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  let dist = arg("--from");
  if (!dist) {
    dist = join(root, ".next-html");
    rmSync(dist, { recursive: true, force: true });
    const env = { ...process.env, NEXT_DIST_DIR: ".next-html" };
    for (const k of Object.keys(env)) if (k.startsWith("NEXT_PUBLIC_")) delete env[k];
    // Next points these two files at the build folder; put them back after.
    const keep = ["tsconfig.json", "next-env.d.ts"].map((f) => [f, readFileSync(join(root, f), "utf8")]);
    const r = spawnSync(join(root, "node_modules/.bin/next"), ["build"], { cwd: root, env, stdio: "inherit" });
    for (const [f, s] of keep) writeFileSync(join(root, f), s);
    if (r.status !== 0) process.exit(r.status || 1);
  } else if (!dist.startsWith("/")) dist = join(root, dist);
  const out = arg("--out") || join(root, "nt-recoveries.html");
  writeFileSync(out, makeHtml(dist));
  if (!arg("--from")) rmSync(dist, { recursive: true, force: true });
  console.log("wrote", out);
}
