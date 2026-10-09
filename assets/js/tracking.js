/**
 * UNSCRAMBLE SITE TRACKING (Meta Pixel + GA4) — the only place the IDs are set.
 * ===========================================================================
 * Loaded on every page with <script src="assets/js/tracking.js" defer>.
 *
 *   Every page            Meta PageView            GA4 page_view
 *   Request Labour sent   Meta Lead                GA4 generate_lead {form:'request-labour'}
 *   Any tel: link click   Meta Contact             GA4 click_to_call
 *
 * Lead / generate_lead fire only when FormSubmit confirms the request
 * (site.js dispatches "unscramble:form-success"), once per submit, with a
 * shared event_id. Never on click, validation errors, failed sends or the
 * honeypot. No form values (names, phones, emails) are ever sent in events.
 *
 * UTMs (utm_source, utm_medium, utm_campaign, utm_content) from the landing URL
 * are kept in sessionStorage and copied into the hidden [data-utm] fields of
 * the Request Labour form, so they arrive in the lead email.
 *
 * GA4 is skipped cleanly until GA4_ID is a real "G-..." ID.
 */
(function () {
  "use strict";

  var META_PIXEL_ID = "1421802529441794";
  var GA4_ID = "GA4_MEASUREMENT_ID";

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  var UTM_STORE = "unscramble_utm";

  var metaOn = /^\d{6,20}$/.test(META_PIXEL_ID);
  var gaOn = /^G-[A-Z0-9]{4,}$/.test(GA4_ID);

  function makeId(prefix) {
    var rand = (window.crypto && crypto.getRandomValues)
      ? Array.prototype.map.call(crypto.getRandomValues(new Uint32Array(2)), function (n) { return n.toString(36); }).join("")
      : Math.random().toString(36).slice(2);
    return prefix + "-" + Date.now().toString(36) + "-" + rand;
  }

  /* ---- UTMs ------------------------------------------------------------- */
  function readUtms() {
    var found = {};
    var any = false;
    try {
      var params = new URLSearchParams(window.location.search);
      UTM_KEYS.forEach(function (key) {
        var v = params.get(key);
        if (v) { found[key] = v.slice(0, 120); any = true; }
      });
    } catch (ignore) { /* old browser */ }
    try {
      if (any) sessionStorage.setItem(UTM_STORE, JSON.stringify(found));
      else found = JSON.parse(sessionStorage.getItem(UTM_STORE) || "{}") || {};
    } catch (ignore) { /* storage blocked */ }
    return found;
  }

  function fillUtmFields(utms) {
    var fields = document.querySelectorAll("input[data-utm]");
    Array.prototype.forEach.call(fields, function (input) {
      var key = input.getAttribute("data-utm");
      if (utms[key]) input.value = utms[key];
    });
  }

  fillUtmFields(readUtms());

  /* ---- Meta Pixel base code -------------------------------------------- */
  if (metaOn) {
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    /* No automatic button/form scraping: we send only the events below. */
    window.fbq("set", "autoConfig", false, META_PIXEL_ID);
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }

  /* ---- GA4 (gtag.js) ---------------------------------------------------- */
  if (gaOn) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(g);
    window.gtag("js", new Date());
    window.gtag("config", GA4_ID); /* sends page_view */
  }

  function meta(name, params, eventId) {
    if (metaOn && window.fbq) window.fbq("track", name, params || {}, eventId ? { eventID: eventId } : undefined);
  }

  function ga(name, params) {
    if (gaOn && window.gtag) window.gtag("event", name, params || {});
  }

  /* ---- Lead: only on confirmed Request Labour success ------------------ */
  var sentLead = false;
  document.addEventListener("unscramble:form-success", function (event) {
    var detail = event.detail || {};
    if (detail.form !== "labour" || sentLead) return;
    sentLead = true;
    var id = detail.submitId || makeId("lead");
    meta("Lead", { content_name: "request-labour" }, id);
    ga("generate_lead", { form: "request-labour", event_id: id });
  });

  /* ---- Contact: every tel: link click ---------------------------------- */
  document.addEventListener("click", function (event) {
    var target = event.target;
    var link = target && target.closest ? target.closest("a[href^='tel:']") : null;
    if (!link) return;
    var id = makeId("call");
    meta("Contact", { content_name: "click-to-call" }, id);
    ga("click_to_call", { event_id: id, link_location: window.location.pathname });
  }, true);
})();
