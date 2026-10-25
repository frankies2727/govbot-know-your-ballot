import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

// What a shared link shows (the title, description and picture social apps
// read from the HTML itself, before any script runs): one set per page, the
// root and each state's page. Each state's page is a copy of the app shell
// with its own tags, which vercel.json serves for that path. The pictures are
// public/kyb-og/*.png.
const SITE = 'https://govbot-know-your-ballot.vercel.app';
const PAGES: Record<string, { title: string; desc: string; img: string }> = {
  '': { title: 'Govbot Know Your Ballot', desc: 'Your exact ballot by address: every race, judge and question, who’s running and who’s funding them. Illinois, Michigan, Minnesota and Wisconsin, built on Govbot.', img: 'home' },
  illinois: { title: 'Know Your Illinois Ballot', desc: 'Every race, judge and question on your Nov 3, 2026 Illinois ballot, explained before you vote. Free, open source and non-partisan, built on Govbot.', img: 'illinois' },
  michigan: { title: 'Know Your Michigan Ballot', desc: 'Every race, judge and proposal on your Nov 3, 2026 Michigan ballot, explained before you vote. Free, open source and non-partisan, built on Govbot.', img: 'michigan' },
  minnesota: { title: 'Know Your Minnesota Ballot', desc: 'Every race, judge and the amendment on your Nov 3, 2026 Minnesota ballot, explained before you vote. Free, open source and non-partisan, built on Govbot.', img: 'minnesota' },
  wisconsin: { title: 'Know Your Wisconsin Ballot', desc: 'Every race and question on your Nov 3, 2026 Wisconsin ballot, explained before you vote. Free, open source and non-partisan, built on Govbot.', img: 'wisconsin' },
};
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const metaFor = (page: string) => {
  const { title, desc, img } = PAGES[page];
  const url = page ? `${SITE}/${page}` : `${SITE}/`;
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Govbot Know Your Ballot" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${SITE}/kyb-og/${img}.png" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(desc)}" />`,
    `<meta name="twitter:image" content="${SITE}/kyb-og/${img}.png" />`,
  ].join('\n    ');
};
const TITLE = /<title>[^<]*<\/title>/;
function siteMeta() {
  let outDir = 'dist';
  return {
    name: 'kyb-site-meta',
    configResolved(c: { build: { outDir: string } }) { outDir = c.build.outDir; },
    transformIndexHtml: (html: string) => html.replace(TITLE, metaFor('')),
    closeBundle() {
      const shell = readFileSync(path.join(outDir, 'index.html'), 'utf8');
      for (const page of Object.keys(PAGES).filter(Boolean)) {
        mkdirSync(path.join(outDir, page), { recursive: true });
        writeFileSync(path.join(outDir, page, 'index.html'), shell.replace(/<title>[\s\S]*?<meta name="twitter:image"[^>]*>/, metaFor(page)));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), siteMeta()],
});
