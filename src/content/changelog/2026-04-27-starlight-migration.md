---
title: Docs site rebuilt on Astro Starlight
version: docs-site
date: 2026-04-27
summary: The documentation site moved from Sphinx (RST) to Astro Starlight. Same URLs, native dark mode, faster search, ready for Russian.
tags: [docs, infra]
---

The documentation site has been rewritten on top of [Astro Starlight](https://starlight.astro.build).

## What's new

- Native light/dark theme with `prefers-color-scheme` plus a manual toggle in the header.
- Markdown / MDX content. RST is gone, contributing a page is now drop a `.md` file under `src/content/docs/`.
- HOCON syntax highlighting via a custom Shiki grammar - keys, strings, substitutions, includes, and durations all coloured.
- Pagefind full-text search built into the header.
- Automatic sidebar pagination ("Previous / Next" footer on every page).
- Russian locale ready: `https://abstractmenus.github.io/docs/ru/`. Pages without a Russian translation fall back to the English version with a "translate this page" notice.
- `npm run build` deploy via GitHub Actions to GitHub Pages on every push to `main`.

## What's the same

- URL paths are unchanged for top-level sections (`/docs/start/...`, `/docs/general/...`, `/docs/advanced/...`).
- The `dev/` section is now `/docs/developers/` to free the `dev` slug for the doc engine itself - inbound links to `/docs/dev/...` will need a one-time fix.
