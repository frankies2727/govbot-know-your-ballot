// node --test: the Denver and Jacksonville 2027 builds' parsing
// (scripts/denver-2027.mjs, scripts/jacksonville-2027.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allRaces as denverRaces, candidatesFrom, cleanName, raceFor } from './denver-2027.mjs';
import { allRaces as jaxRaces, councilMembers, declared } from './jacksonville-2027.mjs';
import { sameName } from './wiki.mjs';

test('Denver: SearchLight offices map to the ballot’s races', () => {
  assert.equal(raceFor('Mayor').id, 'mayor');
  assert.equal(raceFor('City Council At-Large Seat B').id, 'at-large-b');
  assert.deepEqual(raceFor('City Council', '7').area, { type: 'council', id: '7' });
  assert.equal(raceFor('City Council', null), null);
  assert.equal(raceFor('City Council At-Large'), null); // the old two-seat office, gone from 2027
  assert.equal(denverRaces().length, 16);
});

test('Denver: names tidied as registered, and matched to the officeholders’ spelling', () => {
  assert.equal(cleanName('Jacob Luria Jacob Luria'), 'Jacob Luria');
  assert.equal(cleanName('Quincy  shannon'), 'Quincy Shannon');
  assert.equal(cleanName('Paul D. López'), 'Paul D. López');
  assert.equal(cleanName('William Fenton II'), 'William Fenton II');
  assert.ok(sameName('Serena Gonzales Gutierrez', 'Serena Gonzales-Gutierrez'));
  assert.ok(sameName('Amanda P. Sandoval', 'Amanda Sandoval'));
  assert.ok(!sameName('Scott Gilmore', 'Stacie Gilmore'));
});

test('Denver: someone registered for two offices counts for the later one', () => {
  const { rows, moved } = candidatesFrom([
    { fullName: 'Shontel Lewis', officeSought: 'City Council', district: '8', committeeId: 709, filerId: 648 },
    { fullName: 'Shontel Lewis', officeSought: 'Mayor', district: null, committeeId: 791, filerId: 1313 },
    { fullName: 'Evelyn Barnes', officeSought: 'City Council', district: '8', committeeId: 817, filerId: 1337 },
    { fullName: 'Someone', officeSought: 'Treasurer', district: null, committeeId: 900, filerId: 1 },
  ]);
  assert.deepEqual(rows.map((r) => [r.name, r.officeSought]), [['Shontel Lewis', 'Mayor'], ['Evelyn Barnes', 'City Council']]);
  assert.equal(moved.length, 1);
});

test('Jacksonville: every seat, and the article’s declared candidates with party', () => {
  const races = jaxRaces();
  assert.equal(races.length, 24);
  assert.equal(races.filter((r) => r.area?.type === 'council').length, 14);
  const text = `==Primary election==
===Candidates===
====Declared====
*Harry Daniel Long III ''(Republican)''<ref name="a">{{cite web|title=x}}</ref>
*[[Donna Deegan]], incumbent mayor ''(Democrat)''<ref name="b"/>
*[[Wyman Duggan]], speaker pro tempore of the [[Florida House of Representatives]] ''(Republican)''
*Eric DuPree ''(Write-in)''
*Brian Griffin ''(NPA Write-in)''

====Publicly expressed interest====
*Rory Diamond ''(Republican)''`;
  assert.deepEqual(declared(text), [
    { name: 'Harry Daniel Long III', party: 'Republican', writeIn: false },
    { name: 'Donna Deegan', party: 'Democratic', writeIn: false },
    { name: 'Wyman Duggan', party: 'Republican', writeIn: false },
    { name: 'Eric DuPree', party: '', writeIn: true },
    { name: 'Brian Griffin', party: 'No Party Affiliation', writeIn: true },
  ]);
});

test('Jacksonville: the council page’s members by seat', () => {
  const html = '<a href="/city-council/city-council-members/al2">Ron Salem</a><a href="/city-council/city-council-members/al2">Ronald B. Salem</a><a href="/city-council/city-council-members/al2/bio">Bio</a><a href="/city-council/city-council-members/d08">Reggie Gaffney, Jr.</a>';
  assert.deepEqual([...councilMembers(html)], [['al2', 'Ron Salem'], ['d08', 'Reggie Gaffney, Jr.']]);
});
