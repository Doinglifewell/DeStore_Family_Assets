/* NT Recoveries: the call-only demand test. Builds the page three times (as it
   ships with .env.example's placeholder IDs; with a call-tracking number, GA4
   and Google Ads; and with a call-tracking provider's number-swap script),
   serves each with `next start` and drives it in Chromium. Then checks that
   nt-recoveries.html is exactly what scripts/make-html.mjs makes from the
   build, and drives that too.

   - the copy: we CONNECT callers with a local independent tow operator, the
     price is agreed on the phone before a truck is sent; never that we own,
     run or send trucks; no exclamation marks, never "trusted" or "best";
   - one action: a full-width Call button with the number in large text, a
     Call bar pinned to the bottom of a phone the whole time, "Call 000
     first."; no form, payment or map;
   - every tap target 48px or more, every piece of text WCAG AA, light and dark;
   - CALL_NUMBER is the one number; placeholder IDs load nothing; with real
     ones every tap on a tel: link is a GA4 event and an Ads conversion,
     except 000; the provider's script loads and Google's own forwarding
     number stands aside for it.

   Run: npm test   (needs playwright and Chromium; the build half runs anyway) */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import net from "node:net";
import { makeHtml } from "../scripts/make-html.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (n, c, h) => { if (c) { pass++; console.log("  ok  ", n); } else { fail++; console.log("  FAIL", n, h === undefined ? "" : "\n         " + JSON.stringify(h).slice(0, 400)); } };
const next = join(root, "node_modules/.bin/next");

// .env.example as it is: placeholder IDs, which must load nothing.
const example = Object.fromEntries(readFileSync(join(root, ".env.example"), "utf8").split("\n").filter((l) => /^NEXT_PUBLIC_\w+=/.test(l)).map((l) => l.split(/=(.*)/s).slice(0, 2)));
const PLAIN = { NEXT_DIST_DIR: ".next-test-plain", ...example };
const TAGS = { NEXT_PUBLIC_GA4_ID: "G-TEST123", NEXT_PUBLIC_ADS_ID: "AW-123", NEXT_PUBLIC_ADS_CALL_CLICK_LABEL: "ClickLabel", NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL: "CallLabel" };
const LIVE = { NEXT_DIST_DIR: ".next-test-live", NEXT_PUBLIC_CALL_NUMBER: "0412 345 678", ...TAGS };
const DNI_URL = "https://dni.example.test/swap.js";
const DNI = { NEXT_DIST_DIR: ".next-test-dni", ...TAGS, NEXT_PUBLIC_DNI_SCRIPT_URL: DNI_URL };
const clean = (v) => { const e = { ...process.env }; for (const k of Object.keys(e)) if (k.startsWith("NEXT_PUBLIC_")) delete e[k]; return { ...e, ...v }; };

const PLACEHOLDER_TEL = "tel:+61400000000";
const NOT_OURS = /\bour (?:tow )?trucks?\b|\bour (?:drivers?|fleet|operators?)\b|\bwe(?:'ll| will)? (?:send|dispatch|tow)\b|\bwe(?:'ll| will) get a truck|\bsend anyone\b|\bwe arrange tows\b/i;

// A build in another folder makes Next point these two files at it; put them back after.
const KEEP = ["tsconfig.json", "next-env.d.ts"].map((f) => [f, readFileSync(join(root, f), "utf8")]);
console.log("\nbuilding the page as it ships, with a number and tags, and with a number-swap script\n");
for (const [name, env] of [["as it ships", PLAIN], ["with a number and tags", LIVE], ["with a number-swap script", DNI]]) {
  rmSync(join(root, env.NEXT_DIST_DIR), { recursive: true, force: true });
  const r = spawnSync(next, ["build"], { cwd: root, env: clean(env), encoding: "utf8" });
  ok(`it builds (${name}), the page static`, r.status === 0 && /○ \//.test(r.stdout), (r.stdout + r.stderr).slice(-600));
}
for (const [f, s] of KEEP) writeFileSync(join(root, f), s);
const html = makeHtml(join(root, PLAIN.NEXT_DIST_DIR));
ok("nt-recoveries.html is what `npm run html` makes from this page (run it after a change)", readFileSync(join(root, "nt-recoveries.html"), "utf8") === html);

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
const events = (pg) => pg.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === "event"));
const configs = (pg) => pg.evaluate(() => (window.dataLayer || []).map((a) => Array.from(a)).filter((a) => a[0] === "config"));
// A test browser can't ring: the dial is stopped, the counting is what is checked.
const noDial = (pg) => pg.evaluate(() => document.addEventListener("click", (e) => { if (e.target.closest("a[href^='tel:']")) e.preventDefault(); }, true));

/** The checks that hold for both copies of the page, served at `url`. */
async function asItShips(url, label, route) {
  const ctx = await browser.newContext({ viewport: PHONE_VP, colorScheme: "light" });
  const pg = await ctx.newPage();
  if (route) await route(pg);
  const errors = [], outside = [];
  const home = new URL(url).hostname;
  pg.on("pageerror", (e) => errors.push(String(e.message)));
  pg.on("request", (r) => { const u = new URL(r.url()); if (u.hostname !== home && u.protocol.startsWith("http")) outside.push(r.url()); });
  await pg.goto(url); await pg.waitForTimeout(600);
  const text = await pg.locator("body").innerText();
  ok(`${label}the headline: "Broken down in Darwin? Fast local towing."`, (await pg.locator("h1").innerText()).replace(/\s+/g, " ").trim() === "Broken down in Darwin? Fast local towing.");
  ok(`${label}the sub-line: a local independent tow operator, price agreed on the phone`,
    (await pg.getByTestId("subline").innerText()).trim() === "We connect you with a local independent tow operator. The price is agreed on the phone before a truck is sent.");
  ok(`${label}never that we own, run or send trucks`, !NOT_OURS.test(text) && /independent tow operator/.test(text), text.match(NOT_OURS));
  ok(`${label}the footer says we don't own or run tow trucks`, /connects callers with a local independent tow operator/.test(await pg.getByTestId("disclosure").innerText()) && /don't own or run tow trucks/.test(await pg.getByTestId("disclosure").innerText()));

  const hero = pg.locator('[data-call="hero"]'), hb = await hero.boundingBox();
  const vw = PHONE_VP.width;
  ok(`${label}a full-width amber Call now button that dials the number`, (await hero.getAttribute("href")) === PLACEHOLDER_TEL && /Call now/.test(await hero.innerText()) && hb.width >= vw - 41 && hb.height >= 88, hb);
  const num = await hero.locator("[data-number]").evaluate((e) => ({ t: e.textContent, px: parseFloat(getComputedStyle(e).fontSize), lines: Math.round(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e).lineHeight)) }));
  ok(`${label}the number in large text on the button, on one line`, num.t === "0400 000 000" && num.px >= 28 && num.lines === 1, num);
  const sticky = pg.locator('[data-call="sticky"]');
  const sb = await sticky.boundingBox();
  ok(`${label}a Call button pinned to the bottom of a phone from the start`, sb && Math.abs(sb.y + sb.height + 12 - PHONE_VP.height) < 2 && sb.height >= 56 && (await sticky.getAttribute("href")) === PLACEHOLDER_TEL, sb);
  const safety = await pg.getByTestId("safety").boundingBox();
  ok(`${label}the hero's button and the 000 line are on screen above it without scrolling`, hb.y + hb.height <= sb.y - 12 && safety.y + safety.height <= sb.y - 12, { hb, safety, sb });
  ok(`${label}"Anyone hurt or in danger? Call 000 first.", which dials 000`, /Anyone hurt or in danger\? Call 000 first\./.test(await pg.getByTestId("safety").innerText()) && (await pg.locator('[data-testid="safety"] a').getAttribute("href")) === "tel:000");
  ok(`${label}the trust strip`, JSON.stringify(await pg.locator(".trust li").allInnerTexts()) === JSON.stringify(["Price agreed on the phone first", "A local independent tow operator", "One call, nothing to fill in"]));
  ok(`${label}three short reassurance points`, await pg.locator(".point").count() === 3);
  ok(`${label}a simple footer with the number`, (await pg.locator('[data-call="footer"]').getAttribute("href")) === PLACEHOLDER_TEL && /Call 0400 000 000/.test(await pg.locator('[data-call="footer"]').innerText()));
  ok(`${label}every call on the page goes to the one number (or 000)`, (await pg.$$eval("a[href^='tel:']", (as) => as.map((a) => a.getAttribute("href")))).every((h) => h === PLACEHOLDER_TEL || h === "tel:000"));
  ok(`${label}no form, no payment, no map: nothing to fill in`, await pg.locator("form, input, select, textarea, iframe, canvas").count() === 0 && !/card|pay now|checkout/i.test(text));
  ok(`${label}no exclamation marks anywhere`, !text.includes("!"), text.match(/.{0,30}!/));
  ok(`${label}never "trusted" or "best"`, !/\btrusted\b|\bbest\b/i.test(text));
  const taps = await pg.$$eval("a, button", (els) => els.filter((e) => getComputedStyle(e).visibility !== "hidden" && e.getBoundingClientRect().width).map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 30), h: Math.round(r.height), w: Math.round(r.width) }; }));
  ok(`${label}every tap target at least 48px`, taps.length >= 5 && taps.every((t) => t.h >= 48 && t.w >= 48), taps.filter((t) => t.h < 48 || t.w < 48));
  await pg.evaluate(() => document.fonts.ready);
  ok(`${label}Inter, loaded from this site (no request to Google Fonts)`, await pg.evaluate(() => /Inter/.test(getComputedStyle(document.body).fontFamily) && document.fonts.check("700 20px Inter") && [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Inter" && f.status === "loaded")) && !outside.some((u) => /fonts\.g/.test(u)));
  ok(`${label}body text 18px on a phone`, await pg.evaluate(() => getComputedStyle(document.body).fontSize) === "18px");
  ok(`${label}the placeholder number says it is one`, await pg.getByTestId("placeholder-note").isVisible());
  ok(`${label}placeholder IDs load nothing: no Google tag, no third-party request`, outside.length === 0 && await pg.locator("script[src*='googletagmanager']").count() === 0, outside);
  const light = await contrastPairs(pg);
  ok(`${label}every piece of text WCAG AA in light`, light.length > 15 && light.every((p) => p.ratio >= p.need), light.filter((p) => p.ratio < p.need));
  const bg = await pg.evaluate(() => getComputedStyle(document.body).backgroundColor), ink = await pg.evaluate(() => getComputedStyle(document.body).color);
  const btn = await hero.evaluate((e) => getComputedStyle(e).backgroundColor);
  ok(`${label}the handover's tokens: #FBF8F2 surface, #0E1A2B ink, #F2A900 amber`, bg === "rgb(251, 248, 242)" && ink === "rgb(14, 26, 43)" && btn === "rgb(242, 169, 0)", { bg, ink, btn });

  await pg.evaluate(() => scrollTo(0, 600)); await pg.waitForTimeout(200);
  const mid = await sticky.boundingBox();
  await pg.evaluate(() => scrollTo(0, document.body.scrollHeight)); await pg.waitForTimeout(200);
  const end = await sticky.boundingBox();
  const lastText = await pg.evaluate(() => { const ps = [...document.querySelectorAll("footer p")]; return ps[ps.length - 1].getBoundingClientRect().bottom; });
  ok(`${label}the bar stays pinned as the page scrolls, and the page ends clear of it`, mid && end && Math.abs(mid.y - sb.y) < 2 && Math.abs(end.y - sb.y) < 2 && lastText <= end.y - 12, { mid, end, lastText });
  ok(`${label}no page errors`, errors.length === 0, errors);
  await ctx.close();

  const small = await browser.newContext({ viewport: { width: 320, height: 568 } });
  const sp = await small.newPage(); if (route) await route(sp); await sp.goto(url); await sp.waitForTimeout(400);
  ok(`${label}on the narrowest phone (320px) nothing spills sideways and the number stays on one line`, await sp.evaluate(() => {
    const n = document.querySelector('[data-call="hero"] [data-number]'), b = document.querySelector('[data-call="hero"]');
    return document.documentElement.scrollWidth <= innerWidth && b.scrollWidth <= b.clientWidth + 1 && n.getBoundingClientRect().height < parseFloat(getComputedStyle(n).fontSize) * 1.6;
  }));
  await small.close();

  const dark = await browser.newContext({ viewport: PHONE_VP, colorScheme: "dark" });
  const dp = await dark.newPage(); if (route) await route(dp); await dp.goto(url); await dp.waitForTimeout(500);
  const dpairs = await contrastPairs(dp);
  ok(`${label}dark mode follows the phone, with the handover's dark tokens`, await dp.evaluate(() => getComputedStyle(document.body).backgroundColor) === "rgb(11, 19, 32)");
  ok(`${label}every piece of text WCAG AA in dark`, dpairs.every((p) => p.ratio >= p.need), dpairs.filter((p) => p.ratio < p.need));
  await dark.close();

  const desk = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const kp = await desk.newPage(); if (route) await route(kp); await kp.goto(url); await kp.waitForTimeout(400);
  ok(`${label}on a computer: no pinned bar, the hero button 576px at most, the page fits the width`, await kp.evaluate(() => getComputedStyle(document.querySelector('[data-testid="sticky-call"]')).display === "none"
    && document.querySelector('[data-call="hero"]').getBoundingClientRect().width <= 577 && document.documentElement.scrollWidth <= innerWidth));
  await desk.close();
}

/** Taps on every tel: link counted; 000 never. */
async function counting(pg, label) {
  await noDial(pg);
  for (const where of ["hero", "sticky", "footer"]) await pg.locator(`[data-call="${where}"]`).click();
  await pg.waitForTimeout(150);
  const ev = await events(pg);
  const c2c = ev.filter((a) => a[1] === "click_to_call").map((a) => a[2].link_location);
  ok(`${label}every tap on a Call link is a GA4 click_to_call, saying where`, JSON.stringify(c2c) === JSON.stringify(["hero", "sticky", "footer"]), ev);
  ok(`${label}and a Google Ads conversion, each time`, ev.filter((a) => a[1] === "conversion" && a[2].send_to === "AW-123/ClickLabel").length === 3, ev);
  await pg.locator('[data-testid="safety"] a').click(); await pg.waitForTimeout(100);
  ok(`${label}a tap on "Call 000 first." is never counted`, (await events(pg)).length === ev.length);
  await pg.evaluate(() => { const a = document.createElement("a"); a.href = "tel:+61412345678"; a.id = "late"; a.textContent = "late link"; document.body.prepend(a); });
  await pg.locator("#late").click(); await pg.waitForTimeout(100);
  ok(`${label}a tel: link added later (as a call-tracking script may) is counted too`, (await events(pg)).some((a) => a[1] === "click_to_call" && a[2].link_location === "page"));
}

console.log("\nas it ships: the copy, the one action, the rules\n");
{
  const { base, stop } = await serve(PLAIN);
  await asItShips(base, "");
  stop();
}

console.log("\nset up: CALL_NUMBER, GA4 and Google Ads\n");
{
  const { base, stop } = await serve(LIVE);
  const ctx = await browser.newContext({ viewport: PHONE_VP });
  const pg = await ctx.newPage();
  const errors = [], gtm = [];
  pg.on("pageerror", (e) => errors.push(String(e.message)));
  // Google's script is answered empty: the page's own gtag() still queues into dataLayer.
  await pg.route("https://www.googletagmanager.com/**", (r) => { gtm.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body: "" }); });
  await pg.goto(base); await pg.waitForTimeout(900);
  const hrefs = await pg.$$eval("a[data-call]", (as) => as.map((a) => a.getAttribute("href")));
  const shown = await pg.$$eval("[data-number]", (els) => els.map((e) => e.textContent));
  ok("CALL_NUMBER is on every Call link, dialled and shown", hrefs.length === 3 && hrefs.every((h) => h === "tel:+61412345678") && shown.length === 3 && shown.every((t) => t === "0412 345 678"), { hrefs, shown });
  ok("no placeholder note once the number is set", await pg.getByTestId("placeholder-note").count() === 0);
  ok("gtag.js loads once, for the GA4 stream", gtm.length === 1 && /id=G-TEST123/.test(gtm[0]), gtm);
  const cfg = await configs(pg);
  ok("GA4 and the Ads tag configured", cfg.some((a) => a[1] === "G-TEST123") && cfg.some((a) => a[1] === "AW-123"), cfg);
  ok("Google's forwarding number set up against CALL_NUMBER", cfg.some((a) => a[1] === "AW-123/CallLabel" && a[2] && a[2].phone_conversion_number === "0412 345 678"), cfg);
  await counting(pg, "");
  ok("no page errors", errors.length === 0, errors);
  await ctx.close();
  stop();
}

console.log("\nset up: a call-tracking provider's number-swap script\n");
{
  const { base, stop } = await serve(DNI);
  const ctx = await browser.newContext({ viewport: PHONE_VP });
  const pg = await ctx.newPage();
  const errors = [], dni = [];
  pg.on("pageerror", (e) => errors.push(String(e.message)));
  await pg.route("https://www.googletagmanager.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: "" }));
  // A stand-in provider: swaps every shown number and tel: link, as theirs do.
  await pg.route(DNI_URL, (r) => { dni.push(r.request().url()); r.fulfill({ contentType: "text/javascript", body:
    `document.querySelectorAll("[data-number]").forEach(function(e){e.textContent="08 8999 0000"});
     document.querySelectorAll("a[href='tel:+61400000000']").forEach(function(a){a.setAttribute("href","tel:+61889990000")});` }); });
  await pg.goto(base); await pg.waitForTimeout(900);
  ok("the provider's script loads once", dni.length === 1, dni);
  ok("and its number is what is shown and dialled", (await pg.locator('[data-call="hero"]').getAttribute("href")) === "tel:+61889990000" && /08 8999 0000/.test(await pg.locator('[data-call="hero"]').innerText()));
  ok("a screen reader reads the swapped number too (no fixed label on the button)", /08 8999 0000/.test(await pg.locator('[data-call="hero"]').evaluate((a) => a.getAttribute("aria-label") || a.textContent)));
  ok("Google's own forwarding number stands aside (two number swaps fight)", !(await configs(pg)).some((a) => a[2] && a[2].phone_conversion_number), await configs(pg));
  await counting(pg, "with the swap: ");
  ok("no page errors", errors.length === 0, errors);
  await ctx.close();
  stop();
}

console.log("\nthe standalone copy: nt-recoveries.html\n");
{
  const origin = "https://ntr.test/";
  const routeTo = (body) => async (pg) => { await pg.route(origin + "**", (r) => r.fulfill({ contentType: "text/html", body })); await pg.route("https://www.googletagmanager.com/**", (r) => r.fulfill({ contentType: "text/javascript", body: "" })); };
  await asItShips(origin, "html: ", routeTo(html));

  // The SETTINGS block, edited the way the file says to.
  const set = (k, v) => (h) => { const re = new RegExp(`var ${k} = "[^"]*";`); if (!re.test(h)) throw new Error("no setting " + k); return h.replace(re, `var ${k} = ${JSON.stringify(v)};`); };
  const edited = [set("CALL_NUMBER", "0412 345 678"), set("GA4_ID", "G-TEST123"), set("ADS_ID", "AW-123"), set("ADS_CALL_CLICK_LABEL", "ClickLabel"), set("ADS_WEBSITE_CALL_LABEL", "CallLabel")].reduce((h, f) => f(h), html);
  const ctx = await browser.newContext({ viewport: PHONE_VP });
  const pg = await ctx.newPage();
  const errors = [], gtm = [];
  pg.on("pageerror", (e) => errors.push(String(e.message)));
  await routeTo(edited)(pg);
  pg.on("request", (r) => { if (/googletagmanager/.test(r.url())) gtm.push(r.url()); });
  await pg.goto(origin); await pg.waitForTimeout(700);
  const hrefs = await pg.$$eval("a[data-call]", (as) => as.map((a) => a.getAttribute("href")));
  const shown = await pg.$$eval("[data-number]", (els) => els.map((e) => e.textContent));
  ok("html: CALL_NUMBER in SETTINGS goes onto every Call link", hrefs.length === 3 && hrefs.every((h) => h === "tel:+61412345678") && shown.every((t) => t === "0412 345 678"), { hrefs, shown });
  ok("html: and the placeholder note goes", await pg.getByTestId("placeholder-note").count() === 0);
  ok("html: gtag.js loads once, configured", gtm.length === 1 && (await configs(pg)).some((a) => a[1] === "AW-123/CallLabel" && a[2].phone_conversion_number === "0412 345 678"), gtm);
  await counting(pg, "html: ");
  ok("html: no page errors", errors.length === 0, errors);
  await ctx.close();
}

await browser.close();
for (const d of [PLAIN.NEXT_DIST_DIR, LIVE.NEXT_DIST_DIR, DNI.NEXT_DIST_DIR]) rmSync(join(root, d), { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
