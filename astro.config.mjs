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
      logo: { src: "./src/assets/favicon.ico", alt: "AbstractMenus" },
      social: [
        { icon: "discord", label: "Discord", href: "https://discord.gg/4VGP3Gv" },
        { icon: "github", label: "GitHub", href: "https://github.com/AbstractMenus" },
      ],
      defaultLocale: "en",
      locales: {
        // Default locale. To add Russian later, drop `ru` files into
        // src/content/docs/ru/ and uncomment the entry below.
        root: { label: "English", lang: "en" },
        // ru: { label: "Русский", lang: "ru" },
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
            { slug: "start/how-to" },
            { slug: "start/hocon" },
            { slug: "start/faq" },
            { slug: "start/tips" },
          ],
        },
        {
          label: "General Features",
          items: [
            { slug: "general/menu-structure" },
            { slug: "general/item-format" },
            { slug: "general/activators" },
            { slug: "general/actions" },
            { slug: "general/rules" },
            { slug: "general/variables" },
            { slug: "general/text-colors" },
            { slug: "general/placeholders" },
            { slug: "general/examples" },
          ],
        },
        {
          label: "Advanced Features",
          items: [
            { slug: "advanced/logical" },
            { slug: "advanced/input" },
            { slug: "advanced/templates" },
            { slug: "advanced/animations" },
            { slug: "advanced/generation" },
            { slug: "advanced/drag-and-drop" },
          ],
        },
        {
          label: "For Developers",
          items: [
            { slug: "developers/general" },
            { slug: "developers/serializers" },
            { slug: "developers/own-types" },
            { slug: "developers/handlers" },
            { slug: "developers/variables" },
            { slug: "developers/utils" },
          ],
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
