<p><img src="docs/brand/prakira-horizontal.svg" alt="Prakira" width="300"></p>

**Climate briefings with receipts.** Prakira turns the next 72 hours of heat, rain, air quality and UV into a few actions for one household, in English or Bahasa Indonesia, and shows the numbers behind every action.

ForgeHacks 2026 · track: AI + Climate

- **Live demo:** https://prakira.rofihosted.space (self-hosted on a small home server; 10 briefings per 10 minutes per visitor)
- **Why it exists and the research behind it:** https://prakira.rofihosted.space/about
- **Screenshots:** [`docs/screenshots/`](docs/screenshots/)

![The landing page](docs/screenshots/hero.png)

## The idea in one paragraph

Open forecast data can tell you that the heat index will reach 37 °C and the air quality index 204. It does not tell you what that means for an older adult, a toddler, or someone who works outdoors. A language model can write that advice, and it can also state a number that was never in the forecast. In Prakira the model never writes a number. Fixed published rules set every hazard level, code builds the sentence that states the numbers, and the model writes only the action, which is screened before you see it. You see what was kept, what was removed, and why.

## How it works

![Architecture](docs/architecture.svg)

1. **Data.** Forecast, air quality and a 30-year climate archive from Open-Meteo (no API key).
2. **Rules** (`lib/facts.mjs`, `lib/climate.mjs`). Compute the heat index, hazard levels, the difference from the 1991 to 2020 normal, and a flag for days when strong heat and polluted air coincide. The household you choose changes which levels count as serious.
3. **Model** (`lib/llm.mjs`). Mistral `open-mistral-nemo` writes one short action per serious hazard, and nothing else: `{"hazard", "advice"}`. It is told not to write numbers. If nothing is serious, the model is not called and no advice is given.
4. **Screen and evidence** (`lib/verify.mjs`, `lib/notice.mjs`). Model output is untrusted. An action is kept only if:
   - its hazard is serious for this household, and it is the first action for that hazard;
   - it contains no digits;
   - it does not say "stay indoors" at a level too low to justify it;
   - it is not empty or overlong.

   For each kept action, code attaches the facts, the rule-based level, and an evidence sentence built from the forecast values in day order ("The US AQI peaks at 219 today, 216 tomorrow and 224 the day after tomorrow."). Anything else the model writes, including numbers, levels or its own evidence, is ignored.
5. **Notices** (`lib/notice.mjs`). Any serious hazard without a kept action gets fixed-template text, so nothing serious is silently missing.

**The process is visible.** The server reports each of these steps as it happens (`lib/trace.mjs`, sent as an event stream), with measured durations and real counts. The page shows them live while you wait. The result opens as a short list of points: what to do, each with the numbers behind it. "Show all the data" opens the rest: the process as one line (each segment opens its part of the audit trail), the 72-hour grid, the climate and model rows, the long-range card and the audit trail.

**Describe your home.** Instead of filling in the form, a visitor can write one sentence ("We live in Depok, my dad is 68 and has asthma, no AC"). The model proposes the place name and household options (`lib/intake.mjs`). Its answer is reduced on the server to the seven allowed options and a plain place name, which is only used to start the normal place search. The visitor still picks the place and presses the button.

**Two forecast models, side by side.** For each day the page shows whether ECMWF's physics model (IFS) and its machine-learning model (AIFS) agree on air temperature, compared only at the 6-hourly steps AIFS natively produces (`lib/models.mjs`). A wide gap is shown as lower confidence. It does not say which model is right, the two are never blended, and the "agree / differ" cut points (1 and 3 °C) are this project's own.

**Also in the tool:** the hour when heat and UV peak (from hourly data, set by rule); "use my location"; place, household and language remembered in the browser only; share to WhatsApp or copy as text; and a long-range card comparing hot days a year in 2011 to 2020 and 2041 to 2050 across three climate models.

## Sources for the hazard levels

| Hazard | What is shown | Level rule | Source (checked 2026-10-07) |
|---|---|---|---|
| Heat | Daily peak of the hourly NWS heat index, from temperature and humidity | Below 80 °F low; 80 to 89 caution; 90 to 102 extreme caution; 103 to 124 danger; 125 and above extreme danger | [NWS formula](https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml), [NWS categories](https://www.weather.gov/ama/heatindex). Unit tests reproduce the two examples NWS publishes. |
| Air | Highest hourly US AQI of the day (Open-Meteo applies the EPA averaging periods) | EPA categories, 0 to 50 good up to above 300 hazardous | [AirNow](https://www.airnow.gov/aqi/aqi-basics/), [Open-Meteo air quality docs](https://open-meteo.com/en/docs/air-quality-api) |
| UV | Daily maximum UV index, rounded | WHO action tiers: 0 to 2 low; 3 to 7 protection needed; 8 and above extra protection needed | [WHO](https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index) |
| Rain | Daily total with the day's peak rain probability | Below 1 mm little or no rain; to 20 light; to 50 moderate; to 100 heavy; to 150 very heavy; above extreme | **Not verified against a primary source.** Commonly quoted BMKG daily classes; only the 150 mm threshold was corroborated, through news reports. Not a flood forecast. |
| Climate | Forecast daily maximum minus the 1991 to 2020 average for the same week | No level; context only | Open-Meteo archive (ERA5-based), or NASA POWER (MERRA-2) when the archive is unavailable. Forecast and archive are different models, so part of the difference is model bias. |

The household adjustments (for example, an older adult lowers the heat threshold from "extreme caution" to "caution") are this project's judgement from the wording of the NWS and EPA categories. They are not an official rule.

## Evaluation

Runs 19 to 22, on 8 October 2026 (07:00 WIB) with live data, after the reviewed word lists were added to the screen. "Tuned" cities are the 20 the system was developed against; "held-out" cities are 15 that were never used while adjusting the prompt or the rules.

| Metric | English, tuned | English, held-out | Indonesian, tuned | Indonesian, held-out |
|---|---|---|---|---|
| AI actions kept by the screen | 33 of 43 (76.7%) | 23 of 27 (85.2%) | 39 of 43 (90.7%) | 22 of 27 (81.5%) |
| Serious hazards covered by a kept AI action | 76.3% | 84.2% | 89.8% | 84.2% |
| Serious hazards covered once notices are added | 100% | 100% | 100% | 100% |
| Numbers written by the AI and shown to the user | 0 | 0 | 0 | 0 |
| Reading grade of the action (Flesch-Kincaid): median; share at grade 8 or below | 4.8; 97.0% | 4.4; 95.7% | not computed | not computed |

How to read this honestly:

- **"Kept" is a narrow test.** It means the action passed the screening rules. It does not mean the action is good advice.
- **The screen is strict on purpose.** An action may only use words from a reviewed list for its own hazard (`lib/vocab.mjs`). That removes an action about the wrong hazard ("stay near water" for polluted air, seen on the live site), a wrong word ("bayam", spinach, where "bayangan", shade, was meant) and bad advice built from unlisted words ("use fans to pull clean air in" on a polluted day). It also removes some sound actions that use a word not on the list. Each removed action is replaced by a standard notice, so strictness costs wording and never coverage. The word lists were written from the tuned cities only; the held-out columns show how they carry over.
- **Small samples, one run each.** 27 to 43 actions per run. Earlier runs of this project differed by ten points between repeats.
- **Coverage with notices is 100% by construction**, and "numbers written by the AI: 0" is true by construction as well: the code never displays model-written numbers.
- **Removed actions** (23 across the four runs): a word outside the reviewed list 22; "stay indoors" at too low a level 1. A rule added after these runs (an action that contains an internal label such as "young_child") would remove one more action in the English tuned run.
- **Before the word lists** (runs 15 to 18, earlier the same day) the screen kept 95% to 98% of actions. Reading those kept actions is what showed the three problems above.
- **The reading grade** uses a syllable heuristic, covers only the action, and is valid for English only.

**Why the design changed.** Until 8 October the model also wrote the evidence sentence, and a verifier checked its numbers against the data. That verifier passed a sentence whose numbers were all real but attached to the wrong days ("224 today, 219 tomorrow" when the data said 219 today and 224 the day after), and showed it with a "verified" badge. It was found by looking at a live result, not by the evaluation. A stricter check fixed that case but relied on a heuristic, so the model was taken out of the numbers entirely. Figures from the earlier design (72% to 97% of claims passing, depending on the day and the rules in force) are in [`PLAN.md`](PLAN.md), section 8, and are not comparable with the table above.

**Review of the advice itself (done on the earlier design):** 22 claims from 12 briefings were read by the AI assistant used to build the project, not by a person or a clinician. 20 actions read as sensible, 2 as questionable, 0 as clearly unsafe. Details and the two questionable cases are in [`docs/manual-review.md`](docs/manual-review.md). A human review has not been done.

## Limits

- **The wording of each action is screened, not verified.** The screen removes digits, one kind of over-warning, and any word outside a reviewed list for the hazard. Reviewed words can still be combined into a weak or awkward action, and no person or clinician has reviewed the advice.
- **The description sentence goes to the model provider.** "Describe your home" sends what the visitor typed to Mistral. Prakira does not store or log it, and the page says so and asks visitors to leave out names. The form works without it.
- **Free data limits.** Open-Meteo counts a multi-decade request as many calls against a free daily limit. The 30-year normal and the long-range outlook are fetched once per place and cached on disk. When Open-Meteo's limit is reached, both fall back to NASA POWER (`lib/power.mjs`; MERRA-2 reanalysis, free, no key), and the page names the source. Its grid is about 50 km, coarser than ERA5, so a city centre reads cooler: the same place can show a different "normal" depending on which record answered.
- **The two-model row compares temperature only,** between two 0.25° models, and is separate from the forecast the hazard levels are computed from (Open-Meteo's default blend). In mountains or on coasts, two coarse grids can differ for reasons of terrain, not of weather.
- **The long-range outlook is model output:** the median of three climate models on a high-emissions pathway, for daily maximum air temperature, in two 10-year windows. It is context, not a prediction for your home. When the climate models cannot be reached, the card looks back instead: hot days a year in 1991 to 2000 and in 2011 to 2020 from the NASA POWER record, labelled as a look back. Two 10-year windows from one reanalysis are not a trend estimate.
- **One action per hazard.** Advice for one hazard can conflict with another (closing windows against bad air in a hot home without air conditioning). A compound-day notice flags the overlap but does not resolve it.
- **Model forecasts, not sensors.** Air quality comes from CAMS at about 11 km in Europe and 45 km elsewhere.
- **Not an official warning and not medical advice.** It is a companion to your national meteorological service.
- **Free-tier services.** The model key and the data APIs are rate-limited; the demo can be slow or briefly unavailable. If the model fails, the page still shows the hazard levels and notices.
- **Not proven new.** ClimApp and HEAT-SHIELD already give personalised forecast-based heat warnings without a language model, and research prototypes use language models for single-hazard advisories. We did not find this combination (multi-hazard, an AI that writes only the action while code supplies every number, visible removals, a public evaluation) in a search of one database. See [`docs/climate-novelty-literature.md`](docs/climate-novelty-literature.md).

## Run it

Needs Node.js 20 or newer. No dependencies to install.

```bash
git clone https://github.com/rofiperlungoding/prakira && cd prakira
echo "MISTRAL_API_KEY=your_key" > .env      # a free-tier key from console.mistral.ai works
npm start                                   # http://localhost:3000
```

```bash
npm test                       # 43 unit tests, offline
npm run eval -- 15 en heldout  # live evaluation: [count] [en|id] [tuned|heldout]
```

Environment variables: `MISTRAL_API_KEY` (required), `MISTRAL_MODEL` (default `open-mistral-nemo`), `PORT` (default 3000), `HOST` (default 127.0.0.1).

## Repository map

```text
server.mjs            HTTP server: /, /about, /healthz, /api/geocode, /api/brief (JSON or event stream), /api/intake, /api/outlook
public/index.html     Landing page and tool (vanilla JS; model text is inserted as text, never as HTML)
public/about.html     Why it exists and the research behind it
lib/facts.mjs         Data fetch, heat index, hazard levels, household thresholds
lib/climate.mjs       Difference from the 1991 to 2020 normal
lib/llm.mjs           Prompt for the actions, and the one function that calls the model
lib/intake.mjs        "Describe your home": reads one sentence into form choices
lib/verify.mjs        Screens each AI action and builds the item shown; consistency check for built items
lib/notice.mjs        Standard notices and the compound-day notice
lib/trace.mjs         Records each real step with its duration, for the live process display
lib/outlook.mjs       Long-range outlook from three climate models; look back from the record when they are unavailable
lib/power.mjs         NASA POWER daily record, the second source for the normal and the look back
lib/vocab.mjs         Reviewed word lists that an action may use, by hazard and language
lib/models.mjs        Agreement between a physics forecast model and an AI forecast model
lib/store.mjs         Disk cache for normals and outlooks
lib/readability.mjs   Reading grade, used by the evaluation
lib/*.test.mjs        Unit tests
eval/run.mjs          Live evaluation
docs/                 Literature review, review notes, architecture, logo, screenshots
PLAN.md               Working plan, decisions and the full evaluation record
AGENTS.md             Entry point for AI coding assistants
```

## Provenance and disclosure

- This repository was created on **7 October 2026**, inside the ForgeHacks event window (3 to 10 October), and all code in it was written during the event.
- Before the event the author kept a separate practice repository with an unrelated security-advisory experiment and a generic evaluation harness. **No code was copied from it.** Only principles carried over: treat model output as untrusted, tie claims to source data, show failures, measure with an evaluation.
- **Built with AI coding assistance (Claude Code).** The assistant wrote most of the code and text under the author's direction, and also did the read-through in `docs/manual-review.md`.
- Data: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0) and the Copernicus Atmosphere Monitoring Service. Model: Mistral API. Literature search: Elsevier Scopus API and OpenAlex. Fonts: Outfit, DM Sans, Caveat (SIL Open Font Licence).
