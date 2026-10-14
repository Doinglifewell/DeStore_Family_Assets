# NT Recoveries: a Darwin towing demand test

Call only. One page with one job: get somebody broken down in Darwin to call.
The number is a call-tracking number that routes to a partner tow operator.
There is no form, payment, map or matching step, only the Call button (there
never was one, so there is nothing hidden to bring back). The design and
wording follow the Towapp customer handover: warm off-white, beacon amber,
deep navy, Inter, mobile first, no exclamation marks, WCAG AA contrast, tap
targets of 48px or more.

**What the page may say:** we connect callers with a local independent tow
operator, and the price is agreed on the phone before a truck is sent. Never
that we own, run or send trucks, and never the operator's name. The footer
says plainly that NT Recoveries doesn't own or run tow trucks. The tests check
the words.

It exists to answer two questions with real Google Ads money before anything
else gets built:

1. **What does a towing job cost to win on Google in Darwin?**
2. **Is 10% of the job the right fee to charge?**

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
npm run html         # remakes nt-recoveries.html from the page
npm test             # three builds, then the page and the HTML copy in Chromium (89 checks)
```

`npm test` needs Playwright's Chromium (preinstalled here). It builds the page
as it ships (`.env.example`'s placeholder IDs), with a number and tags, and with
a call-tracking script, then checks the copy, the tel links, the pinned bar,
tap sizes, contrast in light and dark, that placeholder IDs load nothing, that
every tap on a Call link fires GA4's `click_to_call` and the Ads conversion,
that 000 never does, and that the HTML copy is current.

## Go live on Vercel

1. Vercel → Add New → Project → import `Doinglifewell/DeStore_Family_Assets`.
2. **Root Directory: `nt-recoveries`**. Vercel detects Next.js; leave the
   build settings as they are.
3. Add the environment variables below (Settings → Environment Variables).
4. Deploy, then add the domain under Settings → Domains.

Vercel builds production from the repository's default branch. This repo's
only branch is `claude/nt-recoveries-analysis-3bmdcz`, so that is the one
until a `main` exists.

### The number: `CALL_NUMBER`

`CALL_NUMBER` in `lib/config.ts` is the one place the number lives. Every Call
button, the pinned bar, the footer and Google's forwarding-number setup read
it. It is `0400 000 000` for now; swap in the call-tracking number, written as
it should be read (`0412 345 678`). Until it is swapped, a dark banner at the
top says the number is a placeholder. **Don't run ads, or test-call it,
before then:** `0400 000 000` may belong to a real person.
`NEXT_PUBLIC_CALL_NUMBER` on Vercel overrides it without a code change.

### Environment variables

`.env.example` lists them with placeholder IDs (`G-XXXXXXXXXX`,
`AW-XXXXXXXXXX`). A placeholder or an empty value keeps that part off: nothing
loads and nothing is sent until the ID is real.

| Name | What it is |
|---|---|
| `NEXT_PUBLIC_GA4_ID` | GA4 web stream Measurement ID, `G-…` |
| `NEXT_PUBLIC_ADS_ID` | Google Ads tag ID, `AW-…` |
| `NEXT_PUBLIC_ADS_CALL_CLICK_LABEL` | Conversion label fired on every tap of a Call link |
| `NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL` | Optional: Google's own forwarding number. Left off while a call-tracking script is set |
| `NEXT_PUBLIC_DNI_SCRIPT_URL` | The call-tracking provider's dynamic number insertion script (https) |
| `NEXT_PUBLIC_CALL_NUMBER` | Optional override of `CALL_NUMBER` |

Every tap on a `tel:` link to the number (hero, pinned bar, footer, and any
link the provider's script rewrites or adds) sends GA4 `click_to_call` with
where it was tapped, and the Ads conversion. **Taps on "Call 000 first." are
never counted:** an emergency call is not a lead, and counting it would teach
Google's bidding to find more of them. The code is `lib/ntr-track.js`, shared
by both copies of the page; where each piece goes is written out at the top of
`components/Tracking.tsx`.

### Setting up the Google side

1. **GA4:** make a property and a web stream; copy its Measurement ID. After
   the first tap, mark `click_to_call` as a key event (Admin → Events).
2. **Google Ads conversions** (Goals → Conversions → New → Phone calls):
   - *Calls from ads using call assets*: add a call asset to the ads. Counted
     by Google itself, nothing on the page.
   - *Calls to a phone number on your website*: copy its label into
     `NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL`. For visitors from an ad, Google
     swaps the number on the page for a forwarding number and counts real
     calls and their length. Set the call length that counts as a lead (60
     seconds is a sensible start: a wrong number hangs up sooner).
   - *Clicks on your number on your mobile website*: copy its label into
     `NEXT_PUBLIC_ADS_CALL_CLICK_LABEL`. Counts taps, which is not the same as
     a call that happened.
   Make the website-call conversion the **primary** one; taps are secondary.
3. **The call-tracking provider** (Delacon, CallRail, CallTrackingMetrics,
   Calltrak): put their main tracking number in `CALL_NUMBER`, routed to the
   partner operator. For a number per ad or per visitor, put their dynamic
   number insertion script's address in `NEXT_PUBLIC_DNI_SCRIPT_URL` (a
   snippet that is more than one address goes in the DNI SNIPPET slot in
   `components/Tracking.tsx`), and tell them the number to replace is
   `CALL_NUMBER` exactly as written. With a provider, leave
   `NEXT_PUBLIC_ADS_WEBSITE_CALL_LABEL` empty and import the provider's
   calls into Google Ads instead: two scripts swapping one number fight.

## Before the first ad

- **The partner operator has to answer, every time.** A demand test that
  rings out leaves a stranded driver on the side of the road and breaks
  Google's rules on misleading ads. Agree with the operator what happens when
  they can't come (who they pass the call to, or what they tell the caller),
  and check the provider's call recordings in the first week.
- **A privacy page.** GA4 and Google Ads collect data, and Google's policies
  and the Privacy Act expect a privacy policy that says so. Add one before the
  tags are switched on (it is the one thing on this page that isn't built).
- **Keep a job log.** Google counts calls; only you know which became a tow
  and what it was worth. For every call write down: date, how long, tow or
  not, the job price, which operator.

## Is 10% right? The maths

Everything comes down to one comparison:

> **What a job costs to win in ads** must be less than **10% of the job**.

What a job costs to win:

```
cost per job = cost per click ÷ (calls per click × jobs per call)
```

Worked example. Every figure here is an assumption to replace with your own
after two to four weeks of ads:

| | |
|---|---|
| Cost per click | A$4 (Australian Google Search averages A$2–4; home services A$4–4.60. Towing is not published separately, and urgent searches tend to cost more) |
| Calls per click | 20% (one in five who land on the page calls) |
| Jobs per call | 50% (half the calls become a tow) |
| **Cost per job** | A$4 ÷ (0.20 × 0.50) = **A$40** |
| Average tow | A$300 |
| **10% fee** | **A$30** |

In this example a job costs A$40 to win and earns A$30, so 10% loses A$10 a
job before anything else is paid. The fee that breaks even is
A$40 ÷ A$300 = **13%**; the ads alone need about 13%, and the business costs
on top need more.

Three levers move the answer, and the test measures all three:

| If… | Then… |
|---|---|
| Clicks are cheaper in Darwin (a small market, fewer bidders) | Cost per job falls; 10% may cover it |
| More people call, or more calls become jobs | Same. The page is built to make calling the only thing to do |
| Average tows are bigger (long distances in the NT) | 10% earns more per job |

So the honest answer before the test is: **10% works only if a job costs
less than 10% of its price to win.** At A$300 a job that means under A$30 a
job. Two other ways to read the result:

- A flat fee per job (A$30–50) may suit operators better than a percentage,
  and stays the same whatever the distance.
- Only charging when the tow goes ahead (not per call) is what makes either
  fair to the operator, and it is what the job log measures.

### Running the test

- **Before spending:** Google Ads → Tools → **Keyword Planner**, location
  Darwin NT (plus a radius), keywords such as *tow truck darwin*, *towing
  darwin*, *car towing near me*, *roadside assistance darwin*. It gives
  monthly searches and a bid range: the real cost per click, not a national
  average.
- **Budget:** a fixed amount over a fixed time, e.g. A$30–50 a day for two to
  four weeks (A$500–1,500 in all). Enough clicks to see a pattern, not enough
  to hurt.
- **Campaign:** Search only (not Display or Performance Max), location Darwin
  and surrounds, "presence: people in or regularly in" the area, a call
  asset, exact and phrase match on the towing keywords, and negatives for
  *jobs*, *salary*, *for sale*, *course*, *licence*.
- **Each week:** spend, clicks, cost per click, calls (Google's forwarding
  number), calls over 60 seconds, jobs and their prices from the job log.
  Then cost per job, and that as a share of the average job.

## Two copies of the page

`nt-recoveries.html` is the same page as one standalone HTML file, for
dropping on any host without Next.js, Inter embedded. It is made from the Next
build by `npm run html` (`scripts/make-html.mjs`): the same markup, styles and
tracking code. Change the page, then run it; `npm test` fails while the file
is out of date. Its own SETTINGS block in `<head>` (`CALL_NUMBER`, the IDs,
`DNI_SCRIPT_URL`) is the one part meant to be edited in the file.

## Files

| | |
|---|---|
| `app/page.tsx` | The page: hero, 000 line, trust strip, three points, footer with the disclosure |
| `app/globals.css` | The handover's tokens (light and dark) and the few custom styles |
| `app/layout.tsx` | Inter (self-hosted by next/font), metadata, the tags |
| `components/CallButton.tsx` | The Call button (number in large text) and the footer link |
| `components/StickyCall.tsx` | The Call bar pinned to the bottom of a phone |
| `components/Tracking.tsx` | Puts the tracking on the page, with where each piece goes |
| `lib/config.ts` | `CALL_NUMBER` and the tag IDs |
| `lib/ntr-track.js` | GA4, Google Ads and the number-swap script; counts every tap on a Call link |
| `scripts/make-html.mjs` | Makes `nt-recoveries.html` from the build |
| `tests/landing.test.mjs` | The checks |

## Sources for the cost figures

- Websites That Sell, Google Ads cost in Australia: https://www.websitesthatsell.com.au/ppc/google-ads-cost/
- Digital8, How much does running Google Ads cost in Australia: https://digital8.com.au/how-much-does-running-google-ads-cost-in-australia/
- Bambrick, Google Ads cost: https://bambrick.com.au/?p=96379
- Make My Website, How much does Google Ads cost in Australia: https://makemywebsite.com.au/blog/how-much-does-google-ads-cost-in-australia
- AIAD, Google Ads cost: https://aiad.com.au/google-ads-cost/

None publishes a figure for towing in Darwin. Keyword Planner is where the
real one comes from.
