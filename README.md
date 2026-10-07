# Prakira

ForgeHacks 2026, track: AI + Climate.

> **Work in progress (2026-10-07).** This README describes the first working version. The evaluation numbers below are preliminary and will be replaced: a re-check found errors in the hazard bands (see `PLAN.md`, section 6). The current plan is in `PLAN.md`; the literature review is in `docs/climate-novelty-literature.md`.

A 3-day heat, rain, air-quality and UV briefing for a household, in English or Bahasa Indonesia. The language model writes the advice. Fixed rules set the hazard levels. A verifier checks every claim against the forecast numbers before the user sees it.

## How it works

1. **Facts (deterministic).** `lib/facts.mjs` fetches forecast and air quality from Open-Meteo (no API key), computes peak values per day, and assigns hazard levels from the sources in the table below.
2. **Briefing (model).** `lib/llm.mjs` sends the fact table and the household profile to Mistral (`open-mistral-nemo`, JSON mode). The model returns claims: `fact_ids`, `level`, `evidence`, `advice`.
3. **Verification (deterministic).** `lib/verify.mjs` treats the model output as untrusted. A claim is kept only if every `fact_id` exists, `level` equals the rule-based level of the first cited fact, and every number in `evidence` matches a cited fact value (rounding tolerance). Rejected claims are shown with the reason.
4. **Failure behaviour.** Model failure or zero verified claims: up to 2 retries, 3 s apart. If still empty, the page shows the hazard levels and says no verified advice was produced. If only the air-quality API fails, the briefing continues without air quality and shows a warning.

## Sources for the hazard levels

| Hazard | What is shown | Level rule | Source (checked 2026-10-07) |
|---|---|---|---|
| Heat | Daily peak of the hourly NWS heat index, computed from air temperature and relative humidity | Below 80 °F low; 80 to 89 caution; 90 to 102 extreme caution; 103 to 124 danger; 125 and above extreme danger | Formula: https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml. Categories: https://www.weather.gov/ama/heatindex. Unit tests reproduce the two examples NWS publishes (100 °F at 55% gives 124 °F; at 15% gives 96 °F). |
| Air | Highest hourly US AQI of the day (Open-Meteo computes it with the EPA averaging periods, for example 24-hour rolling PM2.5) | EPA categories: 0 to 50 good, to 100 moderate, to 150 unhealthy for sensitive groups, to 200 unhealthy, to 300 very unhealthy, above hazardous | https://www.airnow.gov/aqi/aqi-basics/ and https://open-meteo.com/en/docs/air-quality-api |
| UV | Daily maximum UV index, rounded to a whole number | WHO action tiers: 0 to 2 low; 3 to 7 protection needed; 8 and above extra protection needed | https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index |
| Rain | Daily total rainfall, with the day's peak rain probability | Below 1 mm little or no rain; to 20 light; to 50 moderate; to 100 heavy; to 150 very heavy; above extreme | **Not verified against a primary source.** These are the commonly quoted BMKG daily classes; only the 150 mm "extreme" threshold was corroborated, through news reports quoting BMKG. Rain amount is not a flood forecast. |

Air-quality values are model forecasts (CAMS, about 11 km in Europe and 45 km elsewhere), not sensor readings. Weather data by Open-Meteo.com (CC BY 4.0).

## Run

```
npm start          # needs .env with MISTRAL_API_KEY; serves http://localhost:3000
npm test           # 17 unit tests, no network
npm run eval       # live groundedness eval over 20 locations (needs network and key)
```

No dependencies. Node 20 or newer.

## Evaluation (2 live runs, 2026-10-07, 20 locations each)

| Metric | Run 1 | Run 2 |
|---|---|---|
| Claims that passed verification (model accuracy before filtering) | 110 of 114 (96.5%), 1 location failed on an upstream timeout | 110 of 110 (100%) |
| Hazard coverage: share of moderate-or-worse facts cited first by a verified claim | 76.9% | 67.8% |
| Verifier catch rate on deliberately corrupted claims (wrong level, shifted number) | 99.5% (1 gap found, since fixed) | 100% |

Read these carefully:
- Results change between runs: live forecasts and sampling both vary. Two runs are not a distribution.
- The verifier guarantees that shown evidence numbers and levels match the data. It does **not** verify the `advice` text. Advice can contain generic guidance (for example "avoid 11 AM to 4 PM") that is not derived from the forecast.
- Weekday names in `evidence` are not verified.
- Hazard coverage is a known weakness: the model skips some significant hazards.
- The 20 locations are a convenience sample, not a validated benchmark. No human review of advice quality has been done.
- This is not medical advice and has not been clinically reviewed.

## Related work and novelty

See the ForgeHacks training-lab repo, `docs/research/climate-novelty-literature.md` (27 Scopus references). Short version: LLM preparedness chatbots and single-hazard LLM advisories already exist. The contribution here is multi-hazard output with per-claim numeric verification and a measured pass rate. Novelty is not proven; only a Scopus title scan was done.

## Provenance (ForgeHacks disclosure)

- This repository was created on 2026-10-07, inside the event window, as a separate repository from the pre-event training lab.
- No source code was copied from the pre-event lab. Design ideas carried over: treat model output as untrusted, ground claims in quoted source text, report failures visibly.
- Data: Open-Meteo APIs. Model: Mistral API. Literature search: Elsevier Scopus API.
- Built with AI coding assistance (Claude Code).
