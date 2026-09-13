/**
 * Builds the public Matify site in the per-app path structure the Marketplace
 * listing fields point at:
 *
 *   /apps/access-auditor-for-jira/
 *   /apps/access-auditor-for-jira/docs/
 *   /apps/access-auditor-for-jira/privacy/
 *   /apps/access-auditor-for-jira/security-privacy/
 *   /apps/access-auditor-for-jira/terms/
 *   /apps/access-auditor-for-jira/support/
 *
 * Directory-per-page, so every URL a listing field carries ends in a slash and
 * stays stable if a page is ever split.
 *
 * Static output. No cookies, no analytics, no tracker, no external font, no
 * JavaScript at all — the pages are read, not operated, and a security
 * statement that loaded a third-party script would be contradicting itself.
 *
 *   node MarketplaceRelease/PublicSite/build-apps.cjs
 */
const fs = require('fs');
const path = require('path');

// Requiring the flat-site builder rebuilds it and hands over the Markdown
// converter, so there is exactly one converter in the repository.
const { markdownToHtml } = require('./build.cjs');

process.chdir(path.resolve(__dirname, '..', '..'));

const ROOT = 'MarketplaceRelease/PublicSite';
const APP = 'apps/access-auditor-for-jira';
const DOCS = 'MarketplaceRelease/Documentation';
const LEGAL = 'MarketplaceRelease/LegalDrafts';
const PRIV = 'MarketplaceRelease/PrivacySecurity';

/* ------------------------------------------------------------------ theme -- */

/* Matify: dark graphite, neutral, restrained gold. Readability first — the
   accent marks structure and never carries meaning on its own. */
const CSS = `
:root{
  --graphite-900:#14171a;
  --graphite-800:#1a1e22;
  --graphite-700:#22272c;
  --graphite-600:#2c333a;
  --line:#333b43;
  --fg:#e6e9ec;
  --fg-dim:#a8b1ba;
  --fg-faint:#7d868f;
  --gold:#c8a45c;
  --gold-dim:#8d7440;
  --max:56rem;
  --sans:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,"Cascadia Mono",Menlo,Consolas,"Liberation Mono",monospace;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;background:var(--graphite-900);color:var(--fg);
  font-family:var(--sans);font-size:16px;line-height:1.65;
  -webkit-font-smoothing:antialiased;
}
.wrap{max-width:var(--max);margin:0 auto;padding:0 1.5rem}

header.site{border-bottom:1px solid var(--line);background:var(--graphite-800)}
header.site .wrap{padding-top:1.5rem;padding-bottom:1.5rem}
.brand{display:flex;align-items:baseline;gap:.7rem;flex-wrap:wrap}
.brand .name{font-size:1.05rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.brand .sep{color:var(--fg-faint)}
.brand .product{font-size:1.05rem;font-weight:600;color:var(--fg)}

nav.site{background:var(--graphite-800);border-bottom:1px solid var(--line)}
nav.site ul{margin:0 auto;max-width:var(--max);padding:0 1.5rem;list-style:none;
  display:flex;flex-wrap:wrap;gap:1.4rem}
nav.site a{display:inline-block;padding:.65rem 0;color:var(--fg-dim);
  text-decoration:none;font-size:.9rem;border-bottom:2px solid transparent}
nav.site a:hover,nav.site a:focus-visible{color:var(--fg)}
nav.site a[aria-current="page"]{color:var(--fg);border-bottom-color:var(--gold)}

main{padding:2.6rem 0 4rem}
main .wrap>:first-child{margin-top:0}

h1{font-size:clamp(1.65rem,4vw,2.15rem);line-height:1.18;letter-spacing:-.015em;
  font-weight:700;margin:0 0 .6rem;text-wrap:balance}
h2{font-size:1.22rem;font-weight:600;letter-spacing:-.008em;margin:2.6rem 0 .7rem;
  padding-bottom:.45rem;border-bottom:1px solid var(--line);text-wrap:balance}
h3{font-size:1.02rem;font-weight:600;margin:1.8rem 0 .4rem;color:var(--fg)}
h2+h3{margin-top:1rem}

p{margin:0 0 1.05rem}
ul,ol{margin:0 0 1.05rem;padding-left:1.35rem}
li{margin-bottom:.35rem}
strong{font-weight:600;color:#f2f5f7}
em{color:var(--fg-dim)}

a{color:var(--gold);text-decoration:underline;text-underline-offset:.15em;
  text-decoration-color:var(--gold-dim)}
a:hover,a:focus-visible{text-decoration-color:var(--gold)}

code{font-family:var(--mono);font-size:.85em;background:var(--graphite-700);
  border:1px solid var(--line);border-radius:3px;padding:.06em .34em;color:#dfe6ec}

.lede{font-size:1.06rem;color:var(--fg-dim);max-width:60ch;margin:0 0 1.6rem}

.meta{display:flex;flex-wrap:wrap;gap:.45rem;margin:0 0 2rem;padding:0;list-style:none}
.meta li{font-family:var(--mono);font-size:.76rem;color:var(--fg-dim);
  background:var(--graphite-700);border:1px solid var(--line);border-radius:3px;
  padding:.26rem .6rem}

.tablewrap{overflow-x:auto;margin:0 0 1.05rem;border:1px solid var(--line);
  border-radius:4px;background:var(--graphite-800)}
table{border-collapse:collapse;width:100%;font-size:.92rem}
th,td{text-align:left;vertical-align:top;padding:.55rem .8rem;
  border-bottom:1px solid var(--line)}
th{font-size:.74rem;letter-spacing:.06em;text-transform:uppercase;font-weight:600;
  color:var(--fg-dim);background:var(--graphite-700);white-space:nowrap}
tbody tr:last-child td{border-bottom:0}

blockquote{margin:0 0 1.05rem;padding:.7rem 1rem;border-left:3px solid var(--gold-dim);
  background:var(--graphite-800);color:var(--fg-dim)}
hr{border:0;border-top:1px solid var(--line);margin:2.4rem 0}

.callout{border:1px solid var(--line);border-left:3px solid var(--gold);
  border-radius:0 4px 4px 0;background:var(--graphite-800);
  padding:.9rem 1.1rem;margin:0 0 1.4rem}
.callout>:last-child{margin-bottom:0}
.callout .label{display:block;font-family:var(--mono);font-size:.72rem;
  letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin-bottom:.3rem}

.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(15rem,1fr));
  gap:1rem;margin:0 0 1.5rem;padding:0;list-style:none}
.cards li{margin:0}
.cards a.card{display:block;height:100%;padding:1rem 1.1rem;text-decoration:none;
  background:var(--graphite-800);border:1px solid var(--line);border-radius:4px;color:var(--fg)}
.cards a.card:hover,.cards a.card:focus-visible{border-color:var(--gold-dim)}
.cards .card-title{display:block;font-weight:600;margin-bottom:.25rem;color:var(--gold)}
.cards .card-body{display:block;font-size:.9rem;color:var(--fg-dim);line-height:1.5}

footer.site{border-top:1px solid var(--line);background:var(--graphite-800);
  color:var(--fg-faint);font-size:.86rem}
footer.site .wrap{padding-top:1.5rem;padding-bottom:2rem}
footer.site p{margin:0 0 .3rem}

:focus-visible{outline:2px solid var(--gold);outline-offset:2px}

@media print{
  body{background:#fff;color:#000}
  nav.site,footer.site{display:none}
  a{color:#000}
}
`;

/* ------------------------------------------------------------------ pages -- */

const NAV = [
  ['', 'Overview'],
  ['docs/', 'Documentation'],
  ['security-privacy/', 'Security & privacy'],
  ['privacy/', 'Privacy policy'],
  ['terms/', 'Terms'],
  ['support/', 'Support'],
];

const built = [];

/**
 * @param {string} slug   '' for the app root, otherwise 'docs/' and friends
 * @param {string} title  page title, without the product suffix
 * @param {string} desc   meta description
 * @param {string} body   page HTML, already converted
 */
function page(slug, title, desc, body) {
  const up = slug === '' ? '' : '../';
  const nav = NAV.map(([href, label]) => {
    const target = href === '' ? up || './' : up + href;
    const current = href === slug ? ' aria-current="page"' : '';
    return `<li><a href="${target}"${current}>${label}</a></li>`;
  }).join('');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Access Auditor for Jira — Matify</title>
<meta name="description" content="${desc}">
<meta name="robots" content="index,follow">
<meta name="color-scheme" content="dark">
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="wrap"><div class="brand">
  <span class="name">Matify</span>
  <span class="sep">/</span>
  <span class="product">Access Auditor for Jira</span>
</div></div></header>
<nav class="site" aria-label="Sections"><ul>${nav}</ul></nav>
<main><div class="wrap">
${body}
</div></main>
<footer class="site"><div class="wrap">
  <p>Access Auditor for Jira is published by Matify for Atlassian Jira Cloud.</p>
  <p>Security and support: <a href="mailto:mira.maty@web.de">mira.maty@web.de</a></p>
  <p>Copyright 2026 Matify. All Rights Reserved.</p>
</div></footer>
</body>
</html>
`;
  const dir = path.join(ROOT, APP, slug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, html);
  built.push({ url: '/' + APP + '/' + slug, file, bytes: Buffer.byteLength(html) });
}

function fromMarkdown(slug, title, desc, sourceFile) {
  const md = fs.readFileSync(sourceFile, 'utf8');
  page(slug, title, desc, markdownToHtml(md));
}

/* --------------------------------------------------------- the app root -- */

page(
  '',
  'Overview',
  'Access Auditor for Jira by Matify: a read-only Jira Cloud permission audit app. Documentation, security and privacy statement, privacy policy, terms and support.',
  `<h1>Access Auditor for Jira</h1>
<p class="lede">Who can access what in your Jira Cloud site, and why — resolved down to
the people who hold each permission and the chain of configuration that gave it to
them.</p>
<ul class="meta">
  <li>Atlassian Forge app</li>
  <li>Read-only against Jira</li>
  <li>No external data egress</li>
  <li>Jira Cloud</li>
</ul>

<ul class="cards">
  <li><a class="card" href="docs/">
    <span class="card-title">Documentation</span>
    <span class="card-body">Setup, the eight tabs, the twelve risk rules, every declared scope, the known limits and the error codes.</span>
  </a></li>
  <li><a class="card" href="security-privacy/">
    <span class="card-title">Security &amp; privacy statement</span>
    <span class="card-body">Hosting, the data processed, personal data, storage, residency, egress, scopes, retention, logging and subprocessors.</span>
  </a></li>
  <li><a class="card" href="privacy/">
    <span class="card-title">Privacy policy</span>
    <span class="card-body">The formal policy covering the app and this site.</span>
  </a></li>
  <li><a class="card" href="terms/">
    <span class="card-title">End user terms</span>
    <span class="card-body">The terms under which the app is licensed.</span>
  </a></li>
  <li><a class="card" href="support/">
    <span class="card-title">Support</span>
    <span class="card-body">How to reach Matify, and what to send so the first reply is useful.</span>
  </a></li>
</ul>

<h2>What it does</h2>
<p>Access Auditor scans your site's permission schemes, project roles, groups, shared
filters and shared dashboards, resolves each grant to the people and groups who
actually hold it, and reports the configurations most likely to be a risk. It then
tracks what changes between scans, so an access review is a comparison rather than a
fresh investigation.</p>

<h2>Security posture in one paragraph</h2>
<p>The app runs entirely on Atlassian Forge: Atlassian hosts both the compute and the
storage, inside your own Jira Cloud installation. It declares no ability to send data
outside Atlassian and no ability to write anything to Jira, and both of those are
enforced by the platform rather than by the app's own discipline. It does store
personal data — Atlassian account identifiers and display names — because an access
review that cannot name who holds a permission is not an access review. The
<a href="security-privacy/">security and privacy statement</a> sets out exactly what,
where, for how long, and how to remove it.</p>`,
);

/* -------------------------------------------------------- the five pages -- */

fromMarkdown(
  'security-privacy/',
  'Data security and privacy statement',
  'How Access Auditor for Jira by Matify processes, stores and protects data: Forge hosting, personal data, storage, residency, zero external egress, scopes, retention, personal data reporting, logging and subprocessors.',
  path.join(PRIV, 'Security_Privacy_Statement.md'),
);

fromMarkdown(
  'privacy/',
  'Privacy policy',
  'The privacy policy for Access Auditor for Jira, published by Matify.',
  path.join(LEGAL, 'Privacy_Policy.md'),
);

fromMarkdown(
  'terms/',
  'End user terms',
  'The end user terms for Access Auditor for Jira, published by Matify.',
  path.join(LEGAL, 'End_User_Terms_Draft.md'),
);

/* Documentation lands as one page per source document, with the README as its
   index; the listing's Documentation field points at the index. */
const DOC_PAGES = [
  ['docs/', 'Documentation', 'README.md'],
  ['docs/getting-started/', 'Getting started', 'Getting_Started.md'],
  ['docs/user-guide/', 'User guide', 'User_Guide.md'],
  ['docs/permissions-and-security/', 'Permissions and security', 'Permissions_and_Security.md'],
  ['docs/privacy-and-data/', 'Privacy and data', 'Privacy_and_Data.md'],
  ['docs/known-limitations/', 'Known limitations', 'Known_Limitations.md'],
  ['docs/troubleshooting/', 'Troubleshooting', 'Troubleshooting.md'],
  ['docs/faq/', 'FAQ', 'FAQ.md'],
  ['docs/changelog/', 'Changelog', 'CHANGELOG.md'],
];
for (const [slug, title, src] of DOC_PAGES) {
  if (slug === 'docs/') continue; // handled below, so its cross-links can be rewritten
  fromMarkdown(slug, title, title + ' for Access Auditor for Jira, published by Matify.', path.join(DOCS, src));
}

/* The README's cross-links point at sibling .md files; on the site they are
   sibling directories. */
{
  const md = fs.readFileSync(path.join(DOCS, 'README.md'), 'utf8');
  let html = markdownToHtml(md);
  const MAP = {
    'Getting_Started.html': 'getting-started/',
    'User_Guide.html': 'user-guide/',
    'Permissions_and_Security.html': 'permissions-and-security/',
    'Privacy_and_Data.html': 'privacy-and-data/',
    'Known_Limitations.html': 'known-limitations/',
    'Troubleshooting.html': 'troubleshooting/',
    'FAQ.html': 'faq/',
    'CHANGELOG.html': 'changelog/',
  };
  for (const [from, to] of Object.entries(MAP)) {
    html = html.split('href="' + from + '"').join('href="' + to + '"');
  }
  page('docs/', 'Documentation', 'Documentation for Access Auditor for Jira, published by Matify.', html);
}

/* Support is written for the site rather than converted from a document. */
page(
  'support/',
  'Support',
  'How to get support for Access Auditor for Jira from Matify.',
  `<h1>Support</h1>
<p class="lede">Access Auditor for Jira is supported by Matify. One address, read by a
person.</p>

<div class="callout">
  <span class="label">Two ways in, both fine</span>
  <p><strong>Public tracker.</strong>
    <a href="https://github.com/Matify25/matify-support/issues/new/choose">Open a ticket on GitHub</a>
    &mdash; support questions, bug reports and feature requests, with a form that
    asks for what an answer needs. Reading
    <a href="https://github.com/Matify25/matify-support/issues">what is already reported</a>
    needs no account; opening a ticket needs a free GitHub one.</p>
  <p><strong>Email.</strong> <a href="mailto:mira.maty@web.de">mira.maty@web.de</a>
    &mdash; no account required, and the right choice for anything you would
    rather not write in public.</p>
</div>

<div class="callout">
  <span class="label">Security</span>
  <p>Never report a suspected vulnerability as a public issue. Email
    <a href="mailto:mira.maty@web.de">mira.maty@web.de</a> with
    <em>security</em> in the subject line, or use GitHub's private reporting from
    the <a href="https://github.com/Matify25/matify-support/security/policy">security
    policy</a>. A flaw posted in public is readable by everyone before a fix
    exists.</p>
</div>

<h2>Before you write</h2>
<p>Two pages answer most questions faster than an email round trip:
the <a href="../docs/troubleshooting/">troubleshooting page</a>, which lists every
error code the app can show and what to do about each, and
the <a href="../docs/faq/">FAQ</a>.</p>

<h2>What to send</h2>
<p>If something went wrong rather than being unclear, include a diagnostic report:</p>
<ol>
  <li>Open the app in Jira and go to the <strong>Diagnostics</strong> tab.</li>
  <li>Select <strong>Copy diagnostic report</strong>.</li>
  <li>Paste it into your email, with a short description of what you expected and
    what happened instead.</li>
</ol>
<p>The report is built to contain no personal data and no credentials — no project
name, group name, account identifier or permission holder appears in it. It answers
most of the questions a first reply would otherwise have to ask.</p>

<h2>Reporting a security issue</h2>
<p>Please include enough detail to reproduce it. How the app handles data, and
what it deliberately does not do, is set out in the
<a href="../security-privacy/">security and privacy statement</a> &mdash; if you
find something that contradicts it, that is worth reporting in itself.</p>

<h2>What is not supported</h2>
<p>Jira Data Center and Jira Server; the access model of team-managed projects; and
any Atlassian product other than Jira Cloud. These boundaries are described in
<a href="../docs/known-limitations/">known limitations</a> rather than discovered
after purchase.</p>`,
);

/* -------------------------------------------------------------- site root -- */

/* GitHub Pages otherwise runs the output through Jekyll, which drops any path
   beginning with an underscore. */
fs.writeFileSync(path.join(ROOT, '.nojekyll'), '');

fs.writeFileSync(
  path.join(ROOT, 'apps', 'index.html'),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Apps — Matify</title>
<meta name="description" content="Atlassian Marketplace apps published by Matify.">
<meta name="color-scheme" content="dark">
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="wrap"><div class="brand">
  <span class="name">Matify</span>
</div></div></header>
<main><div class="wrap">
<h1>Apps</h1>
<p class="lede">Atlassian Marketplace apps published by Matify.</p>
<ul class="cards">
  <li><a class="card" href="access-auditor-for-jira/">
    <span class="card-title">Access Auditor for Jira</span>
    <span class="card-body">Read-only permission auditing for Jira Cloud: who can access what, and why.</span>
  </a></li>
</ul>
</div></main>
<footer class="site"><div class="wrap">
  <p>Security and support: <a href="mailto:mira.maty@web.de">mira.maty@web.de</a></p>
  <p>Copyright 2026 Matify. All Rights Reserved.</p>
</div></footer>
</body>
</html>
`,
);

console.log('\nMatify app site written under ' + ROOT + '/' + APP + '\n');
for (const b of built) {
  console.log('  ' + b.url.padEnd(48) + String(b.bytes).padStart(7) + ' bytes');
}
console.log('\n  ' + built.length + ' pages, plus /apps/ and .nojekyll');
