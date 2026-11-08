// node --test: the Chicago 2027 build's name handling (scripts/chicago-2027.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ordinal, personName, politicsPage } from './chicago-2027.mjs';

test('ordinals', () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31, 42, 50].map(ordinal), ['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st', '42nd', '50th']);
});

test('the ward offices list names last name first, a suffix in the middle', () => {
  assert.equal(personName('La Spata, Daniel'), 'Daniel La Spata');
  assert.equal(personName('Cardona, Jr., Felix'), 'Felix Cardona Jr.');
  assert.equal(personName('Hadden'), 'Hadden');
});

test("a candidate's Chicago Politics page, by the addresses its sitemap uses", () => {
  const pages = new Map(['willie-wilson', 'ramona-t-bonilla-anaiel', 'james-steward', 'deondre-rutues', 'jimmy-darnell-jones', 'jessica-maronto', 'kiisha-smith-24', 'kiisha-smith-district-10']
    .map((s) => [s, `https://www.chicagopolitics.org/candidate/${s}`]));
  const ward = (n) => ({ area: { type: 'ward', id: String(n) } });
  const police = (n) => ({ area: { type: 'police', id: String(n) } });
  const at = (name, race = { area: null }) => politicsPage(pages, name, race)?.split('/').pop() ?? null;
  assert.equal(at('Willie L. Wilson'), 'willie-wilson');
  assert.equal(at('Ramona T. Bonilla-Anaiel', ward(31)), 'ramona-t-bonilla-anaiel');
  assert.equal(at("James 'Baldie' Steward", ward(17)), 'james-steward');
  assert.equal(at("Deondre' Rutues (Dr. Dre')", police(15)), 'deondre-rutues');
  assert.equal(at('Jimmy Darnell Jones Aka Jaye Jones', ward(8)), 'jimmy-darnell-jones');
  assert.equal(at('Jessica "Jesse" Maronto'), 'jessica-maronto');
  assert.equal(at('Kiisha Smith', ward(24)), 'kiisha-smith-24');
  assert.equal(at('Kiisha Smith', police(10)), 'kiisha-smith-district-10');
  assert.equal(at('Nobody Here'), null);
});
