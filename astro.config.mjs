// @ts-check
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
      favicon: "/favicon.ico",
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
      customCss: ["./src/styles/brand.css"],
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
          items: [
            { slug: "general/cheatsheet" },
            { slug: "general/examples" },
          ],
        },
        {
          label: "For Developers",
          translations: { ru: "Для разработчиков" },
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
    }),
    mdx(),
  ],
});
