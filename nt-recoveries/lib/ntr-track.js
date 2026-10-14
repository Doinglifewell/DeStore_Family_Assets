/* NT Recoveries tracking. One file, used by both copies of the page: the
   Next page inlines it (components/Tracking.tsx) and scripts/make-html.mjs
   puts it in nt-recoveries.html. It runs from `window.NTR`:

     callNumber      (HTML copy only) the number to put on every Call link
     placeholder     (HTML copy only) the placeholder, to hide its banner once swapped
     ga4             GA4 Measurement ID, "G-…"
     ads             Google Ads tag ID, "AW-…"
     adsCallLabel    Ads conversion label fired on every tap of a Call link
     adsWebsiteLabel Google's forwarding number (left off while dni is set)
     dni             the call-tracking provider's number-swap script (https)

   An ID that is empty or still the placeholder (G-XXXXXXXXXX) is ignored, so
   nothing loads and nothing is counted until it is real. A tag that fails or
   throws never stands between a tap and the phone's dialler: the tel: link
   dials on its own. */
(function (cfg) {
  "use strict";
  cfg = cfg || {};
  var real = function (v) { return typeof v === "string" && v.trim() && !/^(?:G-|AW-)?X+$/i.test(v.trim()) ? v.trim() : ""; };
  var digits = function (s) { return String(s || "").replace(/\D/g, ""); };
  var toTel = function (n) {
    var d = String(n).replace(/[^\d+]/g, "");
    if (d.charAt(0) === "+") return "tel:" + d;
    if (d.indexOf("61") === 0) return "tel:+" + d;
    if (/^(13|18)\d+$/.test(d)) return "tel:" + d;
    return "tel:+61" + d.replace(/^0/, "");
  };

  // The HTML copy: CALL_NUMBER, set once at the top of the file, onto every Call link.
  var number = typeof cfg.callNumber === "string" ? cfg.callNumber.trim() : "";
  if (number) {
    var links = document.querySelectorAll("a[data-call]");
    for (var i = 0; i < links.length; i++) links[i].setAttribute("href", toTel(number));
    var shown = document.querySelectorAll("[data-number]");
    for (var j = 0; j < shown.length; j++) shown[j].textContent = number;
    if (cfg.placeholder && digits(number) !== digits(cfg.placeholder)) {
      var note = document.querySelector("[data-placeholder-note]");
      if (note) note.parentNode.removeChild(note);
    }
  } else {
    var first = document.querySelector("[data-number]");
    number = first ? first.textContent.trim() : "";
  }

  var ga4 = real(cfg.ga4), ads = real(cfg.ads), callLabel = real(cfg.adsCallLabel);
  var websiteLabel = real(cfg.adsWebsiteLabel), dni = real(cfg.dni);
  if (!/^https:\/\/\S+$/.test(dni)) dni = "";
  var load = function (src) {
    var s = document.createElement("script");
    s.async = true; s.src = src;
    document.head.appendChild(s);
  };

  if (ga4 || ads) {
    window.dataLayer = window.dataLayer || [];
    var gtag = window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    load("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4 || ads));
    gtag("js", new Date());
    if (ga4) gtag("config", ga4);
    if (ads) gtag("config", ads);
    // Google's forwarding number, only without a call-tracking script: two scripts swapping one number fight.
    if (ads && websiteLabel && !dni && number) gtag("config", ads + "/" + websiteLabel, { phone_conversion_number: number });

    // Every tap on a tel: link is a GA4 event and a Google Ads conversion. The
    // listener is on the document, so it counts links the call-tracking script
    // rewrites or adds too. 000 (and 112, 106) is never counted: an emergency
    // call is not a lead, and counting it would teach Google to find more.
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
      if (!a) return;
      if (/^(000|112|106)$/.test(digits(a.getAttribute("href")))) return;
      var where = a.getAttribute("data-call") || "page";
      try {
        if (ga4) gtag("event", "click_to_call", { link_location: where, transport_type: "beacon" });
        if (ads && callLabel) gtag("event", "conversion", { send_to: ads + "/" + callLabel, transport_type: "beacon" });
      } catch (err) { /* never in the way of the call */ }
    }, true);
  }

  // The call-tracking provider's dynamic number insertion script.
  if (dni) load(dni);
})(window.NTR);
