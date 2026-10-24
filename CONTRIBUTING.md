# Contributing

Thank you. Know Your Ballot exists so a voter can understand their whole ballot in a few minutes, and it gets better one source, one state and one correction at a time.

## Ground rules

1. **Non-partisan, always.** We show what official sources and candidates themselves say. No opinions, ratings or summaries of our own about a candidate, party or measure. A candidate's stance is quoted verbatim, with the date and a link.
2. **Never invent.** Every field comes from a documented public source named next to it: an election authority, a court, a campaign-finance regulator, the candidate's own site or filing, Ballotpedia, Wikipedia, a named nonpartisan guide. When a source can't be read, the field stays empty and the build log says so. No scraping of search engines or social platforms.
3. **Never attach the wrong person.** Match by the whole name (and office, district, state), never the surname alone. When two people could match, attach nothing. `scripts/audit.mjs` runs last in every build and drops anything cross-wired; keep it passing.
4. **Fail soft.** A source outage must never empty the site: keep yesterday's data for that field and log it.
5. **The site stays fast and private.** No server, no keys in the browser, no analytics. Big data loads on demand (a judge's profile, a questionnaire), not with the page.

## Before you open a pull request

Run the five questions from [CLAUDE.md](CLAUDE.md) on your change and say what you found in the PR:

1. Is it built in the most secure way? (No secrets; outside text rendered as text.)
2. Is it built in the most efficient way?
3. What regressions could it introduce? Prove it: `npm run lint`, `npm run build`, and click through both themes on a phone and a desktop.
4. Is there dead code, duplicate logic or an unused component?
5. Is anything more complicated than it needs to be?

## Fixing wrong information

Open an issue with the "Wrong information" template, with the page, what it shows, and a link to what's correct. If you can, say which source the wrong value came from (it's named next to the value). Fixes to the matching logic are better than hand edits to the data, because the data is rebuilt every morning.

## Adding a state

A state is a data build plus a thin layer of app configuration. Illinois was first; Michigan was the second and is the template to copy.

1. **Open a "New state" issue** so others know, and work out the sources: the certified candidate list by contest and district, campaign-finance filings (ideally a bulk download), district maps (Census TIGERweb covers Congress and legislatures; county and local lines vary), judges and retention if elected, statewide measures in certified wording, and any nonpartisan questionnaire worth linking.
2. **Data build:** `scripts/<state>.mjs`, with its own modules in `scripts/<state>/`. Reuse the shared steps: `illinois/fec.mjs` (FEC money, by state), `illinois/photos.mjs` and `illinois/social.mjs` (official portraits, Wikidata, campaign sites, by state), `ballotpedia-profiles.mjs` (profiles, survey answers), `wiki.mjs` + a `<state>/incumbents.mjs` plan (who holds each seat and why they're leaving), `illinois/record.mjs` (bills sponsored, from Govbot), `headshots.mjs`, and finish with `audit.mjs`'s `reconcile`. Output goes to `src/data/<state>/` and `public/kyb-photos/<state>/`.
3. **App:** a `src/<state>/` folder with the state's config (`state.tsx` is the switchboard: area labels, office explainers, research links, money sources), its landing hero and plan-to-vote page; register the route in `src/App.tsx` and `src/lib/router.ts`, the card on `src/KybHome.tsx`, the page's title and preview in `vite.config.ts` and `vercel.json`. Saved picks live under `know-your-ballot:<state>:<election date>`.
4. **Refresh workflow:** `.github/workflows/know-your-ballot-<state>.yml`, copied from Michigan's, on a daily schedule.
5. **README:** a "Where the data comes from" entry for the state, naming every source and what isn't covered yet.
6. **Verify** on a phone and a desktop, both themes: an address resolves to the right districts, every race renders, the audit log is clean, and shared links to `/<state>` and `/<state>/ballot` work.

Ask early and often in the issue; a half-built state with clear notes is worth more than a finished one nobody can maintain.

## Code style

Plain, explicit code with a comment that says why. Shared helpers live in one place (`src/Bits.tsx`, `src/Race.tsx`, `scripts/wiki.mjs`, `scripts/ballotpedia-profiles.mjs`); don't copy them into a state. Name things in full words. Keep the data scripts stdlib-only (Node built-ins; Playwright only where a source's bot check needs a browser).
