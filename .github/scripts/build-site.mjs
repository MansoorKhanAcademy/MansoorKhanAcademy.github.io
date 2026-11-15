// Builds the website into _site/:
//  - adds the shared menu (nav.js) to every page that should have it
//  - writes sitemap.xml and pages.json (used by the menu and the Tools page)
//  - adds an automatic page list to llms.txt
// Your source files are never changed; only the published copy is.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const cfg = JSON.parse(fs.readFileSync("site.config.json", "utf8"));
const SITE = cfg.siteUrl.replace(/\/$/, "");
const OUT = "_site";
const SKIP = new Set([".git", ".github", "node_modules", OUT]);

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(".", OUT, {
  recursive: true,
  filter: (src) => {
    const top = src.split(path.sep)[0];
    return !SKIP.has(top) && src !== "site.config.json";
  },
});

// ---- find pages (every folder with an index.html) ----
const pages = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP.has(e.name) && !e.name.startsWith(".")) walk(p); }
    else if (e.name === "index.html") pages.push(p);
  }
}
walk(".");

const starts = (rel, list) => (list || []).some((x) => rel === x || (x.endsWith("/") && rel.startsWith(x)));
const clean = (s) => s.replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const today = new Date().toISOString().slice(0, 10);

function lastmod(file) {
  try {
    const d = execSync(`git log -1 --format=%cs -- "${file}"`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    if (d) return d;
  } catch (e) {}
  return today;
}

const list = [];
for (const file of pages) {
  const rel = file.split(path.sep).join("/");           // e.g. Tools/video-editor/index.html
  const dirRel = rel.replace(/index\.html$/, "");         // "" or "Tools/video-editor/"
  const html = fs.readFileSync(file, "utf8");
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
  const title = clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, dirRel || "Home"])[1]);
  const desc = clean((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [, ""])[1]);
  const url = "/" + dirRel.split("/").filter(Boolean).map(encodeURIComponent).join("/") + (dirRel ? "/" : "");
  const label = (cfg.labels && cfg.labels[dirRel]) || title.split(/\s[|–—-]\s|:\s/)[0].trim();
  const isTools = dirRel.startsWith("Tools/") && dirRel !== "Tools/";
  list.push({ rel, dirRel, url, title, label, desc, group: isTools ? "tools" : "page", lastmod: lastmod(file),
    inMenu: dirRel !== "" && dirRel !== "Tools/" && !starts(dirRel, cfg.hideFromMenu) && !((cfg.hideChildren || []).some((x) => dirRel.startsWith(x) && dirRel !== x)),
    inSitemap: !starts(dirRel, cfg.excludeFromSitemap),
    nav: true });
}
list.sort((a, b) => a.url.localeCompare(b.url));


// Real icon files (Google ignores icons that are built into the page) and the site name for search results.
function headFixes(h, isHome) {
  if (fs.existsSync(path.join(OUT, "favicon.ico"))) {
    h = h.replace(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*>\s*/gi, "").replace(/<link[^>]+rel=["']apple-touch-icon["'][^>]*>\s*/gi, "");
    const icons = '<link rel="icon" href="/favicon.ico" sizes="any">\n<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n';
    h = /<\/head>/i.test(h) ? h.replace(/<\/head>/i, icons + "</head>") : icons + h;
  }
  if (isHome) {
    if (!/name=["']application-name["']/i.test(h)) h = h.replace(/<\/head>/i, '<meta name="application-name" content="Mansoor Khan Academy">\n</head>');
    if (!/property=["']og:site_name["']/i.test(h)) h = h.replace(/<\/head>/i, '<meta property="og:site_name" content="Mansoor Khan Academy">\n</head>');
    h = h.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/gi, (m, s, body, e) => {
      try {
        const d = JSON.parse(body); const arr = Array.isArray(d) ? d : [d]; let ch = false;
        arr.forEach((x) => { if (x && x["@type"] === "WebSite") { x.name = "Mansoor Khan Academy"; x.alternateName = ["Mansoor Khan Academy Tools", "Mansoor Tools", "MKA"]; ch = true; } });
        return ch ? s + JSON.stringify(d) + e : m;
      } catch (err) { return m; }
    });
  }
  return h;
}

// ---- 1. menu script on EVERY html page (except the Google verification file and pages in "noNav") ----
const allHtml = [];
(function collect(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p);
    else if (/\.html?$/i.test(e.name) && !/^google[0-9a-f]+\.html$/i.test(e.name)) allHtml.push(p);
  }
})(OUT);
let injected = 0;
for (const f of allHtml) {
  const rel = path.relative(OUT, f).split(path.sep).join("/");
  if (starts(rel, cfg.noNav)) continue;
  let h = fs.readFileSync(f, "utf8");
  h = headFixes(h, rel === "index.html");
  if (!h.includes("/nav.js")) {
    const attr = starts(rel, cfg.hideOwnHeader) ? " data-hide-header" : "";
    const tag = `<script src="/nav.js" defer${attr}></script>\n`;
    const i = h.toLowerCase().lastIndexOf("</body>");
    h = i >= 0 ? h.slice(0, i) + tag + h.slice(i) : h + "\n" + tag;
    injected++;
  }
  fs.writeFileSync(f, h);
}

// ---- 1b. Google Tag Manager on EVERY html page (set "gtmId" in site.config.json; leave empty to turn off) ----
if (cfg.gtmId && /^GTM-[A-Z0-9]+$/.test(cfg.gtmId)) {
  const id = cfg.gtmId;
  const head = `<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>\n<!-- End Google Tag Manager -->\n`;
  const body = `<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n<!-- End Google Tag Manager (noscript) -->\n`;
  let n = 0;
  for (const f of allHtml) {
    let h = fs.readFileSync(f, "utf8");
    if (h.includes("googletagmanager.com/gtm.js")) continue;
    h = /<head[^>]*>/i.test(h) ? h.replace(/<head[^>]*>/i, (m) => m + "\n" + head) : head + h;
    h = /<body[^>]*>/i.test(h) ? h.replace(/<body[^>]*>/i, (m) => m + "\n" + body) : h;
    fs.writeFileSync(f, h);
    n++;
  }
  console.log("GTM added to " + n + " pages");
}

// ---- 2. sitemap.xml ----
const pr = (u) => (u === "/" ? "1.0" : u === "/Tools/" ? "0.9" : "0.8");
const sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
  .concat(list.filter((p) => p.inSitemap).map((p) => `  <url><loc>${SITE}${p.url}</loc><lastmod>${p.lastmod}</lastmod><changefreq>monthly</changefreq><priority>${pr(p.url)}</priority></url>`))
  .concat("</urlset>", "").join("\n");
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sm);

// ---- 3. pages.json (menu + Tools page) ----
fs.writeFileSync(path.join(OUT, "pages.json"), JSON.stringify({
  extraLinks: cfg.extraLinks || [],
  pages: list.filter((p) => p.inMenu || p.group === "tools").map((p) => ({ url: p.url, label: p.label, title: p.title, desc: p.desc, group: p.group, menu: p.inMenu })),
}, null, 1));

// ---- 4. llms.txt: automatic page list ----
const lf = path.join(OUT, "llms.txt");
if (fs.existsSync(lf)) {
  let t = fs.readFileSync(lf, "utf8").replace(/\n*<!-- AUTO-PAGES -->[\s\S]*$/, "").trimEnd();
  t += "\n\n<!-- AUTO-PAGES -->\n## All pages\n\n" + list.filter((p) => p.inSitemap).map((p) => `- [${p.label || "Home"}](${SITE}${p.url})${p.desc ? ": " + p.desc : ""}`).join("\n") + "\n";
  fs.writeFileSync(lf, t);
}

console.log(`Pages found: ${list.length}. Menu added to ${injected} page(s). Sitemap has ${list.filter((p) => p.inSitemap).length} URL(s).`);
list.forEach((p) => console.log(" -", p.url, "|", p.label, "", p.inMenu ? "" : "(not in menu)"));
