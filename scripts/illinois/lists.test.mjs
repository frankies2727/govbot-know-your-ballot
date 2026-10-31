// Run with `npm run test:data`. Short excerpts of the Board's real lists.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCityCandidates, nameCase, parseCityList, raceId } from './city.mjs';
import { electionDate, listFor, pdfLinks } from './lists.mjs';

const NOV = `This Unofficial candidate list for the November 3, 2026 election includes only the offices
                                  Status as of 10/27/2026 4:10:15 PM

                    Candidate Filings in Ballot Order, November 3, 2026
United States Senator
  Vote for One
       (1)      Don Tracy (Republican)                                  Candidate
`;

const CITY = `This Official candidate list for the February 23, 2027 election includes only the offices
                                              Status as of 10/30/2026 3:54:49 PM

                      Candidate Filings in Ballot Order, February 23, 2027
     Ballot No. Candidate                                              Status

   Mayor
      Vote for One
                 JOHN KELLY                                           Candidate

                 JESSICA "JESSE" MARONTO                              Candidate

   Council Member, Chicago Police Department 5th District
      Vote for not more than Three
               PAULINE W. SYLVAIN                                     Candidate

               No Candidate                                           N/A

Friday, October 30, 2026                                              Page 1 of 17
   Alderperson, 2nd Ward
      Vote for One
                 BRIAN HOPKINS                                        Candidate
`;

test('a list names its election in its heading', () => {
  assert.equal(electionDate(NOV), '2026-11-03');
  assert.equal(electionDate(CITY), '2027-02-23');
  assert.equal(electionDate('nothing here'), null);
  // Older wording, no "Candidate Filings" line.
  assert.equal(electionDate('This Official candidate list for the April 6, 2027 election includes'), '2027-04-06');
});

test('the build takes the list for its own election, never the 2027 one', () => {
  const found = [{ url: 'a/Candidate%20List_20261027-1.pdf', date: '2026-11-03' }, { url: 'a/Candidate%20List_20261030-1.pdf', date: '2027-02-23' }];
  assert.equal(listFor(found, '2026-11-03').url, 'a/Candidate%20List_20261027-1.pdf');
  assert.equal(listFor(found.reverse(), '2027-02-23').url, 'a/Candidate%20List_20261030-1.pdf');
  // The newest reissue of the same election wins.
  const reissued = [{ url: 'a/List_20261027-1.pdf', date: '2026-11-03' }, { url: 'a/List_20261102-1.pdf', date: '2026-11-03' }];
  assert.equal(listFor(reissued, '2026-11-03').url, 'a/List_20261102-1.pdf');
  assert.throws(() => listFor([found[0]], '2027-04-06'), /No candidate list for 2027-04-06/);
  assert.throws(() => listFor([], '2026-11-03'), /no candidate-list links/);
});

test('links are read off the page, with the space in the file name spelled either way', () => {
  const html = `<a href="https://x.blob.core/prod/2026-10/Candidate List_20261030-1.pdf">a</a><a href='https://x.blob.core/prod/2026-10/Candidate%20List_20261027-1.pdf'>b</a>`;
  assert.deepEqual(pdfLinks(html), ['https://x.blob.core/prod/2026-10/Candidate%20List_20261030-1.pdf', 'https://x.blob.core/prod/2026-10/Candidate%20List_20261027-1.pdf']);
});

test('office headings map to race ids', () => {
  assert.equal(raceId('Mayor'), 'chicago-mayor');
  assert.equal(raceId('Clerk'), 'chicago-city-clerk');
  assert.equal(raceId('Treasurer'), 'chicago-city-treasurer');
  assert.equal(raceId('Alderperson, 2nd Ward'), 'chicago-alderperson-ward-02');
  assert.equal(raceId('Alderperson, 33rd Ward'), 'chicago-alderperson-ward-33');
  assert.equal(raceId('Council Member, Chicago Police Department 5th District'), 'chicago-police-district-council-005');
  assert.equal(raceId('Judge, 1st Subcircuit'), null);
});

test('names keep their punctuation', () => {
  assert.equal(nameCase('JESSICA "JESSE" MARONTO'), 'Jessica "Jesse" Maronto');
  assert.equal(nameCase("DAN O'BRIEN-NUÑEZ"), "Dan O'Brien-Nuñez");
  assert.equal(nameCase('DONALD J MCAVOY III'), 'Donald J McAvoy III');
  assert.equal(nameCase('Manuel Andrés Beltrán'), 'Manuel Andrés Beltrán');
});

test('the 2027 list is read office by office, leaving out page footers and the empty-seat row', () => {
  const list = parseCityList(CITY);
  assert.equal(list.asOf, '10/30/2026 3:54:49 PM');
  assert.deepEqual(list.unknown, []);
  assert.deepEqual(list.offices.get('chicago-mayor').map((f) => f.name), ['John Kelly', 'Jessica "Jesse" Maronto']);
  assert.deepEqual(list.offices.get('chicago-alderperson-ward-02').map((f) => f.name), ['Brian Hopkins']);
  const council = list.offices.get('chicago-police-district-council-005');
  assert.deepEqual(council.map((f) => f.status), ['Candidate', 'N/A']);
});

test('a bad read of the 2027 list is refused, and a good one fills the races', () => {
  const races = [{ id: 'chicago-mayor', candidates: [] }, { id: 'chicago-alderperson-ward-02', candidates: [] }];
  assert.throws(() => addCityCandidates(races, parseCityList(CITY)), /looks wrong/);
  // A full-size list: 3 citywide, 50 wards, 22 police districts.
  const offices = new Map();
  const add = (id, n) => offices.set(id, Array.from({ length: n }, (_, i) => ({ name: `Person ${id} ${i}`, status: 'Candidate' })));
  add('chicago-mayor', 5); add('chicago-city-clerk', 2); add('chicago-city-treasurer', 2);
  for (let w = 1; w <= 50; w++) add(`chicago-alderperson-ward-${String(w).padStart(2, '0')}`, 3);
  for (let d = 1; d <= 22; d++) add(`chicago-police-district-council-${String(d).padStart(3, '0')}`, 2);
  offices.get('chicago-mayor').push({ name: 'Withdrawn Person', status: 'Withdrawn' });
  const all = [...offices.keys()].map((id) => ({ id, candidates: ['stale'] }));
  const res = addCityCandidates(all, { offices, unknown: [] });
  assert.equal(res.races, 75);
  assert.deepEqual(res.skipped, { Withdrawn: 1 });
  assert.equal(all.find((r) => r.id === 'chicago-mayor').candidates.length, 5);
});
