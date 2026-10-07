/* UnScramble redesign effects. Vanilla JS, no dependencies.
   Runs after site.js (which owns the menu toggle, scroll reveals, counters and the forms). */
(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* Old homepage anchors now live on their own pages. */
  var moved = { how: "services.html#how", cover: "services.html#cover", why: "services.html#why",
    practice: "services.html#practice", roles: "industries.html#roles", visit: "contact.html#visit" };
  if (document.body.hasAttribute("data-home") && location.hash) {
    var key = location.hash.slice(1);
    if (moved[key]) { location.replace(moved[key]); return; }
  }

  /* Sticky header shrinks; thin gold progress line. */
  var header = document.querySelector(".site-header");
  var bar = document.querySelector(".scroll-progress span");
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (bar) {
      var max = doc.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
    }
    if (header) doc.style.setProperty("--subnav-top", header.offsetHeight + "px");
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* In-page sub-navigation: highlight the section in view. */
  var subLinks = qsa(".subnav a[href^='#']");
  if (subLinks.length && "IntersectionObserver" in window) {
    var map = {};
    subLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        subLinks.forEach(function (a) { a.classList.remove("is-active"); });
        if (map[e.target.id]) map[e.target.id].classList.add("is-active");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
  }

  if (reduce || !doc.classList.contains("motion")) return;

  /* Safety net for very tall sections on phones: site.js waits for 28% of a section to be visible,
     which a section several screens tall never reaches. Reveal as soon as it enters the viewport. */
  var tall = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); tall.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
  qsa("[data-reveal].reveal").forEach(function (el) { if (!el.classList.contains("is-in")) tall.observe(el); });

  /* Hero headline: words rise in one after another. */
  qsa("[data-split]").forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute("aria-label", el.textContent.trim());
    el.textContent = "";
    words.forEach(function (w, i) {
      var s = document.createElement("span");
      s.className = "w"; s.setAttribute("aria-hidden", "true");
      s.style.setProperty("--i", i); s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.classList.add("split-words");
  });

  /* Grids: children fade up in sequence when the grid scrolls into view. */
  var grids = qsa("[data-stagger]");
  grids.forEach(function (g) { Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty("--i", i); }); });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
  grids.forEach(function (g) { io.observe(g); });
})();

/* Infographics: add .is-in when each graphic scrolls into view.
   Without motion (reduced-motion or no IntersectionObserver) the CSS final state is shown as-is. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var els = Array.prototype.slice.call(document.querySelectorAll(".ig, .stats--ig"));
  if (!els.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window) || !doc.classList.contains("motion")) {
    els.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });
  els.forEach(function (el) {
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9 && r.bottom > 0) el.classList.add("is-in");
    else io.observe(el);
  });
})();
