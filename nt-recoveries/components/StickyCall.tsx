/* On a phone, the Call button is pinned to the bottom of the screen the whole
   time, so calling is one tap from anywhere on the page. Never on a computer
   (globals.css hides it from 768px). Plain HTML: it shows even with
   JavaScript off. */

import { CallButton } from "./CallButton";

export function StickyCall() {
  return (
    <div className="sticky-call" data-testid="sticky-call">
      <CallButton where="sticky" size="bar" />
    </div>
  );
}
