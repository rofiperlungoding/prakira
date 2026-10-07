# Climate Brief

ForgeHacks 2026, track: AI + Climate.

A 3-day heat, rain, air-quality and UV briefing for a household, in English or Bahasa Indonesia. The language model writes the advice. Fixed rules set the hazard levels. A verifier checks every claim against the forecast numbers before the user sees it.

## How it works

1. **Facts (deterministic).** `lib/facts.mjs` fetches forecast and air quality from Open-Meteo (no API key). It computes peak values per day and assigns hazard levels from published bands: NWS heat-index cut points (applied to apparent temperature), BMKG daily rainfall classes, US EPA AQI, WHO UV index.
2. **Briefing (model).** `lib/llm.mjs` sends the fact table and the household profile to Mistral (`open-mistral-nemo`, JSON mode). The model returns claims: `fact_ids`, `level`, `evidence`, `advice`.
3. **Verification (deterministic).** `lib/verify.mjs` treats the model output as untrusted. A claim is kept only if every `fact_id` exists, `level` equals the rule-based level of the first cited fact, and every number in `evidence` matches a cited fact value (rounding tolerance). Rejected claims are shown with the reason.
4. **Failure behaviour.** Model failure or zero verified claims: up to 2 retries, 3 s apart. If still empty, the page shows the hazard levels and says no verified advice was produced. If only the air-quality API fails, the briefing continues without air quality and shows a warning.

## Run

```
npm start          # needs .env with MISTRAL_API_KEY; serves http://localhost:3000
npm test           # 12 unit tests, no network
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
