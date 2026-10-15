#!/usr/bin/env python3
"""Rewrite social icon lists and JSON-LD sameAs on every page from tools/social-links.json."""
import json, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
urls = json.loads((root/"tools/social-links.json").read_text())
SVG = {
 "facebook": '<path fill="currentColor" d="M13.6 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21z"/>',
 "instagram": '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/>',
 "linkedin": '<path fill="currentColor" d="M4.98 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3.3 9h3.4v11.5H3.3zM9.2 9h3.3v1.6h.05c.46-.87 1.6-1.8 3.3-1.8 3.5 0 4.15 2.3 4.15 5.3v6.4h-3.4v-5.7c0-1.36-.03-3.1-1.9-3.1-1.9 0-2.2 1.48-2.2 3v5.8H9.2z"/>',
 "google": '<path fill="currentColor" d="M12 2.5a7 7 0 0 0-7 7c0 5.2 7 12 7 12s7-6.8 7-12a7 7 0 0 0-7-7zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2z"/>',
}
NAME = {"facebook":"Facebook","instagram":"Instagram","linkedin":"LinkedIn","google":"Google"}
ORDER = ["facebook","instagram","linkedin","google"]
def li(k, labels):
    lab = f"<span>{NAME[k]}</span>" if labels else ""
    return (f'<li><a class="social__btn social__btn--{k}" href="{urls[k]}" target="_blank" rel="noopener" '
            f'aria-label="UnScramble on {NAME[k]} (opens in a new tab)"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{SVG[k]}</svg>{lab}</a></li>')
def build_ul(m):
    cls = m.group(1); labels = "social--labels" in cls
    items = "".join(li(k, labels) for k in ORDER if urls.get(k))
    if not urls.get("google"):
        items += "<!-- Google Business: set \"google\" in tools/social-links.json and run tools/build-social.py -->"
    return f'<ul class="{cls}" aria-label="UnScramble on social media">{items}</ul>'
ul_re = re.compile(r'<ul class="(social [^"]*)"[^>]*>.*?</ul>', re.S)
same_re = re.compile(r'"sameAs":\s*\[[^\]]*\]')
same = '"sameAs": [' + ", ".join(json.dumps(urls[k]) for k in ORDER if urls.get(k)) + ']'
for p in sorted(root.glob("*.html")):
    s = p.read_text(); n = ul_re.sub(build_ul, s); n = same_re.sub(same, n)
    if n != s: p.write_text(n); print("updated", p.name)
