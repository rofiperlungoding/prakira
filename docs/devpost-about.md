**Track: AI + Climate** · Live: https://prakira.rofihosted.space · Code: https://github.com/rofiperlungoding/prakira

## The problem

Open forecast data is free and very good. It can tell you the heat index will reach 37 °C and the air quality index 204. It does not tell you what that means for a grandmother, a toddler, or someone who works on a roof all day.

Research says this gap is real. Public warning systems send the same message to everyone, while people ask "how does this affect me right now?" and "what can I do?" (Ou et al., 2025). Weather-warning experts name tailored and multilingual warnings as the promising use of AI, and name accountability as the risk (Kox et al., 2025). The World Meteorological Organization's guidelines on impact-based forecasting (WMO-No. 1150) ask services to say what the weather will do, not only what it will be. And when researchers tested ChatGPT-4o on heat-health messages, most were accurate, but none met a grade 8 reading level and few placed heat in the context of climate change (MacKay et al., 2026).

A language model can write personal advice in seconds. It can also state a number that was never in the forecast, in the same confident tone. For a safety tool that is the wrong trade. So the question behind Prakira was narrow: **can an AI write the advice without ever being trusted with a number?**

## Who it is for

Households in places with strong heat, heavy rain, polluted air or strong sun, where someone at home is more exposed than the average person. The form has seven options, and each one changes which hazard levels count as serious: an older adult, a young child, an outdoor worker, asthma or another lung condition, pregnancy, a flood-prone home, and no air conditioning.

The person using it is a family member, not a forecaster. There is no account and nothing to set up, and the actions are written in plain words. It was built first for Indonesia (the whole interface is in Bahasa Indonesia as well as English) and works for any place the forecast data covers.

## What it does

You pick a place and tick who lives there. Prakira returns:

- **A short list of numbered points.** One action per serious hazard, written for that household. Under each action is the sentence with the numbers it relies on, built by code from the forecast. A tag says whether the action was written by AI or is a standard notice.
- **"Show all the data"** opens the rest: a 72-hour grid of heat index, rain, air quality and UV, each with a level set by a fixed rule; a climate row comparing each day with the 1991 to 2020 average for the same week at that place; a row showing whether two forecast models agree; and a long-range card (hot days a year in 2011 to 2020 against 2041 to 2050, from three climate models).
- **An audit trail.** Select a point and the numbers it relies on light up in the grid. A panel lists each step, the source of each rule, and every AI action that was removed, with the reason.
- **A visible process.** While you wait, the page shows each real step as the server performs it (read the forecast, set levels by rule, AI writes, screen every action), with its duration.
- **Describe your home.** Write one sentence ("We live in Depok, my dad is 68 and has asthma, no AC") and the AI ticks the boxes for you. It can only tick the existing options and suggest a place to search for; you still press the button.
- **Everyday basics.** The hour when heat and UV peak, "use my location", choices remembered in your browser only, share to WhatsApp or copy as text.

If nothing is serious for your household, it says so and gives no advice. If the AI skips a serious hazard, a fixed notice fills the gap.

## How we built it

Five layers. Only one of them is a language model, and its output is treated as untrusted.

1. **Data.** Open-Meteo forecast (ECMWF IFS and AIFS), the CAMS air-quality forecast, and an ERA5-based climate archive for the 1991 to 2020 average, with NASA POWER (MERRA-2) as the second source when the free daily limit is reached. No API key.
2. **Rules.** Code computes the NWS heat index (Rothfusz equation) from temperature and humidity, assigns every hazard level (US National Weather Service categories for heat, US EPA categories for air quality, WHO tiers for UV, daily classes for rain), and decides which levels are serious for the chosen household.
3. **Model.** Mistral `open-mistral-nemo` (free tier) writes one short action per serious hazard, and nothing else: `{"hazard", "advice"}`. It is told not to write numbers. If nothing is serious, the model is not called.
4. **Screen and evidence.** An action is kept only if it is for a hazard that is serious for the household, contains no digits, uses only words from a reviewed list for that hazard, and does not say "stay indoors" at a level too low to justify it. Code then attaches the level and builds the sentence with the numbers from the forecast values. Anything else the model writes is ignored.
5. **Notices.** Fixed text for any serious hazard left uncovered, so nothing serious is silently missing.

**Technical components**

- **Server:** Node.js 20, built-in modules only. No dependencies and no build step.
- **Page:** one HTML file with plain JavaScript and CSS. Model text is inserted as text, never as HTML.
- **Forecast data:** Open-Meteo forecast API (ECMWF IFS and AIFS) and the Copernicus Atmosphere Monitoring Service (CAMS) air-quality forecast.
- **Climate data:** Open-Meteo archive (ERA5-based) and CMIP6 climate models, with NASA POWER (MERRA-2) as the second source.
- **Language model:** Mistral API, `open-mistral-nemo`.
- **Live process display:** server-sent events; each step is reported with its measured duration.
- **Protection:** 10 briefings per 10 minutes per visitor, a 10-minute response cache, and a disk cache for the 30-year normals.
- **Tests:** 43 unit tests that run offline, and a live evaluation script over tuned and held-out cities.
- **Hosting:** a tablet at home behind a Cloudflare Tunnel.

## Results

Live evaluation on 8 October 2026, on 15 held-out cities that were never used while adjusting the system:

- **AI actions kept by the screen:** 23 of 27 (85.2%) in English, 22 of 27 (81.5%) in Indonesian.
- **Serious hazards covered by the AI alone:** 84.2% in both languages.
- **Serious hazards covered once notices are added:** 100% in both.
- **Numbers written by the AI and shown to the user:** 0.
- **Reading grade of the English actions:** median 4.4; 95.7% at grade 8 or below. Not computed for Indonesian.

"Kept" means the action passed the screening rules; it is not a rating of the advice. The screen is strict on purpose: an action may only use words from a reviewed list for its own hazard, and anything else is replaced by a standard notice. Before that rule the screen kept 96%, and reading those actions turned up "stay near water" for polluted air and "use fans to pull clean air in". These are small samples and one run each. Coverage with notices and the zero are true by design. The full record, including the earlier design and runs made with bugs since fixed, is in the repository.

## Real-world impact

- **It answers the question people ask.** A forecast gives a number. Prakira gives one action per serious hazard for the people in that home, in their language, with the number beside it.
- **It removes one failure, by design.** A wrong number in a safety message can do harm. Here the model cannot put a number or a level on the page: both come from the forecast data and from fixed rules.
- **It shows its work.** Every action links to the numbers behind it, and removed AI actions are listed with the reason. A user, a teacher or an official can check a briefing without trusting the model.
- **It is cheap to run and to copy.** Free forecast data with no key, a free-tier model, no dependencies, and a home tablet as the server. No account is needed, and the server does not store the place or the household. A meteorological service or a city could apply the same pattern to its own warnings: rules set the levels, code writes the numbers, the model writes only the words, and removals are shown.
- **What has not been measured.** There has been no user study, and no health professional has reviewed the advice. Prakira does not replace official warnings; it sits beside them and links to the national meteorological service.

## Challenges we ran into

- **Our own first version got the science wrong.** It applied heat-index categories to a different temperature measure and used the wrong cut points. Re-checking against the NWS source caught it, and the unit tests now reproduce the two examples NWS publishes.
- **Over-warning.** An early version told a London household to stay indoors at an air quality index of 58. We made the system advise only on hazards that are serious for the household, and reject "stay indoors" advice at low levels.
- **The verifier had gaps we only found by reading its output.** Indonesian decimal commas ("37,6") were read as two numbers. A claim could cite three days and state only two values. Worst, a sentence could carry the right numbers on the wrong days ("224 today" when 224 was the day after) and still be marked verified; we saw it on a live result, not in our evaluation. That was the turning point: we stopped trying to check the model's numbers and took the model out of the numbers altogether. It now writes only the action.
- **Readability traded against accuracy.** One prompt change took the reading grade from 8.4 to about 3.5, and the model's raw pass rate moved around while we worked on it.
- **Free-tier limits.** The larger models were not available on our key, so the system had to work with a small one.

## Accomplishments that we're proud of

- The model never writes a number or a level. Every figure on the page comes from the forecast data, and the interface shows which of the model's actions were removed and why.
- The evaluation includes cities the system was never tuned on, and reports the weak figures along with the strong ones.
- It works in Bahasa Indonesia, with the screen handling local number formatting.

## What we learned

Checking an AI's output is weaker than not needing to. Our verifier passed a wrong sentence with a "verified" badge, and a stricter verifier would only have been a better guess. Removing the model from the numbers was simpler and stronger. What remains unchecked is the judgement in an action: in a read-through of 22 actions on the earlier design, two were questionable even though every number was right (for example, suggesting morning activity on a day with a heat index of 47 °C). Saying that plainly is more useful than a clean-looking score.

## What it is not

- Not the only personalised weather warning: ClimApp and HEAT-SHIELD do this for heat without a language model, and research prototypes use language models for single hazards. We did not find this combination in a search of one research database, which is not proof that nobody has built it.
- Not an official warning and not medical advice. No person or clinician has reviewed the advice yet; the read-through was done by an AI assistant.
- Not a sensor: the data are model forecasts for a grid cell several kilometres wide.
- The rain classes (cut points at 20, 50, 100 and 150 mm a day) are the daily classes commonly quoted from Indonesia's weather agency, BMKG. We have not checked them against a primary source.

## What's next

- A review of the advice by people, including a health professional.
- Resolve conflicts between hazards (bad air against heat in a home without air conditioning).
- More languages, each with its own screening tests.

## Disclosure

- **Built during the event.** The repository was created on 7 October 2026 and all its code was written inside the event window.
- **Earlier practice work.** Before the event the author kept a separate practice repository with an unrelated security-advisory experiment and a generic evaluation harness. No code from it is in this project.
- **AI assistance.** The project was built with AI coding assistants (mainly Claude Code), which wrote most of the code and text under the author's direction and did the read-through of the advice. The demo video was edited by the assistant from the author's own narration and a scripted recording of the live site.
