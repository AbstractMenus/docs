import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),

  // Standalone changelog collection driving the listing page and the RSS feed.
  // Entries live in src/content/changelog/<YYYY-MM-DD>-<slug>.md.
  changelog: defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/changelog" }),
    schema: z.object({
      title: z.string(),
      version: z.string().optional(),
      date: z.coerce.date(),
      summary: z.string().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).default([]),
    }),
  }),
};
