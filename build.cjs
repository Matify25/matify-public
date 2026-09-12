/**
 * Builds the public documentation site from the Markdown sources.
 *
 * No dependencies: a small Markdown subset covering exactly what these documents
 * use — headings, paragraphs, lists, tables, fenced and inline code, links,
 * emphasis, blockquotes and rules.
 */
const fs = require('fs');
const path = require('path');

// Run from anywhere: paths below are relative to the repository root, which is
// two levels above this script.
process.chdir(path.resolve(__dirname, '..', '..'));
const OUT = 'MarketplaceRelease/PublicSite';
const DOCS = 'MarketplaceRelease/Documentation';
const LEGAL = 'MarketplaceRelease/LegalDrafts';

fs.mkdirSync(OUT, { recursive: true });

/* ------------------------- Markdown ------------------------- */

function escapeHtml(s) {
  return s
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;');
}

function inline(s) {
  let t = escapeHtml(s);
  // code spans first, so their contents are not further transformed
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(c);
    return `\u0000${codes.length - 1}\u0000`;
  });
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
    let target = href;
    if (/^https?:/.test(href)) {
      return `<a href="${href}" rel="noopener noreferrer" target="_blank">${text}</a>`;
    }
    // Markdown cross-links become the generated page names.
    target = href.replace(/^\.\.\//, '').replace(/\.md(#.*)?$/, '.html$1');
    target = target.split('/').pop();
    return `<a href="${target}">${text}</a>`;
  });
  t = t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(codes[Number(i)])}</code>`);
  return t;
}

function markdownToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let i = 0;

  const flushParagraph = (buf) => {
    if (buf.length) {
      out.push(`<p>${inline(buf.join(' '))}</p>`);
      buf.length = 0;
    }
  };
  const para = [];

  while (i < lines.length) {
    const line = lines[i];

    if (/^```/.test(line)) {
      flushParagraph(para);
      i += 1;
      const code = [];
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph(para);
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^---+\s*$/.test(line)) {
      flushParagraph(para);
      out.push('<hr>');
      i += 1;
      continue;
    }

    // table
    if (/^\|/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1])) {
      flushParagraph(para);
      const cells = (row) =>
        row.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const body = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        body.push(cells(lines[i]));
        i += 1;
      }
      out.push(
        '<div class="table-wrap"><table><thead><tr>' +
          head.map((h) => `<th>${inline(h)}</th>`).join('') +
          '</tr></thead><tbody>' +
          body
            .map(
              (r) => '<tr>' + r.map((c) => `<td>${inline(c)}</td>`).join('') + '</tr>',
            )
            .join('') +
          '</tbody></table></div>',
      );
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph(para);
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i += 1;
      }
      out.push('<ul>' + items.map((it) => `<li>${inline(it)}</li>`).join('') + '</ul>');
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushParagraph(para);
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      out.push('<ol>' + items.map((it) => `<li>${inline(it)}</li>`).join('') + '</ol>');
      continue;
    }

    if (/^>\s?/.test(line)) {
      flushParagraph(para);
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
      continue;
    }

    if (line.trim() === '') {
      flushParagraph(para);
      i += 1;
      continue;
    }

    para.push(line.trim());
    i += 1;
  }
  flushParagraph(para);
  return out.join('\n');
}

/* ------------------------- Page shell ------------------------- */

const NAV = [
  ['index.html', 'Overview'],
  ['Getting_Started.html', 'Getting started'],
  ['User_Guide.html', 'User guide'],
  ['Permissions_and_Security.html', 'Permissions & security'],
  ['Privacy_and_Data.html', 'Privacy & data'],
  ['Troubleshooting.html', 'Troubleshooting'],
  ['FAQ.html', 'FAQ'],
  ['Known_Limitations.html', 'Known limitations'],
  ['CHANGELOG.html', 'Changelog'],
  ['support.html', 'Support'],
  ['privacy.html', 'Privacy policy'],
  ['terms.html', 'Terms'],
];

const CSS = `
:root{
  --bg:#ffffff; --fg:#172b4d; --muted:#5e6c84; --line:#dfe1e6;
  --accent:#0b2f52; --accent-fg:#ffffff; --code-bg:#f4f5f7; --flag:#ffab00;
  --max:64rem;
}
@media (prefers-color-scheme:dark){
  :root{ --bg:#0e1117; --fg:#e6edf3; --muted:#9198a1; --line:#2a2f37;
         --accent:#0b2f52; --code-bg:#161b22; }
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);
  font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
header{background:var(--accent);color:var(--accent-fg);padding:1.25rem 1.5rem}
header .brand{display:flex;align-items:center;gap:.75rem;max-width:var(--max);margin:0 auto}
header .mark{width:28px;height:28px;border-radius:6px;background:#fff;position:relative;flex:none}
header .mark::after{content:"";position:absolute;right:5px;bottom:5px;width:7px;height:7px;background:var(--flag)}
header h1{font-size:1.05rem;margin:0;font-weight:600;letter-spacing:.2px}
header .vendor{margin-left:auto;font-size:.85rem;opacity:.8}
nav{border-bottom:1px solid var(--line);background:var(--bg);position:sticky;top:0;z-index:5}
nav ul{max-width:var(--max);margin:0 auto;padding:0 1.5rem;list-style:none;display:flex;
  flex-wrap:wrap;gap:.25rem 1.1rem}
nav a{display:inline-block;padding:.7rem 0;color:var(--muted);text-decoration:none;font-size:.9rem}
nav a:hover,nav a:focus{color:var(--fg)}
nav a[aria-current="page"]{color:var(--fg);box-shadow:inset 0 -2px 0 var(--flag)}
main{max-width:var(--max);margin:0 auto;padding:2rem 1.5rem 4rem}
h1,h2,h3,h4{line-height:1.25;margin:2rem 0 .75rem}
main>h1:first-child{margin-top:0;font-size:1.9rem}
h2{font-size:1.35rem;padding-top:.5rem;border-top:1px solid var(--line)}
h3{font-size:1.1rem}
h4{font-size:1rem;color:var(--muted)}
p,ul,ol{margin:.75rem 0}
li{margin:.3rem 0}
a{color:#0b62c4}
@media (prefers-color-scheme:dark){a{color:#79b8ff}}
code{background:var(--code-bg);padding:.12em .38em;border-radius:4px;
  font:0.88em/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
pre{background:var(--code-bg);padding:1rem;border-radius:6px;overflow-x:auto;
  border:1px solid var(--line)}
pre code{background:none;padding:0}
.table-wrap{overflow-x:auto;margin:1rem 0}
table{border-collapse:collapse;width:100%;font-size:.94rem}
th,td{border:1px solid var(--line);padding:.5rem .65rem;text-align:left;vertical-align:top}
th{background:var(--code-bg);font-weight:600}
blockquote{margin:1rem 0;padding:.6rem 1rem;border-left:3px solid var(--flag);
  background:var(--code-bg);color:var(--muted)}
hr{border:0;border-top:1px solid var(--line);margin:2rem 0}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:.85rem}
footer div{max-width:var(--max);margin:0 auto;padding:1.5rem}
.notice{border:1px solid var(--flag);border-left-width:4px;border-radius:4px;
  padding:.85rem 1rem;margin:1.5rem 0;background:var(--code-bg)}
`;

function page(file, title, bodyHtml) {
  const nav = NAV.map(
    ([href, label]) =>
      `<li><a href="${href}"${href === file ? ' aria-current="page"' : ''}>${label}</a></li>`,
  ).join('');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Access Auditor for Jira</title>
<meta name="description" content="Documentation for Access Auditor for Jira, a read-only Jira Cloud permission audit app by Matify.">
<style>${CSS}</style>
</head>
<body>
<header><div class="brand">
  <span class="mark" aria-hidden="true"></span>
  <h1>Access Auditor for Jira</h1>
  <span class="vendor">by Matify</span>
</div></header>
<nav aria-label="Documentation"><ul>${nav}</ul></nav>
<main>
${bodyHtml}
</main>
<footer><div>
  Copyright 2026 Matify. All Rights Reserved. &middot;
  Support: <a href="mailto:mira.maty@web.de">mira.maty@web.de</a>
</div></footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, file), html);
  return html.length;
}

/* ------------------------- Build ------------------------- */

const built = [];

function convert(sourceFile, outFile, title) {
  const md = fs.readFileSync(sourceFile, 'utf8');
  const size = page(outFile, title, markdownToHtml(md));
  built.push({ outFile, source: sourceFile, bytes: size });
}

convert(path.join(DOCS, 'README.md'), 'index.html', 'Overview');
convert(path.join(DOCS, 'Getting_Started.md'), 'Getting_Started.html', 'Getting started');
convert(path.join(DOCS, 'User_Guide.md'), 'User_Guide.html', 'User guide');
convert(
  path.join(DOCS, 'Permissions_and_Security.md'),
  'Permissions_and_Security.html',
  'Permissions and security',
);
convert(path.join(DOCS, 'Privacy_and_Data.md'), 'Privacy_and_Data.html', 'Privacy and data');
convert(path.join(DOCS, 'Troubleshooting.md'), 'Troubleshooting.html', 'Troubleshooting');
convert(path.join(DOCS, 'FAQ.md'), 'FAQ.html', 'FAQ');
convert(path.join(DOCS, 'Known_Limitations.md'), 'Known_Limitations.html', 'Known limitations');
convert(path.join(DOCS, 'CHANGELOG.md'), 'CHANGELOG.html', 'Changelog');

/* Support page, written for the site rather than converted. */
built.push({
  outFile: 'support.html',
  source: '(written for the site)',
  bytes: page(
    'support.html',
    'Support',
    `<h1>Support</h1>
<p>Access Auditor for Jira is published by Matify.</p>
<h2>Contact</h2>
<p>Email <a href="mailto:mira.maty@web.de">mira.maty@web.de</a>. Support is provided in English.</p>
<h2>Before you write</h2>
<p>Most questions are answered in <a href="Troubleshooting.html">Troubleshooting</a>
and the <a href="FAQ.html">FAQ</a>, including every error code the app can show.</p>
<h2>What to include</h2>
<p>Open the app in Jira, go to the <strong>Diagnostics</strong> tab and press
<strong>Copy diagnostic report</strong>. Paste that report into your email. It contains the
app version, the environment, the licence state, a summary of the last scan and the
capability matrix.</p>
<p>It deliberately contains <strong>no personal data and no credentials</strong>. You can read
it before you send it.</p>
<h2>Reporting a security issue</h2>
<p>Email <a href="mailto:mira.maty@web.de">mira.maty@web.de</a> with "security" in the subject
line. Please describe what you found and how to reproduce it, and give us a reasonable
opportunity to respond before disclosing it publicly.</p>
<h2>What this app does not do</h2>
<p>Access Auditor is read-only. It cannot change your Jira configuration, so it cannot be
the cause of a permission change on your site. If a permission changed unexpectedly, the
<strong>Changes</strong> tab will show you that it changed and what it changed from.</p>`,
  ),
});

/* Privacy and terms pages carry a prominent draft notice. */
{
  const privacyMd = fs.readFileSync(path.join(LEGAL, 'Privacy_Policy.md'), 'utf8');
  built.push({
    outFile: 'privacy.html',
    source: path.join(LEGAL, 'Privacy_Policy.md'),
    bytes: page('privacy.html', 'Privacy policy', markdownToHtml(privacyMd)),
  });

  const termsMd = fs.readFileSync(path.join(LEGAL, 'End_User_Terms_Draft.md'), 'utf8');
  built.push({
    outFile: 'terms.html',
    source: path.join(LEGAL, 'End_User_Terms_Draft.md'),
    bytes: page(
      'terms.html',
      'Terms',
      `<div class="notice"><strong>Draft pending the publisher's review.</strong>
The publisher has not yet decided whether to use these terms or Atlassian's standard
Marketplace end-user agreement. This page must not be linked from a live listing until
that decision is made.</div>` + markdownToHtml(termsMd),
    ),
  });
}

/* A README for whoever deploys it. */
fs.writeFileSync(
  path.join(OUT, 'DEPLOY.md'),
  `# Public documentation site

Copyright 2026 Matify. All Rights Reserved.

Plain static HTML. No build step, no backend, no JavaScript, no tracking, no
cookies, no external requests — the styling is inlined and there are no web fonts,
so the pages work offline and load nothing from a third party.

## Deploying

Upload the contents of this folder to any static host. Anything works: GitHub
Pages, Cloudflare Pages, Netlify, Vercel, S3 with CloudFront, or an ordinary web
server. \`index.html\` is the entry point.

## The four URLs the Marketplace listing needs

| Listing field | Page |
|---|---|
| Documentation | \`index.html\` |
| Support | \`support.html\` |
| Privacy policy | \`privacy.html\` |
| End user terms | \`terms.html\` |

## Before publishing

\`privacy.html\` is finished and carries no draft notice. One line at its end
still needs the registered legal entity and address; see
\`../LegalDrafts/Legal_Owner_Review_Checklist.md\`.

\`terms.html\` still carries a draft notice, because the publisher has not yet
decided between these terms and Atlassian's standard end-user agreement.

## Rebuilding

The pages are generated from the Markdown in \`../Documentation/\` and
\`../LegalDrafts/\`. Edit the Markdown and regenerate rather than editing the HTML
by hand, or the two will drift apart.
`,
);

console.log('Public site written to ' + OUT + '\n');
for (const b of built) {
  console.log(`  ${b.outFile.padEnd(32)} ${String(b.bytes).padStart(7)} bytes   <- ${b.source}`);
}
console.log('\n  DEPLOY.md written');

// Exported so build-apps.cjs can reuse the converter rather than carry a second
// copy of it. Requiring this file also rebuilds the flat site, which is
// idempotent and wanted.
module.exports = { markdownToHtml };
