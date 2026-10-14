/* NT Recoveries: a Darwin tow-truck demand test. One page with one job: get
   the visitor to call. No form, no payment, no map.

   Voice (the Towapp customer handover, section 8): plain Australian English,
   short sentences, say what happens next; no exclamation marks; never
   "trusted" or "best", show the proof instead. */

import { CallButton, CallLink } from "@/components/CallButton";
import { StickyCall } from "@/components/StickyCall";
import { BRAND, PHONE, PHONE_IS_PLACEHOLDER } from "@/lib/config";

const TRUST = ["Price agreed before we send anyone", "Local Darwin operators", "See the truck arrive"];

const POINTS = [
  { title: "One call does it", body: "Tell us where the car is and what's happened. We find a local truck that can come, and tell you when it will get there." },
  { title: "The price comes first", body: "You hear the price before anyone is sent. Nothing changes unless you agree to it." },
  { title: "Know it's your truck", body: "We give you the driver's name and the truck's rego. Check the rego before your car is hooked up." },
];

function Tick() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-accent-strong" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity=".16" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Truck() {
  return (
    <svg viewBox="0 0 32 20" className="h-6 w-auto text-accent" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M2 4h14v10H2zM17 7h6l4 4v3H17z" />
      <path d="M17 7l10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="7" cy="16" r="2.6" fill="var(--ink)" /><circle cx="23" cy="16" r="2.6" fill="var(--ink)" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      {PHONE_IS_PLACEHOLDER && (
        <p className="placeholder-note" role="note" data-testid="placeholder-note">
          Placeholder number. Set NEXT_PUBLIC_PHONE to your call-tracking number before running ads.
        </p>
      )}

      <header className="mx-auto flex max-w-4xl items-center gap-2.5 px-5 pt-6">
        <Truck />
        <span className="text-[19px] font-bold tracking-tight">{BRAND}</span>
      </header>

      <main className="mx-auto max-w-4xl px-5">
        <section className="pt-10 pb-8 md:pt-16" aria-labelledby="headline">
          <h1 id="headline" className="text-[38px] leading-[1.08] font-bold tracking-tight text-balance md:text-[54px]">
            Broken down in Darwin?<br />
            Fast local towing.
          </h1>
          <p className="mt-4 text-[19px] leading-snug text-ink md:text-[21px]">
            Local operators, price agreed up front. We&apos;ll get a truck to you.
          </p>

          <div className="mt-7 md:max-w-sm">
            <CallButton where="hero" className="w-full" />
          </div>

          <p className="mt-3 text-[17px] text-muted" data-testid="safety">
            Anyone hurt or in danger?{" "}
            <a href="tel:000" className="safety-link">Call 000 first.</a>
          </p>
        </section>

        <ul className="trust" aria-label="How it works">
          {TRUST.map((t) => (
            <li key={t} className="flex items-center gap-2.5"><Tick /><span>{t}</span></li>
          ))}
        </ul>

        <section className="py-10" aria-label="What happens when you call">
          <ol className="grid gap-4 md:grid-cols-3">
            {POINTS.map((p, i) => (
              <li key={p.title} className="point">
                <span className="point-n" aria-hidden="true">{i + 1}</span>
                <h2 className="mt-3 text-[19px] font-bold leading-tight">{p.title}</h2>
                <p className="mt-1.5 text-[17px] leading-snug text-muted">{p.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-4xl px-5 py-8 text-[16px] text-muted">
          <p className="font-bold text-ink">{BRAND}</p>
          <p className="mt-1">We arrange tows with local operators in Darwin, Northern Territory.</p>
          <p className="mt-3">
            <CallLink where="footer" className="footer-call">Call {PHONE}</CallLink>
          </p>
          <p className="mt-1">Anyone hurt or in danger? <a href="tel:000" className="safety-link">Call 000 first.</a></p>
          <p className="mt-4 text-[14px]">© {new Date().getFullYear()} {BRAND}</p>
        </div>
      </footer>

      <StickyCall />
    </>
  );
}
