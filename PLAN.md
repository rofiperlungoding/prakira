# Prakira: Master Plan and Handoff

Plan version: 2 (2026-10-07, night, WIB). Update section 13 at the end of every work session.

**Audience:** any AI agent or human continuing this project with no prior chat context. Read this file first, then `docs/climate-novelty-literature.md`, then `README.md`, then the code. Do not rely on memory of earlier chats; everything needed is here.

**How to read status words in this file:**
- **Verified** = checked by running a command or reading a primary source, on the date given.
- **Recorded** = taken from an earlier written record, not re-checked today.
- **Unverified** = believed true, not checked. Check before relying on it.

---

## 1. Mission and constraints

Submit a working, honest project to **ForgeHacks Online 2026**, track **AI + Climate**.

| Item | Value | Status |
|---|---|---|
| Deadline | Sat 2026-10-10, 12:00 PM Eastern. Earliest reading (EDT, UTC-4) = **23:00 WIB**. | Recorded 2026-09-17 (organizer ticket). Event site re-read 2026-10-07: "Oct 10, 12:00 PM: hacking ends, submissions lock". |
| Internal submit target | **Sat 2026-10-10, 18:00 WIB** | Decision |
| Track prompt | "Build an AI-powered solution addressing environmental understanding, climate preparation, resource use, or resilient systems." | Verified 2026-10-07 (forgehacks.vercel.app) |
| Judging criteria | Real-World Impact & Relevance; Technical Implementation & AI Use; Innovation & Creativity; Execution & Completeness; Presentation & Communication. No published weights. | Recorded 2026-09-16 |
| Required artifacts | Title, description, track, public demo video "2 to 4 minutes max", public GitHub repo with README, usage/testing instructions. | Recorded 2026-09-16/17 |
| Pre-existing work | Generic boilerplate allowed; project-specific code must be built during the event; disclose what you started with. | Recorded 2026-09-17 |
| Team | Registered on Devpost. Owner `rofi` (GitHub `rofiperlungoding`) does the build with AI assistance. | Stated by owner 2026-10-07 |
| Budget | $0. Free tiers only. No paid fallbacks. | Standing rule |

**Devpost rules could not be re-read on 2026-10-07** (the site returned HTTP 429 to automated fetches three times, and the browser extension was not connected). The owner must open `https://forgehacks-2026.devpost.com/rules` once by hand and confirm five things: deadline time and timezone, video length limit, repo must be public, team/track lock, any new rule since 17 Sep. Record the result in section 13.

---

## 2. The product (definitive concept)

**Prakira: an auditable multi-hazard climate briefing for a household.** The name comes from the Indonesian *prakiraan* (forecast). Earlier working name: Climate Brief. The local folder is still `climate-brief`; the public repo is `prakira`.

The user picks a place and says who lives there (older adult, young child, outdoor worker, asthma or lung condition, pregnant, flood-prone home, no air conditioning). They get, in English or Bahasa Indonesia:

1. A **72-hour hazard strip**: heat, rain, air quality, UV for today and the next two days, with levels set by published rules.
2. A **climate context line**: how the coming days compare with the local 1991 to 2020 normal for the same week.
3. A **briefing**: 4 to 8 short actions written by a language model for this household, each tied to the numbers it relies on.
4. An **audit panel**: how many model claims passed verification, which were rejected and why, the model name, data sources and timestamps.

**Division of labour, which is the core of the design:**

| Layer | Does | Trust |
|---|---|---|
| Data (Open-Meteo forecast, air quality, archive) | Supplies numbers | Trusted as a source, with stated limits |
| Rules (`lib/facts.mjs`) | Computes heat index, levels, anomaly, compound-day flag | Deterministic, unit-tested |
| Model (Mistral) | Chooses what matters for this household and writes plain-language actions | **Untrusted** |
| Verifier (`lib/verify.mjs`) | Rejects any claim whose numbers or level do not match the data | Deterministic, unit-tested |
| Fallback | Fixed-template notice for any serious hazard the model skipped | Deterministic |

**One-sentence pitch:** "Forecasts tell you the weather; Prakira tells your household what to do about it, and shows the receipts for every number."

**Wording rules for all public text:** use "auditable", "verified against the forecast data", "we did not find". Never use "first", "novel", "state of the art", "more accurate than", "medical". The tool is a companion to official warnings, not a replacement.

---

## 3. Why this fits AI + Climate (argument for judges, with sources)

Full review: `docs/climate-novelty-literature.md` (38 references, 15 abstracts read, 36 Scopus queries, 2026-10-07).

1. **The harm is real and unequal.** Heat, air pollution and heavy rain harm health, and older people, children, outdoor workers and people with chronic illness carry more of the risk (Jay 2021, Benmarhnia 2015, Romanello 2022).
2. **Generic warnings lose people.** Public systems issue standard messages; people ask "how does this affect me" and "what can I do" (Ou 2025). Understanding and judging a warning comes before acting on it (Lindell 2012).
3. **The field asks for this direction.** A 2025 systematic review of heat-health warning systems recommends personalisation and digital targeted warnings (Chandra 2025). Weather-warning experts named tailored and multilingual warnings as the promising use of AI, and named accountability and over-reliance as the risks (Kox 2025).
4. **Current generative AI falls short in specific, measurable ways.** In an evaluation of 31 ChatGPT-4o heat messages, most were accurate, none met a grade 8 reading level, and few framed heat within climate change (MacKay 2026). LLM hallucination is a named risk in flood communication work (Karimanzira 2025).
5. **So the project targets exactly those gaps:** verified numbers (accountability), a readability target, climate framing through the local normal, multi-hazard, two languages.

**Design requirements traced to sources (R1 to R8):**

| ID | Requirement | Source | Where it is implemented or checked |
|---|---|---|---|
| R1 | Each item: threat, why it matters to this household, one action | Lindell 2012; Ou 2025 | Claim schema; prompt; manual review (M9) |
| R2 | Shown numbers and levels match the data | Karimanzira 2025; Huang 2025; Gao 2023 | Verifier; eval pass rate and catch rate |
| R3 | Readable at about grade 8 or below | MacKay 2026 | Flesch-Kincaid in eval (M6) |
| R4 | Climate framing, not only weather | MacKay 2026; track prompt | Anomaly vs 1991 to 2020 normal (M4) |
| R5 | Show forecast uncertainty | LeClerc 2015 | Rain probability shown beside rain amount |
| R6 | Flag days where hazards coincide | Du 2024; Schnell 2017 | Compound-day fact (M5) |
| R7 | More than one language, tailored | Kox 2025; Zhao 2025 | English and Bahasa Indonesia; eval in both |
| R8 | Do not replace the official voice; stay accountable | Kox 2025 | Official-source link, companion label, visible rejections |

**Prior art that must be acknowledged, not hidden:** ClimApp and HEAT-SHIELD already give personalised forecast-based heat warnings without an LLM, with stronger physiology than this project. LLM advisories from live data exist for single hazards (Ou 2025 floods, HIAPLLM air quality, AgroMetLLM irrigation). Forecast-to-text generation is a 20-year-old field. This project's possible contribution is the combination: household-facing, multi-hazard, per-claim numeric verification with visible rejections, a repeatable public evaluation, and climate framing. That is "not found in our review", not "proven new".

---

## 4. Current state

| Item | State | Status |
|---|---|---|
| Repo | Local `C:\Users\Rofi\Documents\Codes\climate-brief`, branch `main`; public remote https://github.com/rofiperlungoding/prakira | Verified 2026-10-07 |
| MVP | Facts, model call, verifier, server, single-page UI, eval script | Verified by tests and curl 2026-10-07 |
| Tests | `npm test`: 43 of 43 pass (design change, intake, two models, word lists, NASA POWER) | Verified 2026-10-07 |
| UI | Redesigned (M7): 72-hour strip, climate row, briefing cards with number chips, audit link between cards and cells, audit panel, full English and Indonesian interface, light and dark. Checked in headless Chromium in three scenarios: no overflow, no console errors, audit link works. Screenshots in `docs/screenshots/`. | Verified 2026-10-07 |
| Eval | Two live runs on 2026-10-07 (section 8) | Verified |
| Science of the bands | Fixed in M1 (section 6a). Rain classes remain unverified against a primary source. | Verified 2026-10-07 |
| Climate context, compound flag, coverage fallback | Built (M2, M4, M5) | Verified 2026-10-07 |
| Readability metric | Built (M6); first result 60% at or below grade 8 | Verified 2026-10-07 |
| Deployment | Live at https://prakira.rofihosted.space since 2026-10-07 (M8). The deployed code is commit `46b5cb2`; redeploy after any later change. | Verified 2026-10-07 |
| Diagram, README, review notes | Done (M9) | Verified 2026-10-07 |
| Video, Devpost text | Not started | |

Runtime: Node 20 or newer (dev machine: Node 25, Windows 11). Zero npm dependencies. Plain ES modules, no build step. Keep it that way unless a task says otherwise.

---

## 5. Architecture and file map

```text
climate-brief/
  server.mjs            HTTP server: GET /, GET /api/geocode?q=, POST /api/brief
  public/index.html     Landing page and tool, vanilla JS. Model text is rendered with textContent only.
  public/about.html     About page: why it exists, the research behind it, limits, references
  lib/facts.mjs         Open-Meteo fetch, fact table, hazard bands
  lib/llm.mjs           Mistral call (JSON mode), prompt. Default model open-mistral-nemo
  lib/verify.mjs        Claim verifier and the PROFILES allow-list
  lib/notice.mjs        Standard notices for serious hazards the model skipped; compound-day notice
  lib/trace.mjs         Real steps with durations, for the live process display
  lib/intake.mjs        "Describe your home": one sentence read into allowed form choices
  lib/outlook.mjs       Long-range outlook from three climate models
  lib/models.mjs        Agreement between a physics and an AI forecast model (temperature, 6-hourly steps)
  lib/store.mjs         Disk cache (folder data/, gitignored) for normals and outlooks
  eval/places.mjs       Tuned and held-out location lists
  lib/climate.mjs       Climate context: forecast maximum against the 1991 to 2020 week average
  scripts/ui-check.cjs  Headless browser check and screenshots (needs an existing Playwright install)
  docs/screenshots/     Screenshots from the last UI check
  docs/brand/           Logo mark, logo lockup, preview
  lib/brief.mjs         Orchestration and retry (max 3 attempts, 3 s apart)
  lib/limits.mjs        In-memory rate limiter and response cache for the public deployment
  lib/verify.test.mjs   Unit tests for the verifier
  lib/facts.test.mjs    Unit tests for heat index, bands and fact building
  eval/run.mjs          Live eval over 20 fixed locations; writes eval/out/report.json (gitignored)
  docs/climate-novelty-literature.md   Literature review v0.2
  AGENTS.md             Entry point for any AI assistant; points here
  README.md             Public description (must be updated in M9; currently describes the MVP)
  PLAN.md               This file
  .env                  MISTRAL_API_KEY (gitignored; never commit, print or log)
  DEPLOY.local.md       Private server deployment notes (gitignored)
```

**Request flow:** `POST /api/brief {lat, lon, lang, profile[]}` then `getFacts` then `askModel` then `verifyAll` then response `{facts, warnings, model, claims, rejected, total, error, attempts}`.

**Claim schema (model output):** `{fact_ids: string[], level: string, evidence: string, advice: string}`.

**Verifier rules (current):** all fields non-empty; every `fact_id` exists; `level` equals the level of the first cited fact (case-insensitive, including `n/a`); every number in `evidence` matches a cited fact value within half a unit at the written precision; the label "PM2.5" is removed before numbers are extracted.

**External services:**

| Service | Use | Key | Limits to respect |
|---|---|---|---|
| Open-Meteo forecast, air quality, geocoding | Live data | None | Free for non-commercial use; attribution required (CC BY 4.0). Air-quality API timed out once in testing. |
| Open-Meteo archive (ERA5-based) | 1991 to 2020 normals (M4) | None | One 30-year daily request is about 200 kB; verified working 2026-10-07. Cache it. |
| Open-Meteo climate API (CMIP6) | Stretch S1 only | None | Verified reachable 2026-10-07 |
| Mistral | Text generation | `MISTRAL_API_KEY` | `open-mistral-nemo` works (about 188 requests per minute at last check). `mistral-small-latest` returns 429 with a limit of 0; `mistral-large-latest` returns 403. `ministral-8b-latest` also works. |

---

## 6. Science audit: what is wrong or unproven today

These were found on re-checking the MVP. Fix them in M1 before publishing any result.

| # | Issue | Evidence | Fix |
|---|---|---|---|
| S1 | **Heat cut points and their comment disagree.** Code uses 27 / 32 / 41 / 54 °C but the comment says they follow 80 / 90 / 103 / 125 °F, which are 26.7 / 32.2 / 39.4 / 51.7 °C. The values 41 and 54 °C correspond to 105 and 130 °F, a different published version of the table. | Arithmetic | Open the US National Weather Service heat index page, record the category boundaries and the URL, and use exactly those. |
| S2 | **Wrong variable for those bands.** The bands are defined for the NWS heat index (temperature plus humidity, in shade). The code applies them to Open-Meteo "apparent temperature", which is a different formula that also includes wind and radiation. | Definition mismatch | Compute the NWS heat index (Rothfusz regression with the NWS adjustments) from hourly `temperature_2m` and `relative_humidity_2m`, take the daily maximum, and unit-test against at least three cells of the official NWS chart. This also answers Chandra 2025's call for humidity-aware indices. |
| S3 | **Rain classes are approximate.** Code uses <5, 5 to 20, 20 to 50, 50 to 100, >100 mm/day and cites BMKG. The BMKG daily classes as remembered are light 0.5 to 20, moderate 20 to 50, heavy 50 to 100, very heavy 100 to 150, extreme above 150. | Unverified memory | Find the BMKG source page, record the URL, match the code to it, and add the "extreme" class. Note in the UI that rain amount is not a flood forecast. |
| S4 | **UV bands use raw decimals.** WHO categories are defined on the rounded index (0 to 2, 3 to 5, 6 to 7, 8 to 10, 11+). The code puts 2.5 in "low"; rounded it is 3, "moderate". | Definition | Round the UV index first, then classify. Verify the WHO category table from a primary source. |
| S5 | **AQI is an hourly maximum.** The US AQI is defined on averaging periods (24-hour for PM2.5). The code takes the highest hourly `us_aqi` from Open-Meteo for the day. | Definition | Read the Open-Meteo documentation for `us_aqi` and state exactly what is shown ("highest hourly US AQI value forecast for the day"). Confirm the EPA category boundaries from the EPA source. |
| S6 | **Forecast data comes from a model, not from sensors.** Open-Meteo air quality is CAMS model output at coarse resolution; street-level values can differ a lot. | Source characteristics | Say so in the audit panel and README. |
| S7 | **Anomaly method has a known bias (for M4).** Comparing a forecast model's value with an ERA5-based normal mixes two models. | Method | State it as "compared with the ERA5-based 1991 to 2020 average for this week"; show it rounded to whole degrees; do not attach health claims to the anomaly. |

Every band must have, in a code comment and in the README: the source name, the URL, and the date it was checked.

### 6a. Outcome of M1 (2026-10-07)

| # | Result | Status |
|---|---|---|
| S1, S2 | Heat is now the daily peak of the hourly NWS heat index (simple formula averaged with temperature, Rothfusz regression at 80 °F and above, both NWS adjustments). Categories on whole °F: <80 low, 80 to 89 caution, 90 to 102 extreme caution, 103 to 124 danger, 125+ extreme danger. Tests reproduce both NWS published examples. | Verified from the two NWS pages |
| S3 | Rain classes rewritten (<1, to 20, to 50, to 100, to 150, above), with an "extreme" class. The BMKG page redirected and the table was **not** confirmed from a primary source; only the 150 mm threshold was corroborated by news reports. Stated as unverified in code and README. | **Unverified** |
| S4 | UV is rounded first. The WHO page checked gives three action tiers (0 to 2, 3 to 7, 8+), so the code uses those three instead of the five named categories, which could not be confirmed from a primary page. | Verified (three tiers) |
| S5 | Open-Meteo documents that `us_aqi` already uses the EPA averaging periods. The daily maximum of that index is shown and described as such. EPA category table confirmed. | Verified |
| S6 | CAMS model resolution (about 11 km Europe, 45 km global) recorded in the README. Still to be shown in the UI audit panel (M7). | Partly done |

Observed in a live check after M1: for London at AQI 58 ("moderate") the model advised staying indoors and using an air purifier. That is over-warning. M3 must make the advice proportionate to the level (no protective action beyond "no special action needed" for the lowest two levels), and the manual review in M9 must count over-warnings.

---

## 7. Work plan

Status key: `[ ]` todo, `[~]` in progress, `[x]` done. Work in the listed order. A task is done only when its acceptance test passes and the change is committed. If a task runs more than twice its estimate, stop, write down why in section 13, and take the fallback.

### Must-have (M)

- [x] **M0. Push to a public GitHub repo (20 min).** Done 2026-10-07: https://github.com/rofiperlungoding/prakira (public). Do this first so the commit history shows work inside the event window. Check `git log --all -p -- .env` is empty before pushing. Repo name: `prakira` under `rofiperlungoding` (decided 2026-10-07). *Accept:* repo opens in a logged-out browser.

- [x] **M1. Science fixes S1 to S6 (3 h).** Done 2026-10-07; outcome in section 6a.
  - Add `temperature_2m` and `relative_humidity_2m` hourly to the forecast request; compute NWS heat index per hour; daily maximum becomes fact `heat-N` with metric "peak heat index".
  - Correct heat, rain, UV bands from primary sources; record URLs in comments.
  - Keep `apparent_temperature_max` out of the fact table, or keep it as a context-only fact. Do not classify it.
  - *Accept:* unit tests cover three official NWS chart cells, every band boundary on both sides, UV rounding, and the new rain class. `npm test` passes. README lists each source with URL and check date.
  - *Fallback if the NWS adjustment terms take too long:* use the plain Rothfusz regression at or above 80 °F and air temperature below that, and state it.

- [x] **M2. Hazard coverage (2 h).** Done 2026-10-07 (`lib/notice.mjs`; response field `notices`; thresholds in `SERIOUS` in `lib/facts.mjs`: heat extreme caution, rain heavy, air unhealthy for sensitive groups, UV extra protection). After verification, for each fact with a level of moderate concern or worse (define the threshold per hazard in one table) that no verified claim cites first, add a **standard notice** built from a fixed template ("Heat index reaches 41 °C tomorrow (danger). Follow your local heat guidance."). Label it in the response as `kind: "notice"` so the UI can show it differently from model advice. No second model call.
  - *Accept:* eval reports hazard coverage of 100% with notices counted, and separately the share covered by model claims alone. Unit test for the notice builder in both languages.

- [x] **M3. Constrain the advice text (1.5 h).** Done 2026-10-07; what was built is in section 7a. Prompt: short sentences, common words, no clock times, no temperatures, no doses, no brand names, no diagnosis, one action per claim. Verifier: reject a claim whose `advice` contains any digit.
  - *Accept:* unit tests; one eval run before and after, both recorded in section 8. If the raw pass rate falls below 80%, relax to "digits allowed only if they match a cited fact" and record that decision.

- [x] **M4. Climate context (2.5 h).** Done 2026-10-07 (`lib/climate.mjs`, response field `context`). Built as a deterministic line in the UI; the model does **not** see or cite it (simpler and safer than planned). Live check: Jakarta +3 °C, London -1 to +2 °C, Phoenix +6 to +7 °C against the 1991 to 2020 week average; cold request about 2 to 10 s in total, cached lookup about 1 ms. For the location, fetch daily `temperature_2m_max` for 1991-01-01 to 2020-12-31 from the Open-Meteo archive once, compute the mean over the 7-day window centred on each forecast date, cache in memory by rounded coordinates. Add `temperature_2m_max` to the forecast request. Create facts `normal-N` (value, °C) and `anomaly-N` (forecast minus normal, rounded to whole degrees, level `n/a`). Optional layer: on failure add a warning and continue.
  - Show it in the UI as one line per day and a small bar. The model may cite it as context. No health claim may be tied to the anomaly.
  - *Accept:* unit test of the window mean with a small synthetic series; a live check for Jakarta and London prints plausible normals; the request completes in under 5 s cold and under 0.5 s cached.

- [x] **M5. Compound-day flag (45 min).** Done 2026-10-07 (`buildCompound` in `lib/notice.mjs`, response field `compound`). One deterministic notice listing the days; never written by the model. Its health sentence rests on Du 2024, of which only the title was checked: confirm from the paper before the submission, or soften the sentence. Deterministic fact `compound-N` when, on the same day, heat is at "extreme caution" or worse and air quality is at "unhealthy for sensitive groups" or worse. Include it in the standard-notice set.
  - *Accept:* unit tests for the four combinations.

- [x] **M6. Readability (1 h).** Done 2026-10-07 (`lib/readability.mjs`; the eval reports the median Flesch-Kincaid grade of each verified claim, action plus evidence, and the share at or below grade 8; English only). First result is in section 8, run 6: 60% at or below grade 8, under the 70% bar set here. **The one allowed prompt tightening has not been done yet. If it is done, do it while looking only at the tuned set, then re-run the held-out set once.** Add a Flesch-Kincaid grade function (pure JS, syllable heuristic) and report, in the eval, the median grade and the share of English claims at or below grade 8. Do not report it for Indonesian (the formula is not valid there); say so.
  - *Accept:* unit test on two reference sentences with hand-computed values; eval prints the metric. If under 70% of claims meet grade 8, tighten the prompt once and re-run.

- [x] **M7. Interface redesign (5 h).** Done 2026-10-07 (`public/index.html`, single file, no framework). Checklist result is at the end of section 9. Polish left over: in the quiet case the audit text still says "0 attempts"; on a 375 px screen the compound badge sits close to the heat number; long Indonesian level names wrap to three lines in a phone cell.

- [x] **M8. Deploy to the owner's own server (2.5 h).** Done 2026-10-07: live at https://prakira.rofihosted.space. Verified through the public URL: `/healthz` 200; a briefing returned verified claims; the key value is absent from the page and from API responses; the 11th uncached briefing from one address got HTTP 429; the server's other sites answered as before. **Not verified: loading from a phone on mobile data, other browsers, stability over days.** Redeploy steps are in `DEPLOY.local.md` (one script, restarts only this service). Original task text follows. Hosting decision (2026-10-07): the owner's self-hosted Linux server behind a Cloudflare Tunnel. Target URL: `https://prakira.rofihosted.space`. **Server-side steps and cautions are in `DEPLOY.local.md` (not in git, on the owner's machine) and in the server's own repository docs. Read them first; that server is live and used by other people.**
  - Code changes needed here first: bind `127.0.0.1` (host from env); add `GET /healthz`; configurable port; take the client address from the `CF-Connecting-IP` header for rate limiting; add an in-memory per-IP limit (for example 10 briefings per 10 minutes) and a short response cache keyed by rounded coordinates, profile and language; cap the normals cache at about 50 locations; send basic security headers (`X-Content-Type-Options`, `Referrer-Policy: same-origin`, a Content-Security-Policy that allows only self and the font host).
  - The Mistral key is created on the server in an env file, never committed and never printed.
  - *Accept:* `/healthz` returns 200 on the public URL; a briefing for Jakarta loads from a phone on mobile data; the key appears in no response; a burst of 20 requests is rate-limited; the server's other services still report healthy.
  - **Risk:** judging runs 10 to 12 October and the demo depends on one self-hosted machine. Mitigations: the recorded backup clip (M10), local-run instructions in the README, the server's existing monitoring. If the server proves unstable on 9 October, fall back to a free Node host (Render or Railway) and keep the first URL as a mirror.

- [x] **M9. Evidence and writing (4 h).** Done 2026-10-07, with two departures from the task text, both stated in the README: one final run per set and language (four runs) instead of three runs of the tuned set; and the 12-briefing review was a read-through by the AI assistant, not by a person (`docs/manual-review.md`). A human review is still open.
  - Three full eval runs in English and one in Indonesian; record all in section 8 and the README, with dates and commit hashes. Report every run, not the best one.
  - Manual review of 12 briefings (6 English, 6 Indonesian, at least 4 with vulnerable profiles): mark each action as sensible, vague, or wrong or unsafe. Report the counts. Save the reviewed outputs in `docs/manual-review.md`.
  - README: what it is, live URL, three-command local run, how to run tests and eval, architecture diagram, sources for every band, results, limits, literature summary with link, provenance and AI-assistance disclosure, data attribution.
  - One architecture diagram (SVG) showing the trusted and untrusted layers.
  - *Accept:* a person who has never seen the project can run it and find every claim's evidence from the README alone.

- [ ] **M10. Demo video (2.5 h).** 2:30 to 3:30; never over 4:00. Script in section 10. Record a clean successful run as a backup clip before the final recording. Upload, then open the link logged-out.

- [ ] **M11. Devpost text and submission (1.5 h).** Draft in `docs/devpost-draft.md` first. Include the disclosure from section 11. Submit by 18:00 WIB on 10 Oct, then open the public project page logged-out and click every link. Make no risky change after submitting.

### 7a. What M2 and M3 built (read before touching the model path)

- **Serious facts are chosen by rules, per household** (`thresholds(profile)` and `isSerious` in `lib/facts.mjs`). Base: heat extreme caution, rain heavy, air unhealthy for sensitive groups, UV extra protection. A profile lowers the threshold for its own hazard only: older adult, young child, pregnant, outdoor worker or no air conditioning lowers heat to caution; respiratory condition lowers air to moderate; flood-prone home lowers rain to moderate; outdoor worker or young child lowers UV to protection needed. **These adjustments are this project's judgement from the wording of the NWS and EPA categories, not an official rule. Say so wherever they are described.**
- **Quiet mode:** if nothing is serious for the household, there is no model call and no advice (`quiet: true`). This is deliberate, to avoid over-warning (LeClerc 2015).
- **The prompt** tells the model exactly which fact ids each claim must start with, one claim per hazard, covering all serious days of that hazard.
- **The verifier** now also rejects: a claim that mixes hazards; a claim whose first fact is not serious for the household; advice containing any digit; advice that says to stay indoors or inside below the levels danger, extreme danger, unhealthy, very unhealthy, hazardous, extreme (keyword heuristic, English and Indonesian only). It reads a decimal comma as a decimal point, because Indonesian text writes "37,6".
- **Notices:** one per hazard, describing the worst uncovered day and citing all uncovered days of that hazard.
- The model sometimes wraps its JSON object in a one-element array; `askModel` unwraps it.

### Stretch (only after M0 to M11 are done)

- **S1. Long-term outlook card.** Days per year above a fixed heat threshold, 1991 to 2020 versus 2041 to 2050, from the Open-Meteo climate API (one CMIP6 model, named). Strengthens "climate preparation". About 3 h. High value, but only if everything else is finished.
- **S2. Ozone as a fact** from the air-quality API.
- **S3. Country-specific official-source links** beyond Indonesia (BMKG) and a generic line.
- **S4. Copy or share the briefing as text.**

### Schedule

| When (WIB) | Work | Hours |
|---|---|---|
| Wed 7 Oct, night | M0 | 0.5 |
| Thu 8 Oct | M1, M2, M3, M5, then M4. One eval run at the end. | 10 |
| Fri 9 Oct | M7 (morning), M8 (early afternoon), M6, M9 | 12 |
| Sat 10 Oct, 08:00 to 13:00 | M10 | 3 to 5 |
| Sat 10 Oct, 13:00 to 17:00 | M11, final link checks | 2 to 4 |
| Sat 10 Oct, 18:00 | **Submit.** 5 hours of buffer remain before 23:00. | |

Total estimated work: about 26 hours in under three days, for one person with AI help. This is tight. **Cut order if time runs out:** S-items first, then M6, then M5, then reduce M7 to a polish pass on the current page, then M4. Never cut M1, M2, M8, M9, M10, M11.

---

## 8. Evaluation record

Both runs 2026-10-07, MVP code, 20 locations, model `open-mistral-nemo`, English, four rotating household profiles.

| Metric | Run 1 | Run 2 |
|---|---|---|
| Model claims passing verification | 110 of 114 (96.5%); 1 location failed on an upstream timeout | 110 of 110 (100%) |
| Hazard coverage (serious facts cited first by a verified claim) | 76.9% | 67.8% |
| Verifier catch rate on deliberately corrupted claims | 99.5% (one gap, since fixed) | 100% |

Limits of these numbers: the code changed between the two runs; the bands had the errors listed in section 6; 20 hand-picked, mostly hot locations; two runs; the same verifier filters and scores; no human review yet. **Do not publish these as final results.** They are superseded once M1 to M3 are done.

**Run 3, 2026-10-07, after M1 and M2 (code after commit 682634e), English, 20 locations, 0 failed:** model claims passing verification 97 of 99 (98.0%); serious facts 95; covered by a verified model claim 66.3%; covered with standard notices 100% (by construction); verifier catch rate 100%. Not comparable with runs 1 and 2: heat is now the NWS heat index and "serious" has per-hazard thresholds.

Finding from run 3: the model covers only about two thirds of serious facts, so hot, polluted cities get many notices (Jakarta: 5; Bangkok: 6). M3 must list the serious facts in the prompt and ask for one claim each, and M7 must group notices by hazard so they do not swamp the briefing.

**Runs 4 and 5, 2026-10-07, after M3 (code after commit b93adde), 20 locations each, 0 failed, 1 quiet location (Madrid):**

| Metric | Run 4, English | Run 5, Indonesian |
|---|---|---|
| Model claims passing verification | 37 of 44 (84.1%) | 40 of 42 (95.2%) |
| Serious facts covered by a verified model claim | 78.0% | 89.0% |
| Covered with standard notices | 100% (by construction) | 100% (by construction) |
| Verifier catch rate on corrupted claims | 100% | 100% |
| Rejection reasons | stay-indoors advice at "extreme caution" 4; advice with a number 1; wrong level 1; non-serious first fact 1 | non-serious first fact 1; mixed hazards 1 |

How to read these: the pass rate fell from run 3 because the verifier is stricter (it now rejects disproportionate and numeric advice), not because the model got worse. Claims are now one per hazard, so there are about 42 per run instead of about 100. **Caveat: the prompt was tuned once after looking at results on these same 20 locations. There is no held-out set, so these numbers are optimistic.** M9 must add locations that were never used for tuning and report them separately.

Intermediate runs during M3 development (not comparable, code was changing): Indonesian 57.1% before the decimal-comma fix (14 of 18 rejections were "37,6" read as two numbers), then 92.9%; English 79.5% before the prompt listed required fact ids.

**Run 6, 2026-10-07, first run on the held-out set (code after commit 5058c88), English, 15 locations never used for tuning, 0 failed, 2 quiet (Paris, Toronto):**

| Metric | Run 6, held-out, English |
|---|---|
| Model claims passing verification | 25 of 29 (86.2%) |
| Serious facts covered by a verified model claim | 80.5% of 82 |
| Covered with standard notices | 100% (by construction) |
| Verifier catch rate on corrupted claims | 100% |
| Readability of verified claims (25) | median grade 7.4; 60.0% at or below grade 8 |
| Rejection reasons | stay-indoors advice at "extreme caution" 2; wrong level 1; missing evidence 1 |

Reading: the held-out pass rate (86.2%) is close to the tuned-set English run (84.1%), so the tuned-set figure does not look inflated by tuning. This is one run of 29 claims: the uncertainty is large. Readability misses the grade 8 target for 40% of claims. The syllable count is a heuristic, and the text includes terms such as "US AQI" and "UV index" that the formula scores poorly.

The eval now takes a third argument: `npm run eval -- 15 en heldout` or `npm run eval -- 20 id tuned`. Each run writes its own file in `eval/out/` (gitignored), including the text of every verified claim, which M9's manual review can use.

**Final runs 7 to 10, 2026-10-07 about 15:53 to 16:01 UTC (code after commit ef18e3e plus the changes below; the commit that contains them is the one that adds this paragraph). 0 failed locations in all four.**

Changes since run 6: one readability change to the prompt (short sentences, one per day; plain short words), Indonesian day words in the fact table, and a stricter verifier (every cited day's value must be stated).

| Metric | 7: English, tuned (20) | 8: English, held-out (15) | 9: Indonesian, tuned (20) | 10: Indonesian, held-out (15) |
|---|---|---|---|---|
| Model claims passing verification | 37 of 44 (84.1%) | 24 of 29 (82.8%) | 40 of 44 (90.9%) | 28 of 29 (96.6%) |
| Serious facts covered by a verified model claim | 82.5% of 120 | 80.5% of 82 | 90.8% of 120 | 96.3% of 82 |
| Covered with standard notices | 100% | 100% | 100% | 100% |
| Verifier catch rate on corrupted claims | 100% | 100% | 100% | 100% |
| Reading grade (English only): median; share at or below grade 8 | 3.4; 97.3% | 3.7; 100% | not computed | not computed |
| Quiet locations | 1 | 2 | 1 | 2 |

Rejection reasons across the four runs (17 rejections): stay-indoors advice at too low a level 8; stated level not matching the rule-based level 3; a cited value not stated 2; first fact not serious for the household 2; missing evidence 1; mixed hazards 1.

Reading these: held-out and tuned figures are close in English (82.8% against 84.1%), and held-out is higher in Indonesian, so the tuned figures do not look inflated. Each run is small (29 or 44 claims) and was done once: a difference of a few points means nothing. Coverage with notices is 100% by construction. The catch rate tests only two kinds of corruption (a shifted number, a wrong level).

Runs that are **not** final and must not be quoted: two English tuned runs at 77.3% and 75.0% made while the readability prompt change was being worked out (the first had example numbers in the prompt that the model copied), and one set of four runs before the stricter verifier and the Indonesian day words (English held-out 88.5%, Indonesian tuned 93.0%, Indonesian held-out 89.7%). Before the readability change the English tuned set read at a median grade of 8.4 with 47.6% at or below grade 8.

**Runs 11 to 14, 2026-10-07 23:09 to 23:15 UTC (8 October, about 06:10 WIB), code after commit 6e73944 plus the day-binding rule. These supersede runs 7 to 10 as the published figures.**

What changed: the verifier now requires each number to match the value for the nearest day word in its sentence. Reason: a live result showed "224 today, 219 tomorrow, 216 the day after" marked verified when the data said 219, 216, 224.

| Metric | 11: English, tuned | 12: English, held-out | 13: Indonesian, tuned | 14: Indonesian, held-out |
|---|---|---|---|---|
| Model claims passing verification | 31 of 43 (72.1%) | 23 of 28 (82.1%) | 34 of 43 (79.1%) | 24 of 27 (88.9%) |
| Serious facts covered by a verified model claim | 70.3% of 118 | 78.2% of 78 | 80.5% of 118 | 87.2% of 78 |
| Covered with standard notices | 100% | 100% | 100% | 100% |
| Verifier catch rate on corrupted claims | 100% | 100% | 100% | 100% |
| Reading grade (English): median; at or below grade 8 | 3.5; 100% | 3.5; 100% | not computed | not computed |

Rejections (29): stay-indoors at too low a level 8; level mismatch 5; unknown fact id 4; number on the wrong day 4 (one per run); missing evidence 3; mixed hazards 2; number in advice 1; number not in data 1; cited value not stated 1.

Reading: the new rule accounts for only 4 of 29 rejections, so most of the drop from runs 7 to 10 is run-to-run noise (the model is sampled at temperature 0.2). The English tuned set has given between 72% and 84% over five runs; the prompt and verifier also changed between some of those runs, so this is not a clean repeat measurement. **Any single figure is good to about plus or minus ten points. Do not present small differences as findings.** Whether the four "wrong day" rejections were true errors was not checked: the eval report keeps only the reason for a rejected claim, not its text.

**Runs 15 to 18, 2026-10-07 23:22 to 23:26 UTC (8 October, about 06:25 WIB), first runs of the "AI writes only the action" design (code after commit 282f91d; the commit that adds this paragraph contains the design). These are the published figures. They measure a different thing from runs 1 to 14 and must not be compared with them.**

| Metric | 15: English, tuned | 16: English, held-out | 17: Indonesian, tuned | 18: Indonesian, held-out |
|---|---|---|---|---|
| AI actions kept by the screen | 42 of 43 (97.7%) | 26 of 27 (96.3%) | 42 of 44 (95.5%) | 26 of 27 (96.3%) |
| Serious facts covered by a kept AI action | 99.2% of 118 | 92.3% of 78 | 97.5% of 118 | 92.3% of 78 |
| Covered with standard notices | 100% | 100% | 100% | 100% |
| Reading grade of the action (English): median; at or below grade 8 | 4.8; 97.6% | 4.8; 96.2% | not computed | not computed |

Removed actions (5): stay-indoors at too low a level 3; hazard not serious for the household 1; second action for the same hazard 1. The catch-rate metric was dropped: the model writes no numbers, so there is nothing of that kind to catch. "Kept" means the action passed the screening rules and nothing more; do not call it accuracy or quality.

Add later runs here with date, commit hash, language, and what changed.

---

## 9. Interface design spec (M7)

**Aim:** look like a precise instrument and an audited report, not a chatbot and not a weather widget. The audit trail is the visual signature.

**Layout, top to bottom (single column on phones, two columns from 960 px):**

1. **Header.** Product name, one-line promise ("What the next 72 hours mean for your household. Every number checked."), language switch.
2. **Setup bar.** Place search with suggestions; household chips (multi-select); one primary button. Stays compact after the first result.
3. **72-hour strip.** A grid: three day columns, rows for heat, rain, air, UV. Each cell shows the number large in a monospaced face, the unit small, the level as text, and a background from the severity scale. Rain cell also shows probability (R5). A compound day gets a linked marker across its heat and air cells (R6).
4. **Climate context line.** "Thursday: 3 °C warmer than the 1991 to 2020 average for this week" with a small horizontal bar (normal tick, forecast dot). One per day (R4).
5. **Briefing.** One card per item. The action is the headline. Under it, the evidence sentence, with each number shown as a small chip. A "verified" mark on model claims; a different, plainer style and the label "standard notice" on fallback items.
6. **The audit link (signature interaction).** Hovering, focusing or tapping a card highlights the exact cells in the strip that it cites, and the reverse: selecting a cell highlights the cards that rely on it.
7. **Audit panel.** Collapsed by default, one line always visible: "7 of 8 model claims passed verification." Expanded: rejected claims with reasons, model name, attempts, data sources with timestamps, the statement that data are model forecasts and not sensor readings (S6), and a link to the official meteorological service (R8).
8. **Footer.** Not medical advice; companion to official warnings; data attribution; link to repo and method.

**Visual language:**
- Typography: a serif display face for the product name and action headlines, a monospaced face for every number, a neutral sans for body text. Load from Google Fonts with system fallbacks; the page must still read well if fonts fail.
- Colour: off-white paper and near-black ink in light mode; deep slate in dark mode. One sequential severity scale of five to six steps, ordered by lightness so it still reads in greyscale. One accent colour reserved for "verified". No decorative gradients.
- Shape: thin rules, small radii, generous spacing, a visible grid. Numbers align on a baseline.
- Motion: only the audit-link highlight and a short reveal of results; disabled under `prefers-reduced-motion`.
- States: empty (short explanation and three example cities), loading (skeleton of the strip, then cards), partial (air quality missing, clearly marked), failure (strip still shown, plain message, retry button).

**Non-negotiable checks (acceptance for M7):**
- [x] Works at 375 px width with no horizontal scroll, and at 1440 px. (Checked by `scripts/ui-check.cjs`, 2026-10-07.)
- [x] Light and dark mode both correct. (Screenshots viewed.)
- [ ] Text contrast at least 4.5:1; severity never shown by colour alone (the level word is always present). **Level word: done. Contrast ratios were not measured with a tool; do that before submission.**
- [ ] Whole flow usable by keyboard; visible focus; search suggestions reachable; `lang` attribute follows the chosen language. **`lang` checked. Cells and items are focusable and focus triggers the audit link. A full keyboard-only pass by a person was not done.**
- [x] Model text is inserted as text, never as HTML. (`textContent` only; no `innerHTML` in the file.)
- [x] No console errors; first result visible within about 10 s on a normal connection. (No console errors in three scenarios. Timing was not measured separately; a cold request took about 2 to 10 s in earlier checks.)
- [x] Opened and checked in a browser, with screenshots saved to `docs/screenshots/`. (Headless Chromium only. Not yet checked in Safari or Firefox, or on a real phone.)

Still no framework and no build step. One HTML file with inline CSS and JS is acceptable; split into `public/app.css` and `public/app.js` if the file passes about 600 lines.

---

## 10. Demo video script (M10)

Target 3:00. Screen recording with voice. Show the real deployed site.

| Time | Content |
|---|---|
| 0:00 to 0:25 | The problem: forecasts give numbers, not actions; warnings are generic; AI advice can state wrong numbers and is hard to read. Cite two findings on screen (Ou 2025; MacKay 2026). |
| 0:25 to 1:25 | Live demo: choose a city, choose a household, generate. Read one action. Show the climate context line. Switch language. |
| 1:25 to 2:10 | The audit trail: hover a card to light up its numbers; open the audit panel; show a rejected claim and the reason; show a standard notice. Say plainly: levels come from rules, the model only writes. |
| 2:10 to 2:40 | Evidence: the eval table (pass rate, coverage, catch rate, readability, manual review). State the limits in one sentence. |
| 2:40 to 3:00 | What is built on (Open-Meteo, Mistral), what is next, repo link. |

---

## 11. Provenance and disclosure text (use in README and Devpost)

- The repository was created on **2026-10-07**, inside the 3 to 10 October event window, separate from an earlier pre-event practice repository (`ForgeHacks`, last commit 2026-09-29).
- **No source code was copied** from the practice repository. That repository holds an unrelated security-advisory experiment and a generic evaluation harness; neither is part of this submission. Ideas carried over as principles only: treat model output as untrusted, tie claims to source data, show failures, measure with an eval.
- All code in this repository was written during the event with AI coding assistance (Claude Code). Say so in the submission.
- Data: Open-Meteo (CC BY 4.0). Model: Mistral API. Literature search: Elsevier Scopus API and OpenAlex.
- If anything from the practice repository is reused later, record it here and disclose it.

---

## 12. Operating rules for whoever continues

**Secrets**
- `MISTRAL_API_KEY` is in `.env` (gitignored). Never print, log, commit, or send it to the browser.
- Any API key the owner pastes into a chat is not to be written to a file. Keys shared that way should be treated as exposed and rotated by the owner. The literature search is complete and needs no key unless the open checks in the literature review are worked on.

**Engineering**
- Smallest correct change. No new dependencies, frameworks or build steps without a written reason in section 13.
- Model output is untrusted input: validate it, define the failure behaviour, bound the retries.
- Never claim a check passed unless it was run. If a command cannot run, record the exact blocker.
- A simple thing that works in the demo beats a clever thing that might not.
- Every published number needs a date, a commit, and the run it came from.
- Commit after each task. End commit messages with the attribution line the tool requires.

**Honesty rules for public text**
- State what is verified (numbers and levels in the evidence line) and what is not (the wording of the action, weekday names).
- State that data are model forecasts, that the tool is not medical advice and not an official warning.
- Report every eval run. Do not round up. Do not hide the manual-review failures.

**Working with the owner**
- The owner writes casual Indonesian mixed with English and wants short, direct replies and action without repeated questions. Ask only when truly blocked.
- Reply in the owner's language. Write files, commits and submission text in clear standard English.
- Windows 11. In bash, long heredocs can fail on apostrophes: write files with the file tool. Do not call `python3` from bash on this machine (it hung once).

**When something breaks**
- Mistral 429 or 403: check the model name and the `x-ratelimit-*` headers; use `open-mistral-nemo` or `ministral-8b-latest`. Do not pay for anything.
- Open-Meteo timeout: one retry exists; air quality and the archive are optional layers by design.
- Zero verified claims: the strip and standard notices still show. That is the intended behaviour.

---

## 13. Decision log and session log

**Decisions**

| Date | Decision | Reason |
|---|---|---|
| 2026-10-07 | Track AI + Climate | Team request |
| 2026-10-07 | Household multi-hazard briefing with per-claim verification | Open reliable data; AI adds value in tailoring and language; measurable; fits three days |
| 2026-10-07 | Levels from rules, never from the model | Safety-relevant values must be deterministic |
| 2026-10-07 | Plain Node, no dependencies, no build | Fewest failure points |
| 2026-10-07 | `open-mistral-nemo` | Only reliable model on the free tier |
| 2026-10-07 | Separate repo, no code reuse from the practice repo | Event provenance rules |
| 2026-10-07 | Pitch as "auditable", never "first" | Literature review found close prior art (ClimApp, HEAT-SHIELD, Ou 2025, HIAPLLM) |
| 2026-10-07 | Add climate context against the 1991 to 2020 normal | Makes it a climate tool, not a weather app; MacKay 2026 found AI heat messages rarely frame heat within climate change |
| 2026-10-07 | Replace apparent temperature with a computed NWS heat index | Bands are defined for heat index; humidity-aware index recommended by Chandra 2025 |
| 2026-10-07 | Fallback standard notices instead of a second model call | Guarantees coverage without more model risk or latency |
| 2026-10-07 | Advice only for hazards that are serious for the household; quiet mode otherwise | A live check showed over-warning at low levels (stay indoors at AQI 58). Saying nothing is more honest than a weak warning. |
| 2026-10-07 | Household profile changes thresholds by rule, not only the wording | Makes the personalisation deterministic and testable; it is project judgement, disclosed as such. |
| 2026-10-08 | The AI writes only the action; numbers, levels and evidence come from the data | A live result showed a "verified" sentence with real numbers on the wrong days. Checking model-written numbers can fail; not letting the model write them cannot. |
| 2026-10-07 | Name: Prakira; public repo `rofiperlungoding/prakira` | Owner asked for something catchy; from Indonesian *prakiraan* (forecast). No trademark or name-collision check was done. |
| 2026-10-07 | Host on the owner's own server at `prakira.rofihosted.space` | Owner's choice; free; Node already there. Single point of failure during judging, so a backup clip and a fallback host are planned. |

**Session log**

- **2026-10-07 (session 1).** Repo scaffolded; MVP built; 12 tests pass; two eval runs; first literature scan (27 references, titles only).
- **2026-10-07 (session 2).** Planning only, no product code changed. Second literature pass: 12 more queries, 15 abstracts read, review rewritten as v0.2 with requirements R1 to R8. Science audit found band errors S1 to S5. Verified the Open-Meteo archive and climate APIs respond. Devpost rules could not be re-read (HTTP 429; browser extension offline). Plan rewritten as version 2. Next action at that point: M0, then M1.
- **2026-10-07 (session 3).** Name and hosting decided (Prakira; owner's server). M0 done: public repo created and pushed. M1 done: NWS heat index implemented and tested, bands corrected, sources recorded; 17 tests pass; live check on Jakarta, London, Phoenix. Added `AGENTS.md` as the entry point for any AI assistant. Owner gave standing approval to push after each finished task. Not deployed yet (M8). Next action at that point: M2.
- **2026-10-07 (session 3, continued).** M2 done: standard notices for uncovered serious hazards, in English and Indonesian, checked by the same verifier; 21 tests pass; eval run 3 recorded in section 8. `npm run eval -- 20 id` now runs the eval in Indonesian. UI shows notices in a plain style (not yet opened in a browser). Next action at that point: M3.
- **2026-10-07 (session 3, continued).** M3 done (section 7a): per-household serious thresholds, quiet mode, stricter verifier, prompt with required fact ids, grouped notices, decimal-comma handling. 25 tests pass. Eval runs 4 (English) and 5 (Indonesian) recorded in section 8. UI still not opened in a browser. Next action at that point: M5, M4.
- **2026-10-07 (session 3, continued).** UI checked in a headless browser (the owner asked for this): works in both languages and both colour schemes; gaps listed in section 4. M5 and M4 done; 29 tests pass. `scripts/ui-check.cjs` added for repeatable UI checks (on the owner's PC Playwright is at `C:/Users/Rofi/Documents/Codes/CatCoder/CatCoder/node_modules/playwright`). No eval was re-run after M4 and M5: they do not touch the model path. Next action at that point: M7.
- **2026-10-07 (session 3, continued).** M7 done: interface rebuilt to the section 9 spec; fonts Fraunces, IBM Plex Mono, IBM Plex Sans from Google Fonts with system fallbacks (M8's Content-Security-Policy must allow `fonts.googleapis.com` and `fonts.gstatic.com`). Colour steps per hazard are set in `TONES` in the page script so that one colour means a similar degree of concern across hazards. `scripts/ui-check.cjs` updated for the new page and now also tests the audit link. Next action at that point: M8.
- **2026-10-07 (session 3, continued).** M8 done with the owner's approval for the three server steps. Server hardened first (`/healthz`, localhost bind, rate limits of 10 briefings and 120 searches per 10 minutes per address, 10-minute response cache, security headers, Content-Security-Policy). 31 tests pass. Deployed to the owner's server and verified as listed under M8. Cloudflare injects an analytics script that the Content-Security-Policy blocks: one harmless console error on the public page. **Superseded by the next entry. Earlier next action: M6 (readability metric in the eval), then M9 (final eval with held-out locations, manual review, README, diagram), M10 (video), M11 (Devpost). The owner should open the public URL on a phone and report anything odd.**
- **2026-10-07 (session 4).** The owner rejected the M7 look ("too plain") and gave a reference landing page (light pastel-green hero, phone mockup, sticker, feature cards, numbered process, coloured stat cards, accordion questions). `public/index.html` was rebuilt as a full landing page in that style: nav, hero with a CSS phone mockup and sticker, "Advice with receipts" with accordion, four hazard cards, the tool in a panel, "How a briefing is made" with a pipeline diagram, "Measured, not promised" with three stat cards and a caveat line, FAQ, footer. Light theme only (dark mode removed). Font: Plus Jakarta Sans and IBM Plex Mono. All visuals are CSS and inline SVG; no photos were downloaded. The app logic (strip, audit link, audit panel) is unchanged. Headless check: no overflow at 375, 1280, 1440 px; no console errors; audit link works. Section 9 of this plan describes the earlier design and is now out of date for the visual language; the layout of the result area still applies. **The evidence cards show eval figures from runs 4 and 5 (84 to 95%, 100%, 100%) hard-coded in the page: update them when M9 produces final numbers.** Redeployed to the server. **Next action: owner feedback on the new look, then M6, M9.**
- **2026-10-07 (session 4, continued).** Owner feedback on the landing page: the monospace labels and small uppercase text were hard to read. Two passes followed. (1) Readability: monospace removed, uppercase labels removed, text sizes and secondary-text contrast raised. (2) Fonts, at the owner's choice of "fonts only": **Outfit** for headings and numbers, **DM Sans** for text (both Google Fonts, SIL Open Font Licence). A logo was added at the owner's request: a lowercase p whose bowl holds a check mark, on a lime tile. Files: `docs/brand/prakira-mark.svg`, `docs/brand/prakira-logo.svg` (wordmark is live text in Outfit), `docs/brand/logo-preview.png`. The mark is inlined in the nav and used as the favicon through a data URI. No trademark or similarity search was done for the name or the mark. Headless check passes; redeployed. **Next action: M6, then M9. Use the logo in the README, the video and the Devpost page.**
- **2026-10-07 (session 4, continued).** The owner rejected the first logo (a p with a check mark) and chose concept E out of five: **a sun rising over three lines, one line for each of the three days ahead**, on a warm cream tile (`#fff3d6`, sun `#f4a04c`, ink `#101a13`). `docs/brand/prakira-mark.svg` and `prakira-logo.svg` were replaced; the nav and the favicon use the new mark. Redeployed. **Next action: M6, then M9.**
- **2026-10-07 (session 4, continued).** M6 done. Held-out location set added to the eval (15 places) and run once in English (section 8, run 6). 34 tests pass. Fixed a bug the owner spotted in the hero phone mockup: a hero style rule (`.hero small`) coloured the mockup's level labels grey, so "very unhealthy" was dark text on red; the rule is now scoped and the labels are white. Redeployed. **Next action: M9 (three tuned-set runs and one held-out run per language, manual review of 12 briefings from the saved eval files, README with logo and diagram, update the evidence cards in the page with final numbers), then M10 (video), M11 (Devpost).**
- **2026-10-07 (session 4, continued).** The owner found the grey loading skeleton dull and asked for animation or tidy doodles. Added, all in `public/index.html`: (1) a loading scene in a `<template id="loaderT">`: the logo's sun rises over three lines while clouds drift, with four step chips that light up in turn. **The chips cycle on a timer; they do not track real progress.** (2) Results appear one after another (`stagger()`; animation fill mode is "backwards" so the audit-link dimming still works). (3) Doodles: a squiggle under the hero headline, a handwritten "checked, not guessed" note with an arrow to the mockup, a sparkle, a "start here" arrow beside the tool heading (font Caveat, Google Fonts, SIL Open Font Licence), a gentle float on the sticker, and a hover lift on the hazard icons. All motion is off under `prefers-reduced-motion`. Headless check passes with no console errors. Redeployed. **Next action: M9.**
- **2026-10-07 (session 4, continued).** Two owner requests. (1) **Match cut from loading to results**, with the View Transitions API (`document.startViewTransition`): the loader's sun shares the name `prk-sun` with a small sun (`.sunmark`, a clone of the nav logo) beside the "Next 72 hours" heading; the step chips share `prk-grid` with the strip; the note shares `prk-body` with the briefing list. Browsers without the API and reduced-motion users get the plain swap. Verified: the API is present in headless Chromium and no errors occur; **the motion itself was not seen, only still frames, so the owner must judge it by eye.** (2) **About page** at `/about` (`public/about.html`, English only, served by `server.mjs`): why the tool exists, six research findings each with what the tool does because of it, what it is not, who made it, references with DOI links. Every finding on it comes from an abstract that was read (see the literature review); "LeClerc and Joslyn" and "Lindell and Perry" author pairs are from general knowledge, not from the retrieved records. It names the builder as "Rofi, a student in Indonesia": the owner should confirm or change that wording, and can add a personal paragraph on what prompted the idea (none was invented). The deploy script in the server repo now copies the whole `public/` folder. Redeployed. **Next action: M9.**
- **2026-10-07 (session 4, continued).** M9 done. Final eval runs 7 to 10 recorded in section 8. A read-through of 22 claims found a verifier gap (a claim could cite three days and state two values) and a recurring Indonesian wording error ("besok hari" for the day after tomorrow); both fixed; 35 tests pass. `docs/manual-review.md`, `docs/architecture.svg` and a rewritten README added. The evidence cards on the page now show the final figures (83 to 97%, held-out). Redeployed. **Open: a human review of the advice; two questionable actions described in `docs/manual-review.md` are a design limit. Next action: M10 (video script and recording, needs the owner), M11 (Devpost text in `docs/devpost-draft.md`, then the owner submits).**
- **2026-10-08 (session 4, continued).** M9 commit pushed and deployed; a live check through the public URL returned 3 of 3 verified claims in Indonesian with "Lusa" used correctly. `docs/devpost-draft.md` written (M11, first half): every Devpost section, with the held-out figures and the disclosure. **Left for the owner: rewrite "Inspiration" in their own words if they want a personal reason there, record the video (M10, script in section 10; the script predates the landing page, so show the hero, the loading scene, the audit link, the audit panel and the About page), add the video link, and submit.** Next action for an assistant: help with the video script on request; re-check all links after submission.
- **2026-10-08 (session 5).** The owner stopped the "try to fool it" and baseline ideas (the half-written `eval/baseline.mjs` was deleted) and asked for useful basics plus a transparent, visible process. Approved plan: `C:\Users\Rofi\.claude\plans\eh-jangan-deh-yg-jolly-truffle.md`. Built:
  - **Visible process.** `lib/trace.mjs`; `makeBrief({ onStep })`; `/api/brief` answers as a server-sent-event stream when asked (`accept: text/event-stream`), one event per real step, and every response carries `trace`. The page shows the six steps live and keeps them as a process line whose segments open the matching part of the audit trail. Verified locally and through the public URL: events arrive one by one, so the Cloudflare tunnel does not buffer them. The old timer-driven chips are gone.
  - **Peak time** for heat and UV (`peak` on those facts; not for air, whose index is a rolling average).
  - **Share and copy**, and `generatedAt` ("forecast read at").
  - **Use my location** (rounded to 2 decimals) and **remembered choices** in `localStorage` only; no request is made on page load. Browser language picks Indonesian on a first visit.
  - **Long-range outlook**, `lib/outlook.mjs` and `GET /api/outlook`: days a year at or above 35 °C (30 °C fallback, or "rare") in 2011 to 2020 against 2041 to 2050, median and range of three CMIP6 HighResMIP models. **Never yet seen with data on the page:** the provider's daily limit was exhausted when it was built. Unit-tested; the API format was confirmed with a live call earlier the same day.
  - **Quota incident.** The evaluation fetched a 30-year archive per location per run and used up Open-Meteo's free daily limit, which removed the climate row from the live site until the reset at 00:00 UTC. Fixes: disk cache for normals and outlooks (`lib/store.mjs`, folder `data/`, gitignored), the eval passes `climate: false`, the outlook uses two decades not six, and an unavailable optional layer is reported in plain words. **Do not run evals or load tests that touch the archive or climate APIs.**
  - **Verifier bug found on a live result and fixed:** numbers on the wrong days were accepted. See runs 11 to 14 in section 8. The fix is a nearest-day-word heuristic. **Open design question for the owner:** have the evidence sentence built from data and let the model write only the action, which removes this class of error entirely but changes the product's story ("the AI never writes a number").
  - 41 tests pass. Headless checks: geolocation granted and denied, reload restores choices with zero briefing requests, forget clears storage, process segments open the audit, no console errors.
  - **Next action:** after the quota reset, check the outlook card and the climate row on the live site with real data; then the owner records the video and submits.
- **2026-10-08 (session 5, continued).** The owner approved the design change proposed after the wrong-day bug: **the model writes only `{hazard, advice}`; `fact_ids`, `level` and the evidence sentence are built from the data** (`verifyAll` in `lib/verify.mjs`, `evidenceFor` in `lib/notice.mjs`, prompt in `lib/llm.mjs`). The day-word heuristic added earlier the same day was deleted. Anything else the model writes is ignored (unit-tested). 33 tests pass. Sections 5 and 7a of this plan describe the older verifier rules and are superseded by this entry and by the README. Page, About, README, Devpost draft, review notes and the architecture diagram now tell the new story ("numbers from data, not from AI"); the third evidence card reads "Numbers written by the AI: 0". Runs 15 to 18 recorded in section 8. The owner also showed three research ideas built on ECMWF's AIFS model (energy digital twin, generative downscaling, physics guardrail); assessed as not buildable by the deadline and their cited claims unverified; one small piece was kept as a planned step (two forecast models side by side). Current plan: `C:\Users\Rofi\.claude\plans\eh-jangan-deh-yg-jolly-truffle.md`. **Next actions, in order: "Describe your home" (AI fills the form from one sentence; step 4b of that plan); after the Open-Meteo quota reset, check the climate row and the never-yet-seen outlook card on the live site (step 4); then two models side by side (step 5) if time allows.**
- **2026-10-08 (session 5, continued).** The design change is committed, pushed and deployed (`c14eed3`); live check in both languages returned 3 of 3 actions with evidence matching the data, and the event stream still arrives step by step. Added a 10-minute pause after a failed archive request (`lib/climate.mjs`), because with the provider's quota exhausted each briefing waited for a timeout. **"Describe your home" built** (`lib/intake.mjs`, `POST /api/intake`, field and button in the page, both languages): six live descriptions in English and Indonesian were read correctly, an injection attempt produced an empty result, and the headless check confirmed chips tick, a place search starts, no briefing is requested by itself, no overflow, no console errors. `chat()` in `lib/llm.mjs` is now the single function that calls the model. 36 tests pass. **Still to do: step 4 (climate row and outlook card with real data after the quota reset) and step 5 (two models) of the plan file.**
- **2026-10-08 (session 5, continued).** "Describe your home" deployed (`ab718b5`); live call in Indonesian read correctly. **Two forecast models side by side built** (`lib/models.mjs`, traced step `models`, a "Models" row in the strip, both languages): IFS (`ecmwf_ifs025`) against AIFS (`ecmwf_aifs025_single`; the identifier `ecmwf_aifs025` returns only nulls), temperature only, compared at 00, 06, 12, 18 UTC and assigned to local dates with the forecast's UTC offset (half-hour zones tested). Live check: Jakarta and London within about 1.5 °C, Phoenix up to 3.6 °C, Bandung about 5 °C (mountain terrain). It runs only with the climate layer, so the eval does not call it. 40 tests pass. Seen in the same check: an action "stay near water if possible" for polluted air passed the screen, which is the kind of poor action the screen cannot catch.
- **2026-10-08 (session 6).** Two requests from the owner. **(1) Odd actions must not pass.** The screen now has a closed vocabulary (`lib/vocab.mjs`, `topicProblem()` in `lib/verify.mjs`): an action may use only words from a common list plus the list of its own hazard, and must use at least one hazard word. Lists were written from tuned-set output only. The prompt gained one line naming fitting steps per hazard. Also rejected: an action containing an underscore (a profile key copied from the prompt). **Runs 19 to 22** (00:02 to 00:06 UTC, 0 failed locations): kept EN tuned 33/43 (76.7%), EN held-out 23/27 (85.2%), ID tuned 39/43 (90.7%), ID held-out 22/27 (81.5%); AI coverage 76.3 / 84.2 / 89.8 / 84.2%; with notices 100%; reading grade median 4.8 (tuned), 4.4 (held-out). Removed: 22 for a word outside the list, 1 stay-indoors. Every kept action in the four runs was read by the AI assistant: none odd. Not comparable with runs 15 to 18 (different screen). Do not add words to the lists in response to held-out rejections. **(2) Climate row and outlook card must always show real data.** New second source `lib/power.mjs`: NASA POWER daily T2M_MAX 1991 to 2020 (MERRA-2, about 50 km, free, no key, about 1.5 s per place). `getContext` falls back to it and marks each item `source: 'MERRA-2'`; `getOutlook` falls back to a look back (hot days a year 1991 to 2000 against 2011 to 2020, `source: 'observed'`), kept on disk only so the projection replaces it when it can be fetched. Checked live: Jakarta normal 31 °C and 92 to 130 days at 30 °C; London 0 to 2 days at 30 °C; Phoenix 128 to 136 days at 35 °C. The page names the source in both languages. Deployed as `fdd7c0f`. **Plan step 4 done after the quota reset (00:10 UTC):** the projection card was seen with real CMIP6 data for the first time, in a headless browser at 375 and 1280 px and on the live endpoint (Jakarta 1 to 4 days a year at 35 °C, London 1 to 5 at 30 °C, Phoenix 151 to 164 at 35 °C, Bandung 33 to 58 at 30 °C); no overflow, no console errors. On the server the archive still answered 429 while the climate API worked, so the live climate row came from NASA POWER, as designed; `/root/apps/prakira/data/` now holds the cached files. ERA5 and MERRA-2 normals for Jakarta, London and Phoenix differ by at most 1 °C. Note for the next agent: the global git email on the laptop is one GitHub rejects on push; commit with `git -c user.email=<the email of earlier commits>`.

**Open questions for the owner**

1. Please open the Devpost rules page by hand and confirm the five items in section 1.
2. Please open https://prakira.rofihosted.space on a phone (mobile data) and say whether it works and reads well.
3. About page: confirm the line "built by Rofi, a student in Indonesia", and send two or three sentences in your own words on what made you want to build this, if you want a personal paragraph there.
