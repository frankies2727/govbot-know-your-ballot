// The pictures a shared link shows (public/kyb-og/*.png, 1200×630; their tags
// are vite.config.ts's): the home page's and each state guide's. Drawn from
// the built site itself, so they carry its fonts, colours and state maps: the
// script serves dist/, opens the home page in a browser, takes each state's
// map from its card there, lays out each picture on the page and photographs
// it. Run after a build, when the wording or the maps change:
//   npm run build && node scripts/og-images.mjs
// Needs Playwright and its Chromium (npx playwright install chromium).

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = new URL('../public/kyb-og/', import.meta.url);
const PORT = 4391;
const SITE = 'govbot-know-your-ballot.vercel.app';

const STATES = [
  { id: 'illinois', name: 'Illinois', what: 'Every race, judge and question' },
  { id: 'michigan', name: 'Michigan', what: 'Every race, judge and proposal' },
  { id: 'minnesota', name: 'Minnesota', what: 'Every race, judge and the amendment' },
  { id: 'wisconsin', name: 'Wisconsin', what: 'Every race and question' },
];

const PICTURES = [
  {
    file: 'home', overline: 'Built on Govbot · several states', title: 'Know Your Ballot', maps: STATES.map((s) => s.id),
    text: 'Every race and question on your ballot, election by election. Past ballots stay as the record, with who won.',
    link: SITE,
  },
  ...STATES.map((s) => ({
    file: s.id, overline: 'November 2026 Midterms', title: `Know Your<br>${s.name} Ballot`, maps: [s.id],
    text: `${s.what} on the Nov 3, 2026 ballot, as voters saw it, and who won.`,
    link: `${SITE}/2026-11/${s.id}`,
  })),
];

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' });
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, colorScheme: 'dark' });
  for (let i = 0; ; i++) {
    try { await page.goto(`http://localhost:${PORT}/`); break; } catch (e) { if (i > 30) throw e; await new Promise((r) => setTimeout(r, 300)); }
  }
  await page.waitForSelector('#kyb-home-wisconsin svg');
  await page.evaluate(() => document.fonts.ready);
  // Each map with its card's tile and colour, so it's drawn as on the site (taken before the first picture replaces the page).
  const maps = await page.evaluate((ids) => Object.fromEntries(ids.map((id) => {
    const card = document.getElementById(`kyb-home-${id}`);
    return [id, `<span class="kyb-tile" style="--ink:${card.style.getPropertyValue('--ink')}">${card.querySelector('svg').outerHTML}</span>`];
  })), STATES.map((s) => s.id));

  for (const pic of PICTURES) {
    await page.evaluate(({ pic, maps }) => {
      const map = (id) => maps[id];
      document.documentElement.dataset.theme = 'dark';
      document.body.innerHTML = `
        <div class="og ${pic.maps.length > 1 ? 'og-many' : ''}">
          <div class="og-words">
            <p class="og-over">${pic.overline}</p>
            <h1 class="og-title">${pic.title}</h1>
            <p class="og-text">${pic.text}</p>
            <p class="og-link">${pic.link}</p>
          </div>
          <div class="og-maps">${pic.maps.map(map).join('')}</div>
        </div>
        <style>
          html, body { margin: 0; background: var(--gb-bg); }
          .og { box-sizing: border-box; width: 1200px; height: 630px; display: flex; align-items: center; gap: 48px; padding: 0 64px; background: var(--gb-bg); color: var(--gb-text); font-family: var(--gb-font-sans); }
          .og-words { flex: 0 0 600px; }
          .og-over { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: .2em; text-transform: uppercase; color: var(--kyb-gold); }
          .og-title { margin: 20px 0 22px; font-family: var(--gb-font-display); font-size: 74px; font-weight: 600; line-height: 1; letter-spacing: -0.015em; }
          .og-text { margin: 0; font-size: 28px; line-height: 1.4; }
          .og-link { margin: 26px 0 0; font-size: 22px; font-weight: 600; color: var(--gb-primary-hi); }
          .og-maps { flex: 1; height: 520px; display: grid; place-items: center; }
          .og-many .og-title { font-size: 92px; }
          .og-many .og-maps { grid-template-columns: 1fr 1fr; gap: 28px 36px; }
          .og-maps .kyb-tile { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 0; padding: 0; background: none; }
          .og-maps svg { height: 100%; width: 100%; max-height: 100%; }
        </style>`;
    }, { pic, maps });
    // The weights the picture uses, loaded before it's taken (a weight the page hadn't used yet would fall back).
    await page.evaluate(() => Promise.all(['600 80px Newsreader', '400 28px "IBM Plex Sans"', '600 22px "IBM Plex Sans"', '700 20px "IBM Plex Sans"'].map((f) => document.fonts.load(f))));
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400); // and drawn with them
    await page.screenshot({ path: fileURLToPath(new URL(`${pic.file}.png`, OUT)) });
    console.log(`kyb-og/${pic.file}.png`);
  }
  await browser.close();
} finally {
  server.kill();
}
