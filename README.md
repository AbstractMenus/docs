# AbstractMenus documentation

Source for the AbstractMenus plugin docs site, built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

The site lives at `https://abstractmenus.github.io/docs/` and is rebuilt by GitHub Actions on every push to `main` (see `.github/workflows/deploy.yml`).

## Local development

```sh
npm install
npm run dev      # http://localhost:4321/docs/
npm run build    # static output in ./dist
npm run preview  # serve ./dist locally
npm test         # vitest unit tests for the playground
```

Requires Node 20+ (CI runs Node 22).

## Layout

```text
src/
  assets/                 logos and images referenced from MDX frontmatter
  content/
    docs/                 Markdown / MDX pages (sidebar order is in astro.config.mjs)
      en/                 English content
        start/            Getting Started
        general/          Authoring menus
        advanced/         Techniques
        developers/       For Developers
        changelog/        Changelog landing page
      ru/                 Russian content (mirrors en/, fills in gradually)
    changelog/            Changelog entries (separate collection, rendered by docs/<locale>/changelog/index.mdx)
  pages/
    feed.xml.ts           RSS feed at /docs/feed.xml
  grammars/
    hocon.tmLanguage.json TextMate grammar for HOCON code blocks
  styles/
    brand.css             custom CSS variables (brand colour, header tint, layout)
public/                   files served at the root (favicon, /img/*)
astro.config.mjs          Astro + Starlight configuration (sidebar, locales, theme, redirects)
```

## URLs

- `/docs/` redirects to `/docs/en/`.
- English content lives at `/docs/en/...`.
- Russian content lives at `/docs/ru/...`. Pages without a Russian translation fall back to English with a "translate this page" notice.

## Playground

`/docs/playground/` is a browser-side editor for HOCON menu configs (CodeMirror 6 + custom HOCON parser, no backend). It lives outside the Starlight content layout so it can use the full viewport.

- Source: `src/lib/playground/`
- Pages: `src/pages/playground.astro` (editor), `src/pages/playground/about.astro` (overview)
- Styles: `src/styles/playground.css` (scoped via `<style is:global>` on the page; intentionally not registered in `astro.config.mjs > customCss` so the rest of the docs site is unaffected)
- Tests: `npm test` (vitest + happy-dom)
- Extend autocomplete data in `src/lib/playground/catalog/`, add lessons in `src/lib/playground/tutorial/lessons/`.

## Image paths

`base` is set to `/docs/` because the site lives at `https://abstractmenus.github.io/docs/`. Astro does not auto-prefix `base` for raw URLs inside Markdown. Reference public assets with the base included:

```md
![alt text](/docs/img/howto_empty.png)
```

If `base` ever changes, do a project-wide find/replace `/docs/img/` -> `/<new-base>/img/`. Internal links between docs pages use `/docs/<locale>/...` (e.g. `/docs/en/general/actions/`).

## Adding a page

1. Drop a new `.md` (or `.mdx`) file under `src/content/docs/<locale>/<section>/`. Add the same path under both `en/` and `ru/` if you have both translations.
2. Frontmatter at minimum:

   ```yaml
   ---
   title: My new page
   description: One-line summary for search and meta tags.
   ---
   ```

3. Add the slug to the sidebar in `astro.config.mjs` under the right section. Slugs are locale-relative - the same `slug: "start/how-to"` resolves to `en/start/how-to` for English and `ru/start/how-to` for Russian.

## HOCON syntax highlighting

Use ` ```hocon ` for HOCON blocks. The grammar is registered in `astro.config.mjs` via `expressiveCode.shiki.langs`.

## Localisation

Both English and Russian are configured under `astro.config.mjs > locales`. To add a third language:

1. Add an entry to `locales` (e.g. `de: { label: "Deutsch", lang: "de" }`).
2. Create `src/content/docs/de/` mirroring the structure of `en/`.
3. Sidebar config in `astro.config.mjs` doesn't change - slugs are locale-relative.

Starlight renders a language picker in the header automatically when more than one locale is configured.
