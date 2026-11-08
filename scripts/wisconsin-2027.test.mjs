// node --test: the Wisconsin spring 2027 build's parsing (scripts/wisconsin-2027.mjs).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { appealsSeats, circuitSeats, declared, raceIdFor } from './wisconsin-2027.mjs';

test("the Commission's spring office headings, spelled either way", () => {
  assert.equal(raceIdFor('JUSTICE OF THE SUPREME COURT'), 'supreme-court');
  assert.equal(raceIdFor('COURT OF APPEALS JUDGE DISTRICT II'), 'court-of-appeals-2');
  assert.equal(raceIdFor('Court of Appeals Judge, District 4'), 'court-of-appeals-4');
  assert.equal(raceIdFor('CIRCUIT COURT JUDGE, DANE COUNTY, BRANCH 6'), 'circuit-dane-6');
  assert.equal(raceIdFor('CIRCUIT COURT JUDGE BAYFIELD COUNTY'), 'circuit-bayfield');
  assert.equal(raceIdFor('MAYOR'), null);
});

const ARTICLE = `====State Court of Appeals====
* In District I, [[Nathan Petrashek]], appointed in 2026, is running for a full term.
* In District IV, Todd Ziegler was appointed to the Wisconsin Court of Appeals after judge Chris Taylor joined the [[Wisconsin Supreme Court]].

====State Circuit Courts====
{| class="wikitable"
! rowspan="2" |Circuit
|-
!Name
|-
| Adams
| align="right" | 1
| {{nowrap|Daniel Glen Wood }}
| align="center" | 2015
|
|-
| colspan="2" | Bayfield
| {{nowrap|John P. Anderson }}
| align="center" | 2004
| ''Appointed by [[Jim Doyle]]''
|-
| rowspan="2" | Brown
| align="right" | 1
| {{nowrap|Donald R. Zuidmulder }}
| align="center" | 1997
|
|-
| align="right" | 5
| {{nowrap|Marc A. Hammer }}
| align="center" | 2008
|
|}`;

test('the seats up: appeals districts and circuit branches, a spanned row and a one-judge circuit', () => {
  assert.deepEqual(appealsSeats(ARTICLE).map((s) => [s.district, s.judge]), [['I', 'Nathan Petrashek'], ['IV', 'Todd Ziegler']]);
  assert.deepEqual(circuitSeats(ARTICLE).map((s) => [s.circuit, s.branch, s.judge]), [['Adams', '1', 'Daniel Glen Wood'], ['Bayfield', null, 'John P. Anderson'], ['Brown', '1', 'Donald R. Zuidmulder'], ['Brown', '5', 'Marc A. Hammer']]);
});

test("the Supreme Court article's declared candidates", () => {
  const text = "===Declared===\n* [[Lyndsey Brunette]],{{Efn|Described}} Clark County circuit judge\n* [[Pedro Colón]], appeals judge\n\n===Declined===\n* [[Shelley Grogan]]";
  assert.deepEqual(declared(text).map((c) => c.name), ['Lyndsey Brunette', 'Pedro Colón']);
});
