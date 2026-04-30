import type { APIContext } from "astro";
import { getCollection } from "astro:content";

export async function GET({ site }: APIContext) {
  const base = "/docs";
  const origin = site ? new URL(base, site).toString().replace(/\/$/, "") : base;

  const entries = (await getCollection("changelog"))
    .sort((a, b) => +b.data.date - +a.data.date);

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const items = entries.map((entry) => {
    const link = `${origin}/en/changelog/#${entry.id}`;
    const title = escape(entry.data.title);
    const summary = escape(entry.data.summary ?? "");
    return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${entry.id}</guid>
      <pubDate>${entry.data.date.toUTCString()}</pubDate>
      <description>${summary}</description>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>AbstractMenus changelog</title>
    <link>${origin}/en/changelog/</link>
    <description>Notable changes to AbstractMenus and to this documentation site.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
