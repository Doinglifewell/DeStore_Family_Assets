/* NT Recoveries: the one-page demand test. Builds the page twice, as it ships
   (placeholder number, no tags) and as it runs once set up (a call-tracking
   number, GA4 and Google Ads), serves each with `next start` and drives it in
   Chromium:

   - the copy as briefed, and the handover's rules: no exclamation marks, never
     "trusted" or "best", no form, no payment, no map;
   - one job: every Call button and link dials the number, the hero's is on
     screen on a phone without scrolling, "Call 000 first." dials 000;
   - every tap target at least 48px, every piece of text WCAG AA, light and dark;
   - the sticky Call bar only once the hero button has scrolled away;
   - no third-party request until a tag ID is set; then gtag loads, the
     forwarding number is configured, and a tap is counted (GA4 click_to_call
     and the Ads conversion) without stopping the call.

   Run: npm test   (needs playwright and Chromium; the build half runs anyway) */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import net from "node:net";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (n, c, h) => { if (c) { pass++; console.log("  ok  ", n); } else { fail++; console.log("  FAIL", n, h === undefined ? "" : "\n         " + JSON.stringify(h).slice(0, 400)); } };
const next = join(root, "node_modules/.bin/next");

const PLAIN = { NEXT_DIST_DIR: ".next-test-plain" };
const LIVE = { NEXT_DIST_DIR: ".next-test-live", NEXT_PUBLIC_PHONE: "08 8123 4567", NEXT_PUBLIC_GA4_ID: "G-TEST123", NEXT_PUBLIC_ADS_ID: "AW-123",
  NEXT_PUBLIC_ADS_CALL_CLICK_LABEL: "ClickLabel", NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL: "CallLabel" };
const clean = (v) => { const e = { ...process.env }; for (const k of Object.keys(e)) if (k.startsWith("NEXT_PUBLIC_")) delete e[k]; return { ...e, ...v }; };

console.log("\nbuilding the page as it ships, and as it runs with tags\n");
for (const [name, env] of [["as it ships", PLAIN], ["with a number and tags", LIVE]]) {
  rmSync(join(root, env.NEXT_DIST_DIR), { recursive: true, force: true });
  const r = spawnSync(next, ["build"], { cwd: root, env: clean(env), encoding: "utf8" });
  ok(`it builds (${name}), the page static`, r.status === 0 && /○ \//.test(r.stdout), (r.stdout + r.stderr).slice(-600));
}

const CHROME = ["/opt/pw-browsers/chromium-1194/chrome-linux/chrome", process.env.PLAYWRIGHT_CHROMIUM].filter(Boolean).find((p) => existsSync(p));
let chromium = null;
for (const m of ["playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"]) { try { ({ chromium } = await import(m)); break; } catch (e) {} }
if (!chromium || !CHROME) { console.log(`\nbrowser half skipped — ${chromium ? "no chromium binary" : "playwright not installed"}\n\n${pass} passed, ${fail} failed\n`); process.exit(fail ? 1 : 0); }

const freePort = () => new Promise((res) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
async function serve(env) {
  const port = await freePort();
  const child = spawn(next, ["start", "-p", String(port)], { cwd: root, env: clean(env), stdio: "ignore" });
  const base = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base)).ok) break; } catch (e) {} await new Promise((r) => setTimeout(r, 250)); }
  return { base, stop: () => child.kill() };
}
const browser = await chromium.launch({ executablePath: CHROME });
const PHONE_VP = { width: 390, height: 844 };

/** Every element with its own text: its text, size, weight, colour and the background it sits on. */
const contrastPairs = (pg) => pg.evaluate(() => {
  // Any CSS colour (rgb, oklab, color-mix…) to [r, g, b, alpha 0-1], through a canvas.
  const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgb = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const lum = ([r, g, b]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c[3] > 0.5) return c; } return [255, 255, 255, 1]; };
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
    if (s.visibility === "hidden" || s.display === "none" || !r.width) continue;
    const bg = bgOf(el), f = rgb(s.color);
    // Text that is see-through is blended over what is behind it.
    const fg = [0, 1, 2].map((i) => f[i] * f[3] + bg[i] * (1 - f[3]));
    const a = lum(fg), b = lum(bg.slice(0, 3));
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const px = parseFloat(s.fontSize), bold = +s.fontWeight >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    out.push({ text: el.textContent.trim().slice(0, 40), ratio: Math.round(ratio * 100) / 100, need: large ? 3 : 4.5 });
  }
  return out;
});

console.log("\nas it ships: the copy, the one action, the rules\n");
{
  const { base, stop } = await serve(PLAIN);
  const ctx = await browser.newContext({ viewport: PHONE_VP, colorScheme: "light" });
  const pg = await ctx.newPage();
  const errors = [], outside = [];
  pg.on("pageerror", (e) => errors.push(String(e.message)));
  pg.on("request", (r) => { const u = new URL(r.url()); if (!/^(localhost|127\.0\.0\.1)$/.test(u.hostname) && u.protocol.startsWith("http")) outside.push(r.url()); });
  await pg.goto(base); await pg.waitForTimeout(600);
  const text = await pg.locator("body").innerText();
  ok("the headline: \"Broken down in Darwin? Fast local towing.\"", (await pg.locator("h1").innerText()).replace(/\s+/g, " ").trim() === "Broken down in Darwin? Fast local towing.");
  ok("the sub-line", /Local operators, price agreed up front\. We'll get a truck to you\./.test(text));
  const hero = pg.locator('[data-call="hero"]'), hb = await hero.boundingBox();
  ok("a big tap-to-call button that dials the number", (await hero.getAttribute("href")) === "tel:+61855500123" && /Call now/.test(await hero.innerText()) && /08 5550 0123/.test(await hero.innerText()) && hb.height >= 56 && hb.width >= 300, hb);
  ok("on a phone it is on screen without scrolling", hb.y + hb.height <= PHONE_VP.height);
  const safety = pg.locator('[data-testid="safety"] a');
  ok("\"Anyone hurt or in danger? Call 000 first.\", which dials 000", /Anyone hurt or in danger\? Call 000 first\./.test(await pg.getByTestId("safety").innerText()) && (await safety.getAttribute("href")) === "tel:000");
  ok("the trust strip: price agreed, local Darwin operators, see the truck arrive",
    JSON.stringify(await pg.locator(".trust li").allInnerTexts()) === JSON.stringify(["Price agreed before we send anyone", "Local Darwin operators", "See the truck arrive"]));
  ok("three short reassurance points", await pg.locator(".point").count() === 3);
  ok("a simple footer with the number", (await pg.locator('[data-call="footer"]').getAttribute("href")) === "tel:+61855500123");
  ok("every call on the page goes to the one number (or 000)", (await pg.$$eval("a[href^='tel:']", (as) => as.map((a) => a.getAttribute("href")))).every((h) => h === "tel:+61855500123" || h === "tel:000"));
  ok("no form, no payment, no map: nothing to fill in", await pg.locator("form, input, select, textarea, iframe, canvas").count() === 0 && !/card|pay now|checkout/i.test(text));
  ok("no exclamation marks anywhere", !text.includes("!"), text.match(/.{0,30}!/));
  ok("never \"trusted\" or \"best\"", !/\btrusted\b|\bbest\b/i.test(text));
  const taps = await pg.$$eval("a, button", (els) => els.filter((e) => getComputedStyle(e).visibility !== "hidden" && e.getBoundingClientRect().width).map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width) }; }));
  ok("every tap target at least 48px", taps.length >= 4 && taps.every((t) => t.h >= 48 && t.w >= 48), taps.filter((t) => t.h < 48 || t.w < 48));
  const font = await pg.evaluate(() => getComputedStyle(document.body).fontFamily);
  ok("Inter, self-hosted (no request to Google Fonts)", /Inter/i.test(font) && !outside.some((u) => /fonts\.g/.test(u)), font);
  ok("body text 18px on a phone", await pg.evaluate(() => getComputedStyle(document.body).fontSize) === "18px");
  ok("the placeholder number says it is one", await pg.getByTestId("placeholder-note").isVisible());
  ok("no Google tag, no third-party request, until an ID is set", outside.length === 0 && await pg.locator("script[src*='googletagmanager']").count() === 0, outside);
  const light = await contrastPairs(pg);
  ok("every piece of text WCAG AA in light (warm off-white, deep navy, amber)", light.length > 15 && light.every((p) => p.ratio >= p.need), light.filter((p) => p.ratio < p.need));
  const bg = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor), ink = await pg.evaluate(() => getComputedStyle(document.body).color);
  const btn = await hero.evaluate((e) => getComputedStyle(e).backgroundColor);
  ok("the handover's tokens: #FBF8F2 surface, #0E1A2B ink, #F2A900 amber", bg === "rgb(251, 248, 242)" && ink === "rgb(14, 26, 43)" && btn === "rgb(242, 169, 0)", { bg, ink, btn });

  // The sticky bar: hidden at the top, there once the hero button has gone, gone again at the footer.
  const stickyOn = () => pg.evaluate(() => getComputedStyle(document.querySelector('[data-testid="sticky-call"]')).visibility === "visible");
  ok("no sticky bar while the hero's Call button is on screen", !(await stickyOn()));
  await pg.evaluate(() => { const b = document.querySelector('[data-call="hero"]').getBoundingClientRect(); scrollTo(0, b.bottom + scrollY + 20); });
  await pg.waitForTimeout(500);
  const sb = await pg.locator('[data-call="sticky"]').boundingBox();
  ok("scrolled past it, the same Call button waits at the bottom", await stickyOn() && sb && sb.y + sb.height <= PHONE_VP.height && sb.height >= 56 && (await pg.locator('[data-call="sticky"]').getAttribute("href")) === "tel:+61855500123", sb);
  await pg.evaluate(() => scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(500);
  ok("at the footer's number it steps aside (never two Call buttons on screen)", !(await stickyOn()));
  ok("no page errors", errors.length === 0, errors);
  await ctx.close();

  const dark = await browser.newContext({ viewport: PHONE_VP, colorScheme: "dark" });
  const dp = await dark.newPage(); await dp.goto(base); await dp.waitForTimeout(500);
  const dpairs = await contrastPairs(dp);
  ok("dark mode follows the phone, with the handover's dark tokens", await dp.evaluate(() => getComputedStyle(document.body).backgroundColor) === "rgb(11, 19, 32)");
  ok("every piece of text WCAG AA in dark", dpairs.every((p) => p.ratio >= p.need), dpairs.filter((p) => p.ratio < p.need));
  await dark.close();

  const desk = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const kp = await desk.newPage(); await kp.goto(base); await kp.waitForTimeout(400);
  ok("on a computer: no sticky bar, the page fits the width", await kp.evaluate(() => getComputedStyle(document.querySelector('[data-testid="sticky-call"]')).display === "none" && document.documentElement.scrollWidth <= innerWidth));
  await desk.close();
  stop();
}

console.log("\nset up: the call-tracking number, GA4 and Google Ads\n");
{
  const { base, stop } = await serve(LIVE);
  const ctx = await browser.newContext({ viewport: PHONE_VP });
  const pg = await ctx.newPage();
  const errors = [], gtm = [];
  pg.on("pageerror", (e) => errors.push(String(e.message)));
  // Google's script is answered empty: the page's own gtag() still queues into dataLayer.
  await pg.route("https://www.googletagmanager.com/**", (r) => { gtm.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body: "" }); });
  await pg.goto(base); await pg.waitForTimeout(900);
  ok("the call-tracking number is on every Call button", (await pg.locator('[data-call="hero"]').getAttribute("href")) === "tel:+61881234567" && /08 8123 4567/.test(await pg.locator('[data-call="hero"]').innerText()));
  ok("no placeholder note once the number is set", await pg.getByTestId("placeholder-note").count() === 0);
  ok("gtag.js loads once, for the GA4 stream", gtm.length === 1 && /id=G-TEST123/.test(gtm[0]), gtm);
  const dl = await pg.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)));
  const cfg = dl.filter((a) => a[0] === "config");
  ok("GA4 and the Ads tag configured", cfg.some((a) => a[1] === "G-TEST123") && cfg.some((a) => a[1] === "AW-123"), cfg);
  ok("Google's forwarding number set up against the number on the page", cfg.some((a) => a[1] === "AW-123/CallLabel" && a[2] && a[2].phone_conversion_number === "08 8123 4567"), cfg);
  // Tap Call: the dial itself is stopped here (a test browser can't ring), the counting is what is checked.
  await pg.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest("a[href^='tel:']")) e.preventDefault(); }, true));
  await pg.locator('[data-call="hero"]').click(); await pg.waitForTimeout(150);
  const ev = await pg.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === "event"));
  ok("a tap on Call is a GA4 click_to_call, saying where", ev.some((a) => a[1] === "click_to_call" && a[2] && a[2].link_location === "hero"), ev);
  ok("and a Google Ads conversion", ev.some((a) => a[1] === "conversion" && a[2] && a[2].send_to === "AW-123/ClickLabel"), ev);
  await pg.locator('[data-call="footer"]').click(); await pg.waitForTimeout(150);
  ok("the footer's number is counted too", (await pg.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === "event" && a[2] && a[2].link_location === "footer").length)) === 1);
  ok("no page errors", errors.length === 0, errors);
  await ctx.close();
  stop();
}

await browser.close();
for (const d of [PLAIN.NEXT_DIST_DIR, LIVE.NEXT_DIST_DIR]) rmSync(join(root, d), { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
