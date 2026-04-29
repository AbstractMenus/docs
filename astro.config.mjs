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
      defaultLocale: "root",
      locales: {
        // English lives at /docs/ (the root locale).
        root: { label: "English", lang: "en" },
        // Russian lives at /docs/ru/. Pages without a Russian translation
        // fall back to the English version with a "translate this page" note.
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
          items: [
            { slug: "general/cheatsheet" },
            { slug: "general/examples" },
          ],
        },
        {
          label: "For Developers",
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
          label: "Demo",
          collapsed: true,
          items: [{ slug: "demo/components" }],
        },
        {
          label: "Changelog",
          link: "/changelog/",
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
