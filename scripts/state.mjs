#!/usr/bin/env node
// Know Your Ballot: one data build for every state that reads its ballot
// from Ballotpedia (Michigan, Minnesota, Wisconsin). `node scripts/state.mjs
// <state>` loads scripts/<state>/config.mjs and writes src/data/<state>/.
//
// Pulls everything from key-free sources and writes static JSON the site
// reads (no server, no API keys in the browser):
//   1. Ballotpedia's race pages                 -> every statewide, congressional,
//      (and Wikipedia's, where a race has none)    legislative and judicial contest
//   2. Each candidate's Ballotpedia profile     -> photo, campaign site, social accounts
//   3. FEC bulk "all candidates" summary        -> money for federal candidates
//   4. The state's own disclosure exports       -> money for state candidates (where the
//                                                  config has a reader)
//   5. Census TIGERweb                          -> district and county maps,
//                                                  the state outline for the hero
//   6. The certified ballot questions (scripts/<state>/measures.mjs)
//
// Needs `unzip`, `curl`, ImageMagick and OpenCV for Python (see face-check.py)
// on PATH. Run by .github/workflows/know-your-ballot-<state>.yml.

import { execFileSync } from 'node:child_process';
import { createWriteStream, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { changeLog } from './illinois/changes.mjs';
import { addFederalMoney, addOutsideSpending, fetchOutside, keepOutsideForward, parseWeball } from './illinois/fec.mjs';
import { fetchPage, parseHouseLists, parsePartisanTable, parseVoteboxes } from './michigan/ballotpedia.mjs';
import { buildDistricts, buildOutline } from './michigan/districts.mjs';
import { addProfiles } from './ballotpedia-profiles.mjs';
import { mergeOfficial } from './official.mjs';
import { recentNews } from './news.mjs';
import { recentBills } from './illinois/govbot.mjs';
import { keepMoneyForward } from './money-forward.mjs';
import { addHeadshots } from './headshots.mjs';
import { addPhotos } from './illinois/photos.mjs';
import { addSocial } from './illinois/social.mjs';
import { addWiki } from './michigan/incumbents.mjs';
import { countiesFromLayers } from './michigan/counties.mjs';
import { reconcile } from './audit.mjs';
import { addRecords } from './illinois/record.mjs';
import { runningMates } from './wiki.mjs';

const FEC_WEBALL = 'https://www.fec.gov/files/bulk-downloads/2026/weball26.zip';
const ELECTION = { name: 'General Election', date: '2026-11-03' };

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function download(url, file) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
}

/** Every race and its candidates, read from Ballotpedia (and the config's extra sources) today. */
async function gatherRaces(cfg) {
  // These ballots don't number candidates: `ballot` only identifies picks.
  // Major parties first, as the ballot lists them, then the rest alphabetically.
  const order = (c) => { const i = cfg.partyOrder.indexOf(c.nominatedBy ?? c.party); return i < 0 ? cfg.partyOrder.length : i; };
  const party = (p) => cfg.partyNames?.[p] ?? p;
  const race = ({ id, office, section, area = null, seats = 1, candidates, source }) => {
    const list = [...candidates].map((c) => ({ ...c, party: party(c.party) })).sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name))
      .map((c, i) => ({ ballot: i + 1, name: c.name, party: c.party, ...(c.nominatedBy ? { nominatedBy: c.nominatedBy } : {}), ...(c.incumbent ? { incumbent: true } : {}), ...(c.profile ? { profile: c.profile } : {}) }));
    return { id: slug(id), office, section, area, voteFor: seats, candidates: list, writeIn: cfg.writeIn ?? true, numbered: false, source };
  };

  const races = [];
  const pages = {};
  const fetched = new Map(); // several statewide races can share a page (Minnesota's judges)
  const read = async (title) => { if (!fetched.has(title)) fetched.set(title, await fetchPage(title)); return fetched.get(title); };
  // Statewide races: one page each, holding one or more "General election for …" boxes.
  for (const { page, box: header, office, section, id, min = 2 } of cfg.statewide) {
    const p = await read(page);
    pages[office] = p.url;
    const box = parseVoteboxes(p.html).find((b) => b.office === header);
    if (!box) throw new Error(`${page}: no "General election for ${header}" box`);
    if (box.candidates.length < min) throw new Error(`${page}: only ${box.candidates.length} candidates`);
    const seats = box.seats;
    let candidates = box.candidates.map(({ mate, ...c }) => c);
    if (office === cfg.governorOffice) {
      // A ticket is one choice: the lieutenant-governor running mate joins the
      // name, from the config's hand-checked list first, else the box's own
      // row where it has one, else the Wikipedia article's infobox.
      let wiki = {};
      try { wiki = await runningMates(cfg.wiki.PAGES.governor); } catch (e) { console.warn(`running mates: ${e.message}`); }
      const mateOf = (c) => cfg.runningMates?.[c.name] ?? c.mate ?? wiki[c.name];
      candidates = box.candidates.map(({ mate, ...c }) => (mateOf({ ...c, mate }) ? { ...c, name: `${c.name} & ${mateOf({ ...c, mate })}` } : c));
      const missing = candidates.filter((c) => !c.name.includes(' & ')).map((c) => c.name);
      if (missing.length) console.warn(`${office}: no running mate found for ${missing.join(', ')}`);
    }
    races.push(race({ id: id ?? office, office: seats > 1 ? `${office} (${seats} seats)` : office, section, seats, candidates, source: p.url }));
    console.log(`${office}: ${box.candidates.length} candidates`);
  }
  for (const extra of cfg.extraRaces ?? []) {
    const { url, candidates } = await extra.read();
    pages[extra.office] = url;
    races.push(race({ ...extra, candidates, source: url }));
    console.log(`${extra.office}: ${candidates.length} candidates`);
  }
  // U.S. House, state Senate, state House: one page per chamber.
  const house = await fetchPage(cfg.chambers.cd);
  for (const { district, candidates } of parseHouseLists(house.html)) {
    races.push(race({ id: `cd-${district}`, office: cfg.officeFor('cd', district), section: 'federal', area: { type: 'cd', id: district }, candidates, source: house.url }));
  }
  const senate = await fetchPage(cfg.chambers.sldu);
  for (const { district, candidates } of parsePartisanTable(senate.html)) {
    races.push(race({ id: `sldu-${district}`, office: cfg.officeFor('sldu', district), section: 'legislature', area: { type: 'sldu', id: district }, candidates, source: senate.url }));
  }
  const stateHouse = await fetchPage(cfg.chambers.sldl);
  for (const { district, candidates } of parsePartisanTable(stateHouse.html)) {
    races.push(race({ id: `sldl-${district}`, office: cfg.officeFor('sldl', district), section: 'legislature', area: { type: 'sldl', id: district }, candidates, source: stateHouse.url }));
  }
  if (cfg.appellate) races.push(...(await cfg.appellate(race, pages)));
  for (const [type, n] of Object.entries(cfg.raceCounts)) {
    const have = races.filter((r) => r.area?.type === type).length;
    if (have !== n) throw new Error(`${type}: expected ${n} races, parsed ${have} — refusing to overwrite`);
  }
  console.log(`${races.length} races`);
  return { races, pages };
}

export async function build(cfg) {
  const out = `src/data/${cfg.slug}`;
  const photosDir = `public/kyb-photos/${cfg.slug}`;
  const publicPath = `kyb-photos/${cfg.slug}`;
  const code = cfg.code.toLowerCase();
  mkdirSync(out, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), `ballot-${code}-`));
  let prev = null;
  try { prev = JSON.parse(readFileSync(join(out, 'ballot.json'), 'utf8')); } catch { /* first build */ }

  // Candidates. Ballotpedia blocks some addresses outright; rather than lose
  // the day, a refresh it turns away keeps yesterday's candidates and still
  // updates money, profiles, photos, maps, news and bills.
  let races, pages;
  let asOf = new Date().toISOString().slice(0, 10);
  try {
    ({ races, pages } = await gatherRaces(cfg));
  } catch (e) {
    if (!prev?.races?.length) throw e;
    console.warn(`Candidates: ${e.message}; keeping yesterday's ${prev.races.length} races`);
    ({ races, sources: { candidates: { pages, asOf } } } = structuredClone(prev));
  }
  // The state's own candidate list, where the build can read it, decides who is on the ballot (scripts/official.mjs).
  if (cfg.officialList) {
    try {
      const { byRace, source, note = '' } = await cfg.officialList.read();
      const r = mergeOfficial(races, byRace);
      pages[cfg.officialList.name] = source;
      console.log(`${cfg.officialList.name}: ${r.covered} races checked, ${r.added} candidates added, ${r.dropped} dropped${note}`);
      for (const line of r.log) console.log(`  ${line}`);
    } catch (e) { console.warn(`${cfg.officialList.name}: ${e.message}; keeping Ballotpedia's lists`); }
  }

  // Federal money.
  await download(FEC_WEBALL, join(work, 'weball.zip'));
  execFileSync('unzip', ['-o', '-q', join(work, 'weball.zip'), '-d', work]);
  const money = addFederalMoney(races, parseWeball(readFileSync(join(work, 'weball26.txt'), 'utf8')), cfg.code);
  console.log(`FEC: matched ${money.matched}/${money.total} federal candidates`);
  // Outside spending for and against them; a failed download keeps yesterday's.
  try {
    const { rows, names } = await fetchOutside(work, download, (zip, dir) => execFileSync('unzip', ['-o', '-q', zip, '-d', dir]));
    const outside = addOutsideSpending(races, rows, names);
    console.log(`Outside spending: ${outside.matched}/${outside.total} federal candidates, through ${outside.through}`);
  } catch (e) { console.warn(`outside spending: ${e.message}; ${keepOutsideForward(races, prev)} candidates keep yesterday's`); }
  // State money, where the state publishes exports this build can read; if they can't be read today, each candidate keeps yesterday's figures.
  if (cfg.stateMoney) {
    try {
      const dir = join(work, 'state-money');
      mkdirSync(dir, { recursive: true });
      const state = await cfg.stateMoney.add(races, dir);
      console.log(`${cfg.stateMoney.name}: matched ${state.matched}/${state.total} state & local candidates (${state.committees} candidate committees)`);
      for (const line of state.log) console.log('  ' + line);
    } catch (e) {
      console.warn(`${cfg.stateMoney.name}: ${e.message}; keeping the last figures`);
    }
  }
  console.log(`Money: ${keepMoneyForward(races, prev)} candidates kept yesterday's later figures`);

  // Photos, websites and social accounts: each candidate's Ballotpedia
  // profile first; then the official sources (Congress portraits, the
  // Legislature's member photos, Wikidata and Wikimedia Commons, campaign
  // sites), which win where they overlap; then, for anyone still without a
  // photo, the headshot on their own campaign site.
  const profiles = await addProfiles(races, { dir: photosDir, publicPath, prev, state: cfg.name });
  console.log(`Profiles: ${profiles.withProfile}/${profiles.total} candidates; photos ${profiles.withPhoto}, social ${profiles.withSocial}`);
  for (const line of profiles.log) console.log('  ' + line);
  const social = await addSocial(races, work, null, prev, cfg.code);
  console.log(`Social accounts: ${social.withSocial}/${social.total} candidates`);
  for (const line of social.log) console.log('  ' + line);
  const photos = await addPhotos(races, { dir: photosDir, publicPath, prev, chosen: cfg.chosenPhotos });
  console.log(`Photos: ${photos.withPhoto}/${photos.total} candidates`);
  for (const line of photos.log) console.log('  ' + line);
  const heads = await addHeadshots(races, { dir: photosDir, publicPath, prev });
  console.log(`Campaign-site headshots: ${heads.found} new, ${heads.kept} kept, of ${heads.tried} sites read`);
  for (const line of heads.log) console.log('  ' + line);

  // Maps; which districts reach into each county, for browsing a county without an address.
  const districts = await buildDistricts(cfg.fips, cfg.layerCounts);
  const counties = countiesFromLayers(districts.layers, cfg.layerCounts.county);
  const outline = await buildOutline(cfg.fips);
  const extraData = cfg.extraData?.(districts) ?? {};

  // Headlines for the activity feed; Google News being down keeps yesterday's.
  let news = prev?.news ?? [];
  try { news = await recentNews(cfg.news, cfg.moneyNews); } catch (e) { console.warn(`news: ${e.message}; keeping the last copy`); }
  console.log(`News: ${news.length} headlines`);

  const measures = cfg.measures.list;
  const next = { races, retentions: [], measures: measures.map(({ plain, ...m }) => m) };
  const changes = changeLog(prev, next, new Date().toISOString());
  console.log(`Changes since last refresh: ${changes.length - (prev?.changes?.length ?? 0)} new, ${changes.length} kept`);

  // govbot being briefly down shouldn't hold up the ballot: keep yesterday's bills.
  let laws = prev?.laws ?? [];
  try { laws = await recentBills(code); console.log(`govbot: ${laws.length} ${cfg.capital} bills`); } catch (e) { console.warn(`govbot: ${e.message}; keeping the last copy`); }
  // Who holds each seat and whether they're running, candidates' endorsements
  // (Wikipedia's articles on the races) and sitting legislators' bills (govbot).
  const wiki = await addWiki(races, { prev, plan: cfg.wiki, code: cfg.code });
  console.log(`Incumbents: ${wiki.incumbents.found} races read, ${wiki.incumbents.kept} kept from yesterday, ${wiki.incumbents.running} on their own ballot, ${wiki.incumbents.noted} with a note; endorsements for ${wiki.endorsements.withList} candidates`);
  for (const line of wiki.log) console.log('  ' + line);
  const rec = await addRecords(races, { state: code, prev });
  console.log(`Records: ${rec.matched} candidates are sitting legislators${rec.kept ? ` (${rec.kept} kept from yesterday)` : ''}`);
  for (const line of rec.log) console.log('  ' + line);
  // Last line: anything attached to a candidate whose source names someone else is dropped.
  const findings = await reconcile(races, code);
  console.log(`Audit: ${findings.length} finding${findings.length === 1 ? '' : 's'}`);
  for (const line of findings) console.log('  ' + line);

  writeFileSync(join(out, 'ballot.json'), JSON.stringify({
    election: ELECTION,
    sources: {
      candidates: { pages, asOf },
      money: { url: 'https://www.fec.gov/data/', file: FEC_WEBALL },
      ...(cfg.stateMoney ? { stateMoney: { url: cfg.stateMoney.url } } : {}),
      proposals: cfg.measures.source,
    },
    races,
    retentions: [],
    measures,
    ...extraData,
    changes,
    news,
    laws,
    counties,
  }, null, 1) + '\n');
  writeFileSync(join(out, 'districts.json'), JSON.stringify(districts) + '\n');
  writeFileSync(join(out, 'outline.json'), JSON.stringify(outline) + '\n');
  console.log(`Wrote ${races.length} races, ${measures.length} ballot questions.`);
}

// `--candidates` only reads the races and prints them (a check on the parsers); nothing is written.
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const state = process.argv[2];
  if (!/^[a-z]+$/.test(state ?? '')) { console.error('usage: node scripts/state.mjs <michigan|minnesota|wisconsin> [--candidates]'); process.exit(2); }
  const { CONFIG } = await import(`./${state}/config.mjs`);
  const run = process.argv.includes('--candidates')
    ? gatherRaces(CONFIG).then(({ races }) => { for (const r of races) console.log(`${r.id} | ${r.office} | pick ${r.voteFor} | ${r.candidates.map((c) => `${c.name} (${c.party}${c.nominatedBy ? '/' + c.nominatedBy : ''}${c.incumbent ? ', inc' : ''})`).join('; ')}`); })
    : build(CONFIG);
  run.catch((e) => { console.error(e); process.exit(1); });
}
