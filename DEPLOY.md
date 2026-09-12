# Public documentation site

Copyright 2026 Matify. All Rights Reserved.

Plain static HTML. No build step, no backend, no JavaScript, no tracking, no
cookies, no external requests — the styling is inlined and there are no web fonts,
so the pages work offline and load nothing from a third party.

## Deploying

Upload the contents of this folder to any static host. Anything works: GitHub
Pages, Cloudflare Pages, Netlify, Vercel, S3 with CloudFront, or an ordinary web
server. `index.html` is the entry point.

## The four URLs the Marketplace listing needs

| Listing field | Page |
|---|---|
| Documentation | `index.html` |
| Support | `support.html` |
| Privacy policy | `privacy.html` |
| End user terms | `terms.html` |

## Before publishing

`privacy.html` is finished and carries no draft notice. One line at its end
still needs the registered legal entity and address; see
`../LegalDrafts/Legal_Owner_Review_Checklist.md`.

`terms.html` still carries a draft notice, because the publisher has not yet
decided between these terms and Atlassian's standard end-user agreement.

## Rebuilding

The pages are generated from the Markdown in `../Documentation/` and
`../LegalDrafts/`. Edit the Markdown and regenerate rather than editing the HTML
by hand, or the two will drift apart.
