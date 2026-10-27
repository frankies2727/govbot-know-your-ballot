# Govbot Know Your Ballot

[![Live site](public/badges/live-site.svg)](https://govbot-know-your-ballot.vercel.app)
[![Illinois data](public/badges/illinois.svg)](https://github.com/frankies2727/govbot-know-your-ballot/actions/workflows/know-your-ballot-illinois.yml)
[![Michigan data](public/badges/michigan.svg)](https://github.com/frankies2727/govbot-know-your-ballot/actions/workflows/know-your-ballot-michigan.yml)
[![Minnesota data](public/badges/minnesota.svg)](https://github.com/frankies2727/govbot-know-your-ballot/actions/workflows/know-your-ballot-minnesota.yml)
[![Wisconsin data](public/badges/wisconsin.svg)](https://github.com/frankies2727/govbot-know-your-ballot/actions/workflows/know-your-ballot-wisconsin.yml)
[![Last data refresh](public/badges/data-refreshed.svg)](https://github.com/frankies2727/govbot-know-your-ballot/commits/main)
[![Good first issues](public/badges/good-first-issues.svg)](https://github.com/frankies2727/govbot-know-your-ballot/labels/good%20first%20issue)
[![States wanted](public/badges/states-wanted.svg)](https://github.com/frankies2727/govbot-know-your-ballot/labels/new%20state)
[![PRs welcome](public/badges/prs.svg)](CONTRIBUTING.md)
[![License: MIT](public/badges/license.svg)](LICENSE)
[![Built on Govbot](public/badges/built-on.svg)](https://github.com/chihacknight/govbot)

**Your exact ballot by address: every race, judge and question explained, who's running and who's funding them.** Free, open source, non-partisan, built on [Govbot](https://chihacknight.github.io/govbot/), Chi Hack Night's open civic data.

Govbot is an open-source project of Chi Hack Night that turns every U.S. legislature's activity into open data anyone can clone, query and build on. Know Your Ballot is a free, nonpartisan voter guide built on Govbot. More at [the Govbot website](https://chihacknight.github.io/govbot/) and [Govbot on GitHub](https://github.com/chihacknight/govbot).

### 👉 [govbot-know-your-ballot.vercel.app](https://govbot-know-your-ballot.vercel.app) 👈

| State | Guide | Covers |
|---|---|---|
| 🗳️ Illinois | [/illinois](https://govbot-know-your-ballot.vercel.app/illinois) | Every contest on any Chicago or suburban Cook ballot on Nov 3, 2026, from U.S. Senate to judges, plus every county browsable without an address |
| 🧤 Michigan | [/michigan](https://govbot-know-your-ballot.vercel.app/michigan) | Governor, U.S. Senate, Congress, every seat in Lansing, the Supreme Court and Court of Appeals, the university boards and both statewide proposals |
| 🌲 Minnesota | [/minnesota](https://govbot-know-your-ballot.vercel.app/minnesota) | Governor, U.S. Senate, Congress, every seat in St. Paul, the Supreme Court, Court of Appeals and district court seats and the school-fund amendment |
| 🧀 Wisconsin | [/wisconsin](https://govbot-know-your-ballot.vercel.app/wisconsin) | Governor, Congress, the odd-numbered Senate districts and every Assembly seat, and all three constitutional questions |

**More states are welcome.** Read [CONTRIBUTING.md](CONTRIBUTING.md) and open a [new-state issue](.github/ISSUE_TEMPLATE/new-state.md).

## What a voter gets

Enter an address (it never leaves the browser except to the public address locator) and see the ballot, one race at a time: what the job is, who's running with photo and party, how much each campaign raised and spent, who holds the seat now and, when they aren't running, why. Open a candidate for their own words (survey answers, their issues page), their endorsements, their record in office, and links to dig deeper. Judges carry every bar association's rating and, in Illinois, the full Injustice Watch profile. Decide race by race, skip what you want, plan how you'll vote, print your picks or a full sample ballot, download your picks as a light or dark PDF with an overview, and share a progress card, never your picks.

Everything shown comes from an official or documented public source named next to it. Nothing is summarized, rated or editorialized by us; a candidate's "words" are quoted verbatim with the date and a link.

## How it's built

A static site: a React + Vite app (`src/`) reads JSON that Node scripts (`scripts/`) rebuild every morning in GitHub Actions and commit (`src/data/<state>/`, candidate photos in `public/kyb-photos/<state>/`). Vercel redeploys from `main`. No server, no API keys, no tracking.

```
src/                 the app; src/guide/ is the whole-state guide, src/<state>/ what differs for Michigan, Minnesota and Wisconsin, src/state.tsx the per-state switches
src/data/<state>/    the published data: ballot.json (races, candidates, incumbents), districts, guides, judges
src/govbot/          Govbot's header, footer and stylesheet, copied by scripts/govbot-shell.mjs so the guide looks like Govbot
scripts/             the daily builds: illinois.mjs, state.mjs with <state>/config.mjs for the others, and the modules they share (illinois/* is the original set, used by all)
scripts/audit.mjs    reconciliation, the last step of every build (see below)
public/kyb-photos/   candidate photos, each credited and linked in the app
.github/workflows/   one refresh workflow per state
```

### Run it locally

```bash
npm install
npm run dev        # the site at http://localhost:5173
npm run lint       # type-check
npm run build      # production build (dist/)
```

To rebuild a state's data (what the daily workflow runs): `npm run data:illinois` (needs `pdftotext` from poppler-utils, ImageMagick and `npm install --no-save playwright` for the Board of Elections' bot check) or `npm run data:michigan`, `data:minnesota`, `data:wisconsin` (need `unzip`, `curl`, ImageMagick). Each step is fail-soft: a source that can't be read today keeps yesterday's data for that field, and the log says so.

### Where the data comes from

<details>
<summary><b>🗳️ Illinois</b></summary>

- **Who's on the ballot:** the Chicago Board of Elections candidate list (every contest on any Chicago ballot, in ballot order, plus judicial retentions and referenda), parsed from its PDF. Suburban Cook adds the State Board of Elections' certified list for the congressional, legislative and judicial districts outside Chicago. The four all-suburban County Board districts, suburban referenda and suburban ballot numbers come from the Cook County Clerk, whose site blocks automated downloads; the app tells suburban voters exactly what's missing for their address.
- **Campaign money:** FEC bulk filings for federal candidates; the Illinois State Board of Elections' bulk disclosure files for state and local ones (raised and spent since Jan 2025, cash on hand, plus the $1,000+ contributions reported since the last quarterly report). A name only gets numbers when the whole name matches one person running for the same kind of office.
- **Photos, websites & social accounts:** official sources first (Congress portraits, the General Assembly's member photos via Open States, Wikidata and Wikimedia Commons, campaign sites, hand-picked photos in `scripts/illinois/photos-chosen.json`); whoever is still missing something gets it from their Ballotpedia profile (found by page name, then by Ballotpedia's search, kept only when the page is theirs; when Ballotpedia's firewall answers with a challenge page, the page is read in a headless browser, `scripts/browser.mjs`), then from their own campaign site (the headshot it labels as them, face-checked by `scripts/headshots.mjs`, and the accounts that carry their name).
- **Judges:** Injustice Watch's judicial election guide supplies each judge's photo, every bar group's rating and the whole profile, word for word (`src/data/illinois/judges.json`, fetched when a judge's details open; Injustice Watch publishes under Creative Commons BY-ND): age, law school, judge since, experience, their "Notable" reporting, the candidate survey, the bar groups' comments, icons and endorsements, with the glossary's definitions shown in place. The Alliance of Bar Associations adds each group's rating of the contested seats. A judicial vacancy carries the reason and date from the Illinois Courts' official vacancy list ("Retired on Aug 31, 2025.", "Died on …", "Elected to the Appellate Court on …").
- **Who's in office now, and why they're leaving:** each seat's current holder from Open States' official roster (via Govbot) or the Wikipedia article on that 2026 race. Whether they're on the ballot is read from the candidate lists, never from prose. When they aren't, the reason is read, in order, from the article's sentence about them, the primary they lost (from its results box, with the numbers), the candidates-list heading they're filed under, their own Wikipedia article, Ballotpedia's lists of retiring and defeated incumbents, and last only what the article and the ballot show together. Candidates who already sit in Springfield or Congress carry the bills they sponsored this session, from Govbot.
- **In their words & endorsements:** each candidate's three key campaign messages are their own answer to Ballotpedia's Candidate Connection survey (answers since 2025, quoted verbatim with the date), plus the "Issues" page their own campaign site links. Endorsements are the lists in the Wikipedia article on the race, by the article's own categories. School board candidates carry their Chicago Sun-Times / WBEZ voter-guide questionnaire, in their own words.
- **Your districts:** the address goes once to Cook County's address locator; district maps (Census, Cook County, City of Chicago, Illinois Senate) are pre-baked, so matching happens on the device. With no address, any of the 102 counties can be browsed: the statewide races plus every Congress and Springfield district that reaches into it.
- **Built on Govbot:** Govbot's homepage links here for "What's on my ballot?"; links to a race, `#race=<govbot race id>`, open that race.
</details>

<details>
<summary><b>🧤 Michigan</b></summary>

- **Who's on the ballot:** Ballotpedia's race pages (statewide offices, the U.S. House delegation, both legislative chambers, the Court of Appeals) and Wikipedia's articles for the three university boards. Both are CC BY-SA and linked from the app's Sources. The Secretary of State's certified listing is the official source, but its host refuses automated readers; swap it in (`scripts/michigan/ballotpedia.mjs`) when that changes.
- **Campaign money:** federal races from the FEC; state and local races from the Michigan Transparency Network's nightly all-transaction exports (summed since Jan 2025; the exports carry no cash-on-hand figure).
- **Photos, websites & social accounts:** each candidate's Ballotpedia profile first, then the same official sources Illinois uses (Congress portraits, the Legislature's member photos via Open States, Wikidata and Wikimedia Commons), then the headshot their own campaign site labels as them. `scripts/michigan/photos-chosen.json` takes hand-picked ones.
- **Proposals:** the two statewide proposals in their certified wording, with a plain-English note.
- **Your districts:** the address goes to Photon (OpenStreetMap's geocoder; Nominatim as fallback); Census maps of the congressional, state Senate, state House and county lines are pre-baked so matching happens on the device. The county sets the Court of Appeals district. Any county can be browsed without an address.
- **Who's in office now, in their words, endorsements, records:** the same steps as Illinois, with Michigan's plan (`scripts/michigan/incumbents.mjs`: the Wikipedia articles on the 2026 Michigan races, including the Senate article's term-limited and retiring lists and the boards' convention results; Lansing and Congress bills from Govbot).
- **Not here yet:** county and local offices, trial-court judges and local proposals. The app points voters to their sample ballot at Michigan.gov/Vote.
</details>

<details>
<summary><b>🌲 Minnesota</b></summary>

- **Who's on the ballot:** Ballotpedia's race pages (the statewide offices, the U.S. House delegation, both legislative chambers, the Supreme Court and Court of Appeals seats), CC BY-SA and linked from the app's Sources. Governor tickets take their running mate from the race page, else Wikipedia's article. The Secretary of State's candidate filings (`scripts/minnesota/filings.mjs`, the site's own downloadable text file) are the official list: they decide who is on each ballot, with Ballotpedia's spelling kept for the same person and anyone the state lists but Ballotpedia doesn't added; on a day the filings site's bot check turns the build away, Ballotpedia's lists stand. The 114 district court seats on the ballot come only from the filings (`scripts/minnesota/courts.mjs`): one race per seat, placed by judicial district, with the county-to-district table from Minn. Stat. § 2.722.
- **Campaign money:** federal races from the FEC; state races from the Campaign Finance Board's candidate viewer (`scripts/minnesota/cfb.mjs`: each committee's financial summary, receipts and expenditures summed over 2025 and 2026, with the latest cash balance; a committee is used only when its own record names the candidate's office and district). Affidavit-only candidates (under $750) show none.
- **Photos, websites & social accounts, who's in office, in their words, endorsements, records:** the same steps as Michigan (`scripts/state.mjs` with `scripts/minnesota/config.mjs`).
- **The amendment:** the permanent-school-fund amendment in the Legislature's ballot wording, with a plain-English note (`scripts/minnesota/measures.mjs`), including that a blank counts as a no.
- **Your districts:** Photon (Nominatim as fallback) and pre-baked Census maps of the congressional, state Senate, state House (lettered: 1A, 1B) and county lines; the county gives the judicial district. Any of the 87 counties can be browsed without an address.
- **Not here yet:** county and local offices, school boards and local questions. The app points voters to the Minnesota Voter Information Portal.
</details>

<details>
<summary><b>🧀 Wisconsin</b></summary>

- **Who's on the ballot:** Ballotpedia's race pages (the statewide offices, the U.S. House delegation, the 17 odd-numbered Senate districts and all 99 Assembly districts), CC BY-SA and linked from the app's Sources. No U.S. Senate seat and no statewide judges are up this November. The Elections Commission's certified candidate list is the official source. The Elections Commission's "Candidates on Ballot by Election" list (`scripts/wisconsin/official/*.pdf`, read by `scripts/wisconsin/official.mjs`) is the official list: it decides who is on each ballot, with Ballotpedia's spelling kept for the same person and anyone the Commission lists but Ballotpedia doesn't added. The Commission's site turns scripted readers away, so the PDF is saved in the repo by hand; download the newest from the candidates page and replace it when the Commission reissues it.
- **Campaign money:** federal races from the FEC; state races from the Ethics Commission's campaign finance system (`scripts/wisconsin/sunshine.mjs`: the JSON calls its public pages make, each committee's year-by-year contributions and disbursements summed over 2025 and 2026; a committee is used only when its registration names the candidate's office and district and its name carries the candidate's). No cash-on-hand figure exists there.
- **Photos, websites & social accounts, who's in office, in their words, endorsements, records:** the same steps as Michigan (`scripts/state.mjs` with `scripts/wisconsin/config.mjs`).
- **The questions:** the three constitutional amendments in the Legislature's ballot wording, with a plain-English note on each (`scripts/wisconsin/measures.mjs`).
- **Your districts:** Photon (Nominatim as fallback) and pre-baked Census maps of the congressional, state Senate, Assembly and county lines. Any of the 72 counties can be browsed without an address.
- **Not here yet:** county offices and local referendums. The app points voters to MyVote Wisconsin.
</details>

### Outside spending, every state

Every federal candidate with an FEC id also carries what outside groups spent for and against them this cycle (`scripts/illinois/fec.mjs`, from the FEC's bulk file of committee transactions: the 24E rows are independent expenditures supporting a candidate, 24A ones opposing, named by the committee master). The candidate's details and the compare sheet show the totals, the biggest spenders and a link to the FEC's own list. These are the FEC's processed filings, so they lag the 24/48-hour reports by a few days.

### Reconciliation, every build

`scripts/audit.mjs` is the last step before a ballot is written. Anything attached to a candidate whose source names someone else is dropped and logged: a legislature portrait or site for someone who isn't a sitting legislator of that name, a Ballotpedia page with another name, a legislative record for a non-legislator, and a site, account, photo or money id two candidates share. Upstream, a candidate is matched to a sitting member, a legislator or a money filing only when the whole name agrees, never the surname alone. Run it by hand: `npm run audit -- il`, `mi`, `mn` or `wi` (add `--write` to apply).

### Privacy

The address is sent once to the public address locator named in the app and nowhere else. Picks, plans and progress stay in the browser's local storage. The share card shows progress, never picks. No analytics, no cookies. The live count and heart below are anonymous too: a tab's random id lives in memory only, and the one thing kept about a connection is a keyed hash of its address, which expires within the hour.

## Reports from readers

Every race, candidate, judge and measure carries a **Report a mistake** link. It opens a short form (what it shows, what is correct, a link to a source) that `api/report.ts`, a Vercel function, files as a GitHub issue labelled `wrong-information` and `from-site`, so a reader needs no GitHub account. Against spam it uses a hidden honeypot field, a minimum fill time, length and link checks, and a per-address limit; dropped reports still answer "thank you" so a bot learns nothing.

The function needs one secret in the Vercel project (Settings → Environment Variables): `GITHUB_REPORT_TOKEN`, a fine-grained GitHub token with **Issues: read and write** on this repository only. Without it the form answers that reports aren't set up and offers GitHub's own form instead.

## Search engines and AI assistants

What a crawler or an AI assistant reads, before any script runs, is built from the same sourced data and copy the app shows.

- **Files:** `robots.txt` (everyone welcome, AI crawlers named, `/api/` kept out), `sitemap.xml` (each page's `lastmod` is its candidate list's own date, never the build time), `llms.txt` (a plain summary an AI reads first) and `llms-full.txt` (every state's key dates, statewide races with candidates, what each office does, ballot questions and how the ballot works). The Vite plugin in `vite.config.ts` writes them from `scripts/seo/`; the site's address is one constant, `SITE`.
- **Text in each page:** `scripts/seo/page-body.ts` writes readable text inside `<div id="root">` of the home page and each state page (election date, key dates, the statewide races with candidates in the data's own order, what each office does, ballot questions, how the ballot works, common questions). The app's first render replaces it, so it is the same facts in a different dress, never hidden text; layout shift stays under 0.01. The `<head>` carries JSON-LD (the site and its organization; for a state also the page, the election, breadcrumbs and the questions).
- **One copy of the words:** `src/seo/copy.ts` holds "How a ballot works" (the app's panel renders from it), the official voter portals and the two questions about the site. `src/seo/faq.ts` builds every question from the ballot data, the offices' explainers and the key dates, never from fresh writing, and the same function feeds the visible "Common questions" section, the page text and the FAQ markup, so they cannot disagree. Only statewide ballot questions are called statewide; local ones are counted separately.
- The address-specific `/<state>/ballot` pages send `X-Robots-Tag: noindex, follow` (in `vercel.json`) so only the state pages are listed.
- **Check it:** after `npm run build`, `npx esbuild scripts/seo-test.mjs --bundle --platform=node --format=esm --outfile=/tmp/seo-test.mjs && node /tmp/seo-test.mjs` reads the built pages (every FAQ answer appears verbatim in the page text, the JSON-LD parses, `llms-full.txt` covers every state).

## Live count and heart

Every page floats two small things: a message that reads "N people have used the Govbot guide to vote more informed" (all four states together, with how many are here right now beside it) and a heart anyone can tap, which everyone else sees as "Someone just hearted this page". On a state's pages only the heart shows; tapping it opens and closes the message. N counts every distinct browser tab that has opened the guide since the counter began (a HyperLogLog, so it stays tiny); it counts people who opened the guide, not who voted or what they learned. `src/Pulse.tsx` polls `api/pulse.ts` every 25 seconds while the tab is visible; `api/heart.ts` adds a heart. A tab counts as "here" for a minute after its last ping, and joins the total the first time it pings. The numbers live in a Redis store connected to the Vercel project (Storage → Marketplace): either **Upstash** (Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`) or Vercel's own **Redis** (it adds `REDIS_URL`, read over a normal connection by the `redis` package, opened on first use and again if it drops). A custom prefix works for both. One address can't inflate them (120 pings a minute, 5 hearts an hour, keyed by an HMAC of the address that expires), and a page from another site can't call the endpoints. It is a vanity number, not a measurement of who voted. With no store connected the endpoints answer 503 and the floaters aren't drawn. The logic is tested offline: `node --experimental-strip-types scripts/pulse-test.mjs`.

## Contributing

Bug reports, corrections and new states are all welcome; see [CONTRIBUTING.md](CONTRIBUTING.md). Wrong information about a real person is fixed first: use the [wrong-information issue template](.github/ISSUE_TEMPLATE/wrong-information.md).

## Licence

Code: [MIT](LICENSE). The data files are compiled from the public sources named above and in the app's Sources section, each under its own terms (government records; Ballotpedia and Wikipedia, CC BY-SA; Injustice Watch, CC BY-ND; Open States, CC0). Candidate photos are credited and linked to their source in the app.
