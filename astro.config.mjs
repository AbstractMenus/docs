// @ts-check
import path from "node:path";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import mdx from "@astrojs/mdx";
import hoconGrammar from "./src/grammars/hocon.tmLanguage.json" with { type: "json" };

// Project-page deployment: https://abstractmenus.github.io/docs/
const SITE = "https://abstractmenus.github.io";
const BASE = "/docs/";

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: "always",
  // Bare /docs/ -> default locale. The destination must include `base`
  // because Astro doesn't auto-prepend it for redirect targets.
  redirects: {
    "/": "/docs/en/",
  },
  integrations: [
    starlight({
      title: "AbstractMenus",
      description: "Documentation for the AbstractMenus Paper/Folia GUI plugin.",
      // Astro 6 requires public-asset URLs to include the configured base.
      // Starlight passes this through verbatim into <link rel="icon" href=...>.
      favicon: BASE + "favicon.ico",
      logo: { src: "./src/assets/logo.png", alt: "AbstractMenus" },
      social: [
        { icon: "discord", label: "Discord", href: "https://discord.gg/4VGP3Gv" },
        { icon: "github", label: "GitHub", href: "https://github.com/AbstractMenus" },
      ],
      defaultLocale: "en",
      locales: {
        // Each locale lives in its own subdirectory under
        // src/content/docs/<locale>/, served at /docs/<locale>/.
        en: { label: "English", lang: "en" },
        ru: { label: "Русский", lang: "ru" },
      },
      customCss: [
        "./src/styles/brand.css",
        "./src/styles/examples.css",
      ],
      expressiveCode: {
        themes: ["github-dark", "github-light"],
        shiki: {
          // Custom grammar for HOCON; ```hocon code blocks pick this up.
          langs: [/** @type {any} */ (hoconGrammar)],
        },
      },
      sidebar: [
        {
          label: "Getting Started",
          translations: { ru: "Начало работы" },
          collapsed: true,
          items: [
            { slug: "start/installation" },
            { slug: "start/config" },
            { slug: "start/how-to" },
            { slug: "start/hocon" },
            { slug: "start/faq" },
            { slug: "start/tips" },
          ],
        },
        {
          label: "Authoring menus",
          translations: { ru: "Создание меню" },
          collapsed: true,
          items: [
            { slug: "general/commands" },
            { slug: "general/menu-structure" },
            { slug: "general/item-format" },
            { slug: "general/activators" },
            { slug: "general/actions" },
            { slug: "general/rules" },
            { slug: "general/variables" },
            { slug: "general/text-colors" },
            { slug: "general/placeholders" },
          ],
        },
        {
          label: "Techniques",
          translations: { ru: "Приёмы" },
          collapsed: true,
          items: [
            { slug: "advanced/logical" },
            { slug: "advanced/templates" },
            { slug: "advanced/input" },
            { slug: "advanced/animations" },
            { slug: "advanced/generation" },
            { slug: "advanced/drag-and-drop" },
          ],
        },
        {
          label: "Reference",
          translations: { ru: "Справочник" },
          collapsed: true,
          items: [
            { slug: "general/cheatsheet" },
            { slug: "general/examples" },
          ],
        },
        {
          label: "For Developers",
          translations: { ru: "Для разработчиков" },
          collapsed: true,
          items: [
            { slug: "developers/general" },
            { slug: "developers/addons" },
            { slug: "developers/own-types" },
            { slug: "developers/handlers" },
            { slug: "developers/serializers" },
            { slug: "developers/variables" },
            { slug: "developers/utils" },
            { slug: "developers/migration" },
          ],
        },
        {
          label: 'Examples',
          translations: { ru: 'Примеры' },
          collapsed: true,
          items: [
            { slug: 'examples' },
            { slug: 'examples/builder' },
            {
              label: 'Shops',
              translations: { ru: 'Магазины' },
              collapsed: true,
              autogenerate: { directory: 'examples/shops' },
            },
            {
              label: 'Hub & Navigation',
              translations: { ru: 'Хаб и навигация' },
              collapsed: true,
              autogenerate: { directory: 'examples/hub-and-nav' },
            },
            {
              label: 'Cosmetics',
              translations: { ru: 'Косметика' },
              collapsed: true,
              autogenerate: { directory: 'examples/cosmetics' },
            },
            {
              label: 'Donate',
              translations: { ru: 'Донат' },
              collapsed: true,
              autogenerate: { directory: 'examples/donate' },
            },
            {
              label: 'Casino & Games',
              translations: { ru: 'Казино и игры' },
              collapsed: true,
              autogenerate: { directory: 'examples/casino-and-games' },
            },
            {
              label: 'Kits & Rewards',
              translations: { ru: 'Киты и награды' },
              collapsed: true,
              autogenerate: { directory: 'examples/kits-and-rewards' },
            },
            {
              label: 'Admin Tools',
              translations: { ru: 'Админ-инструменты' },
              collapsed: true,
              autogenerate: { directory: 'examples/admin-tools' },
            },
            {
              label: 'Info Pages',
              translations: { ru: 'Инфо-страницы' },
              collapsed: true,
              autogenerate: { directory: 'examples/info-pages' },
            },
            {
              label: 'State & Variables',
              translations: { ru: 'Состояние и переменные' },
              collapsed: true,
              autogenerate: { directory: 'examples/state-and-vars' },
            },
            {
              label: 'World Integrations',
              translations: { ru: 'Интеграции мира' },
              collapsed: true,
              autogenerate: { directory: 'examples/world-integrations' },
            },
            {
              label: 'Snippets',
              translations: { ru: 'Сниппеты' },
              collapsed: true,
              autogenerate: { directory: 'examples/snippets' },
            },
          ],
        },
        {
          label: 'Playground',
          translations: { ru: 'Песочница' },
          // Full URL because Starlight rewrites relative links per locale
          // (would otherwise become /docs/en/playground/, which 404s).
          link: SITE + BASE + 'playground/',
          badge: { text: 'beta', variant: 'note' },
          attrs: { 'data-playground-link': 'true' },
        },
        {
          slug: "changelog",
          attrs: { "data-changelog-link": "true" },
        },
      ],
      lastUpdated: true,
      pagination: true,
      editLink: {
        baseUrl:
          "https://github.com/AbstractMenus/docs/edit/main/src/content/docs/",
      },
      // Persist sidebar group open/closed state across page loads + a floating
      // action button in the bottom-right of the sidebar that toggles all groups.
      // Starlight's `collapsed: true` on each group makes them closed by default;
      // this script remembers the user's manual toggles per group via localStorage.
      head: [
        {
          tag: "script",
          content: [
            "(function(){",
            "var KEY='ame-sidebar-groups';",
            "function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch(e){return {};}}",
            "function save(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}}",
            "var lang=document.documentElement.lang||'en';",
            "var L=lang==='ru'?{expand:'Развернуть все',collapse:'Свернуть все'}:{expand:'Expand all',collapse:'Collapse all'};",
            "var SVG_ATTRS='width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"';",
            "var ICON_EXPAND='<svg class=\"sl-fab-icon sl-fab-icon-expand\" '+SVG_ATTRS+'><polyline points=\"7 6 12 11 17 6\"></polyline><polyline points=\"7 13 12 18 17 13\"></polyline></svg>';",
            "var ICON_COLLAPSE='<svg class=\"sl-fab-icon sl-fab-icon-collapse\" '+SVG_ATTRS+'><polyline points=\"17 11 12 6 7 11\"></polyline><polyline points=\"17 18 12 13 7 18\"></polyline></svg>';",
            "function init(){",
            "var sidebar=document.querySelector('.sidebar-content');",
            "if(!sidebar)return;",
            "var groups=sidebar.querySelectorAll('details');",
            "var seen={};var state=load();",
            "groups.forEach(function(d){",
            "var summary=d.querySelector(':scope > summary');if(!summary)return;",
            "var label=(summary.textContent||'').trim();if(!label||seen[label])return;",
            "seen[label]=true;",
            "var isActive=d.querySelector('a[aria-current=\"page\"]');",
            "if(!isActive&&label in state){d.open=state[label];}",
            "d.addEventListener('toggle',function(){var s=load();s[label]=d.open;save(s);refreshFab();});",
            "});",
            "var existing=document.querySelector('.sl-fab');if(existing)existing.parentNode.removeChild(existing);",
            "var btn=document.createElement('button');",
            "btn.type='button';btn.className='sl-fab';",
            "btn.setAttribute('aria-label',L.expand);",
            "btn.innerHTML=ICON_EXPAND+ICON_COLLAPSE+'<span class=\"sl-fab-tooltip\" data-tt>'+L.expand+'</span>';",
            "function refreshFab(){",
            "var d=sidebar.querySelectorAll('details');var anyOpen=false;",
            "d.forEach(function(x){if(x.open)anyOpen=true;});",
            "btn.classList.toggle('is-collapse',anyOpen);",
            "var tt=btn.querySelector('[data-tt]');",
            "if(tt)tt.textContent=anyOpen?L.collapse:L.expand;",
            "btn.setAttribute('aria-label',anyOpen?L.collapse:L.expand);",
            "}",
            "btn.addEventListener('click',function(){",
            "var d=sidebar.querySelectorAll('details');var anyOpen=false;",
            "d.forEach(function(x){if(x.open)anyOpen=true;});",
            "var newOpen=!anyOpen;var s=load();",
            "d.forEach(function(x){var sm=x.querySelector(':scope > summary');var lbl=sm?(sm.textContent||'').trim():'';x.open=newOpen;if(lbl)s[lbl]=newOpen;});",
            "save(s);refreshFab();",
            "});",
            "var pane=document.querySelector('.sidebar-pane')||sidebar;",
            "pane.appendChild(btn);",
            "refreshFab();",
            "}",
            "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',init);}else{init();}",
            "})();",
          ].join(""),
        },
        {
          // Sidebar's Playground entry has to be a full URL because Starlight
          // would otherwise rewrite a relative path through the locale segment
          // and 404. The static URL is a production fallback; this script
          // rewrites it to the current origin on every load so the link works
          // identically in dev (localhost), preview, and production.
          tag: "script",
          content: [
            "(function(){",
            "function fix(){",
            "var as=document.querySelectorAll('a[data-playground-link]');",
            "for(var i=0;i<as.length;i++){as[i].href=window.location.origin+'" + BASE + "playground/';}",
            "}",
            "if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',fix);}else{fix();}",
            "})();",
          ].join(""),
        },
      ],
    }),
    mdx(),
  ],
  vite: {
    resolve: {
      alias: {
        "@components": path.resolve("./src/components"),
      },
    },
  },
});
