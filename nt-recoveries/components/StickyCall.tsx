"use client";
/* On a phone, once the hero's Call button has scrolled away, the same button
   waits at the bottom of the screen, so calling is one tap from anywhere on
   the page. It hides again while the hero button (or the footer's number) is
   in view, so two Call buttons are never on screen together. Without
   JavaScript it simply never shows, and the hero button still works. */

import { useEffect, useState } from "react";
import { CallButton } from "./CallButton";

export function StickyCall() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const watched = [...document.querySelectorAll<HTMLElement>("[data-call='hero'], [data-call='footer']")];
    if (!watched.length || typeof IntersectionObserver === "undefined") return;
    const seen = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) seen.set(e.target, e.isIntersecting);
      setShow(![...seen.values()].some(Boolean));
    });
    watched.forEach((el) => { seen.set(el, true); io.observe(el); });
    return () => io.disconnect();
  }, []);
  return (
    <div className={`sticky-call${show ? " on" : ""}`} aria-hidden={!show} data-testid="sticky-call">
      <CallButton where="sticky" className="w-full" />
    </div>
  );
}
