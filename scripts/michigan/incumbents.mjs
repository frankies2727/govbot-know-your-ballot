// Which Wikipedia article and section covers each race, for the seat's
// current holder and the candidates' endorsements (../wiki.mjs does the
// reading). Each state's config supplies the plan: its articles (PAGES), the
// statewide races' sections, the multi-seat boards and the per-district
// articles. Legislators' names come from govbot's roster first.

import { applyEndorsements, applyIncumbents, block, districtKey, fetchPages, fetchText, incumbentBullets, incumbentFrom, incumbentInProse, infobox, outgoingLine, ROSTER, sameSurname, seatsFromRoster } from '../wiki.mjs';

/**
 * A plan: { PAGES: { key: article }, STATEWIDE: [[race id, page key, overview section]],
 * BOARDS: { race id: page key }, chambers: { cd, sldu, sldl: page key } }.
 */
export function locate(race, pages, plan) {
  const a = race.area;
  const sw = plan.STATEWIDE.find(([id]) => id === race.id);
  if (sw) return pages[sw[1]] ? { page: plan.PAGES[sw[1]], wt: pages[sw[1]] } : null;
  if (plan.BOARDS[race.id]) { const k = plan.BOARDS[race.id]; return pages[k] ? { page: plan.PAGES[k], wt: pages[k] } : null; }
  const part = (key, title) => { const b = pages[key] && block(pages[key], title); return b ? { page: plan.PAGES[key], wt: b.text, section: b.title, lead: b.lead } : null; };
  if (a && plan.chambers[a.type]) return part(plan.chambers[a.type], `District ${districtKey(a.id)}`);
  return null;
}

export function readIncumbents(race, pages, seats, plan) {
  const sw = plan.STATEWIDE.find(([id]) => id === race.id);
  if (sw) {
    const [, key, section] = sw;
    const office = pages[key];
    const over = pages.overview && block(pages.overview, section, 3);
    const box = office ? infobox(office) : {};
    const prose = over ? incumbentInProse(over.lead) : null;
    const name = box.name ?? prose?.name;
    if (!name) return null;
    const text = [over?.lead, office && office.split(/\n==/)[0]].filter(Boolean).join('\n');
    return [incumbentFrom(plan.PAGES[over ? 'overview' : key], name, box.party ?? prose?.party, text, over ? section : undefined)];
  }
  if (plan.BOARDS[race.id]) {
    const wt = pages[plan.BOARDS[race.id]];
    if (!wt) return null;
    return incumbentBullets(wt).map((b) => {
      const inc = incumbentFrom(plan.PAGES[plan.BOARDS[race.id]], b.name, undefined, null, b.heading);
      // What happened to an incumbent is the heading they're listed under (the article's prose is lists, not sentences).
      inc.note = (/eliminated/i.test(b.heading) ? 'Lost the party’s nomination at its convention.' : /withdr/i.test(b.heading) ? 'Withdrew.' : /declined/i.test(b.heading) ? 'Declined to run.' : undefined);
      return inc;
    });
  }
  const a = race.area;
  const where = locate(race, pages, plan);
  if (a?.type === 'cd') {
    if (!where) return null;
    const seat = seats[`cd:${districtKey(a.id)}`];
    const box = infobox(where.wt);
    const wiki = box.name ?? incumbentInProse(where.lead)?.name;
    if (!seat && !wiki) return null;
    const agree = !wiki || !seat || sameSurname(seat.name, wiki);
    return [incumbentFrom(plan.PAGES[plan.chambers.cd], seat?.name ?? wiki, seat?.party ?? box.party, agree ? where.lead : null, where.section, agree ? wiki : undefined)];
  }
  if (a?.type === 'sldu' || a?.type === 'sldl') {
    const key = plan.chambers[a.type];
    const seat = seats[`${a.type}:${districtKey(a.id)}`];
    if (!pages[key]) return seat ? [{ ...seat, source: { name: 'Open States (via govbot)', url: ROSTER } }] : null;
    const wiki = where ? incumbentInProse(where.lead) : null;
    const name = seat?.name ?? wiki?.name;
    if (!name) return null;
    const agree = !wiki || !seat || sameSurname(seat.name, wiki.name);
    const out = outgoingLine(pages[key], districtKey(a.id));
    const inc = incumbentFrom(plan.PAGES[key], name, seat?.party ?? wiki?.party, agree ? [out?.text, where?.lead].filter(Boolean).join('\n') : null, out ? out.heading : where?.section, agree ? wiki?.name : undefined);
    // A chamber article lists term-limited members under that heading without saying so in each line.
    if (!inc.note && out && agree) inc.note = /term.limit/i.test(out.heading) ? 'Term-limited.' : /retir/i.test(out.heading) ? 'Retiring.' : undefined;
    return [inc];
  }
  return null;
}

export async function addWiki(races, { plan, code, prev = null, fetchPage = fetchText, pause = 800 }) {
  const { pages, log } = await fetchPages(plan.PAGES, { fetchPage, pause });
  let seats = {};
  try { seats = seatsFromRoster(JSON.parse(await fetchPage(ROSTER)), code); } catch (e) { log.push(`roster: ${e.message}`); }
  const incumbents = applyIncumbents(races, (r) => readIncumbents(r, pages, seats, plan), prev);
  const endorsements = applyEndorsements(races, (r) => locate(r, pages, plan), prev);
  return { incumbents, endorsements, log: [...log, ...incumbents.log, ...endorsements.log] };
}

// Standalone: refresh the committed data's incumbents (`node incumbents.mjs michigan|minnesota|wisconsin`).
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const { readFileSync, writeFileSync } = await import('node:fs');
  const state = process.argv[2] ?? 'michigan';
  const { CONFIG } = await import(`../${state}/config.mjs`);
  const file = new URL(`../../src/data/${state}/ballot.json`, import.meta.url);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const r = await addWiki(data.races, { plan: CONFIG.wiki, code: CONFIG.code, prev: data });
  console.log(`Incumbents: ${r.incumbents.found} races read, ${r.incumbents.kept} kept, ${r.incumbents.running} on their ballot, ${r.incumbents.noted} with a note; endorsements: ${r.endorsements.withList} candidates`);
  for (const l of r.log) console.log('  ' + l);
  writeFileSync(file, JSON.stringify(data, null, 1) + '\n');
}
