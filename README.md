# AbstractMenus documentation

Source for the AbstractMenus plugin docs site, built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

The site lives at `https://abstractmenus.github.io/docs/` and is rebuilt by GitHub Actions on every push to `main` (see `.github/workflows/deploy.yml`).

## Local development

```sh
npm install
npm run dev      # http://localhost:4321/docs/
npm run build    # static output in ./dist
npm run preview  # serve ./dist locally
```

Requires Node 20+ (CI runs Node 22).

## Layout

```
src/
  assets/                 logos and images referenced from MDX frontmatter
  content/
    docs/                 Markdown / MDX pages (sidebar order is in astro.config.mjs)
      start/              Getting Started
      general/            General Features
      advanced/           Advanced Features
      developers/         For Developers
  grammars/
    hocon.tmLanguage.json TextMate grammar for HOCON code blocks
  styles/
    brand.css             custom CSS variables (brand colour, header tint)
public/                   files served at the root (favicon, /img/*)
astro.config.mjs          Astro + Starlight configuration (sidebar, locales, theme)
```

## Adding a page

1. Drop a new `.md` (or `.mdx`) file under `src/content/docs/<section>/`.
2. Frontmatter at minimum:
   ```yaml
   ---
   title: My new page
   description: One-line summary for search and meta tags.
   ---
   ```
3. Add the slug to the sidebar in `astro.config.mjs` under the right section.

## HOCON syntax highlighting

Use ` ```hocon ` for HOCON blocks. The grammar is registered in `astro.config.mjs` via `expressiveCode.shiki.langs`.

## Localisation

`defaultLocale` is `en`. To add Russian:

1. Uncomment the `ru` entry in `astro.config.mjs > locales`.
2. Mirror `src/content/docs/` into `src/content/docs/ru/`, translating frontmatter and body.
3. Sidebar slugs resolve relative to each locale, so the same `astro.config.mjs` sidebar covers both.

Starlight will render a language picker in the header automatically.
