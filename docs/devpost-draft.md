# Devpost submission draft

Status: draft for the owner to review, edit and paste. Nothing here has been submitted.
Track: **AI + Climate**.

Before pasting, the owner should: (1) rewrite "Inspiration" in their own words if they have a personal reason for the project, since the text below gives only the research reasons; (2) add the video link; (3) check the figures against the README on the day of submission.

---

## Title

Prakira

## Tagline (short description)

Climate briefings with receipts: what the next 72 hours of heat, rain, air and UV mean for your household. The AI writes the actions; every number comes straight from the forecast.

## Links

- Live demo: https://prakira.rofihosted.space
- About and research: https://prakira.rofihosted.space/about
- Source code: https://github.com/rofiperlungoding/prakira
- Demo video: _add link_

## Inspiration

Open forecast data is free and very good. It can tell you the heat index will reach 37 °C and the air quality index 204. It does not tell you what that means for a grandmother, a toddler, or someone who works on a roof all day.

Research says this gap is real. Public warning systems send the same message to everyone, while people ask "how does this affect me right now?" and "what can I do?" (Ou et al., 2025). Weather-warning experts name tailored and multilingual warnings as the promising use of AI, and name accountability as the risk (Kox et al., 2025). And when researchers tested ChatGPT-4o on heat-health messages, most were accurate, but none met a grade 8 reading level and few placed heat in the context of climate change (MacKay et al., 2026).

A language model can write personal advice in seconds. It can also state a number that was never in the forecast, in the same confident tone. For a safety tool that is the wrong trade. So the question behind Prakira was narrow: can an AI write the advice without ever being trusted with a number?

## What it does

You pick a place and say who lives there (older adult, young child, outdoor worker, asthma, pregnancy, flood-prone home, no air conditioning). Prakira returns, in English or Bahasa Indonesia:

- **A 72-hour strip:** heat index, rain, air quality and UV for three days, each with a level set by published rules (US National Weather Service, US EPA, WHO).
- **A climate row:** how each day compares with the local 1991 to 2020 average for the same week.
- **A short briefing:** one action per serious hazard, written for that household.
- **A visible process:** while you wait, the page shows each real step as the server performs it (read the forecast, set levels by rule, AI writes, check every claim), with its duration. Afterwards the steps stay as one line above the result.
- **An audit trail:** select any action and the numbers it relies on light up. A panel lists every AI claim that was rejected and why.
- **Describe your home:** write one sentence ("We live in Depok, my dad is 68 and has asthma, no AC") and the AI fills in the form for you. It can only tick the existing options and suggest a place to search for; you confirm before anything is generated.
- **Two models, one honest answer:** each day shows whether ECMWF's physics model and its AI weather model (AIFS) agree on the temperature. When they differ, the page says the forecast is less certain.
- **Everyday basics:** the hour when heat and UV peak, "use my location", choices remembered in your browser only, share to WhatsApp, and a long-range card: hot days a year in 2011 to 2020 against 2041 to 2050 from three climate models.

If nothing is serious for your household, it says so and gives no advice. If the AI skips a serious hazard, a fixed notice fills the gap.

## How we built it

Five layers, and only one of them is a language model:

1. **Data:** Open-Meteo forecast, the CAMS air-quality forecast, and an ERA5-based climate archive, with NASA POWER as the second source when the free daily limit is reached. No API key.
2. **Rules:** code computes the NWS heat index from temperature and humidity, assigns every hazard level, and decides which levels are serious for the chosen household.
3. **Model:** Mistral `open-mistral-nemo` (free tier) writes one short action per serious hazard, and nothing else. It is told not to write numbers.
4. **Screen and evidence:** an action is kept only if it is for a hazard that is serious for the household, contains no digits, uses only words from a reviewed list for that hazard, and does not say "stay indoors" at a level too low to justify it. Code then attaches the level and builds the sentence with the numbers from the forecast values. Anything else the model writes is ignored.
5. **Notices:** fixed text for any serious hazard left uncovered.

The whole thing is plain Node.js with no dependencies and one HTML page, hosted on a tablet at home behind a Cloudflare Tunnel. 43 unit tests run offline.

## Results

Live evaluation on 8 October 2026. "Held-out" means 15 cities never used while adjusting the system.

| | English, held-out | Indonesian, held-out |
|---|---|---|
| AI actions kept by the screen | 23 of 27 (85.2%) | 22 of 27 (81.5%) |
| Serious hazards covered by the AI alone | 84.2% | 84.2% |
| Serious hazards covered with notices | 100% | 100% |
| Numbers written by the AI and shown to the user | 0 | 0 |
| Reading grade of the action (median; at grade 8 or below) | 4.4; 95.7% | not computed |

"Kept" means the action passed the screening rules; it is not a rating of the advice. The screen is strict on purpose: an action may only use words from a reviewed list for its own hazard, and anything else is replaced by a standard notice. Before that rule the screen kept 96%, and reading those actions turned up "stay near water" for polluted air and "use fans to pull clean air in". These are small samples and one run each. Coverage with notices and the zero in the fourth row are true by design. The full record, including the earlier design and runs made with bugs since fixed, is in the repository.

## Challenges we ran into

- **Our own first version got the science wrong.** It applied heat-index categories to a different temperature measure and used the wrong cut points. Re-checking against the NWS source caught it, and the unit tests now reproduce the two examples NWS publishes.
- **Over-warning.** An early version told a London household to stay indoors at an air quality index of 58. We made the system advise only on hazards that are serious for the household, and reject "stay indoors" advice at low levels.
- **The verifier had gaps we only found by reading its output.** Indonesian decimal commas ("37,6") were read as two numbers. A claim could cite three days and state only two values. Worst, a sentence could carry the right numbers on the wrong days ("224 today" when 224 was the day after) and still be marked verified; we saw it on a live result, not in our evaluation. That was the turning point: we stopped trying to check the model's numbers and took the model out of the numbers altogether. It now writes only the action.
- **Readability traded against accuracy.** One prompt change took the reading grade from 8.4 to about 3.5, and the model's raw pass rate moved around while we worked on it.
- **Free-tier limits.** The larger models were not available on our key, so the system had to work with a small one.

## Accomplishments that we're proud of

- The model never writes a number or a level. Every figure on the page comes from the forecast data, and the interface shows which of the model's actions were removed and why.
- The evaluation includes cities the system was never tuned on, and reports the weak figures along with the strong ones.
- It works in Bahasa Indonesia, with the verifier handling local number formatting.

## What we learned

Checking an AI's output is weaker than not needing to. Our verifier passed a wrong sentence with a "verified" badge, and a stricter verifier would only have been a better guess. Removing the model from the numbers was simpler and stronger. What remains unchecked is the judgement in an action: in a read-through of 22 actions on the earlier design, two were questionable even though every number was right (for example, suggesting morning activity on a day with a heat index of 47 °C). Saying that plainly is more useful than a clean-looking score.

## What it is not

- Not the first personalised weather warning: ClimApp and HEAT-SHIELD do this for heat without a language model, and research prototypes use language models for single hazards. We did not find this combination in a search of one research database, which is not proof that it is new.
- Not an official warning and not medical advice. No person or clinician has reviewed the advice yet; the read-through was done by an AI assistant.
- Not a sensor: the data are model forecasts for a grid cell several kilometres wide.

## What's next

- A review of the advice by people, including a health professional.
- Resolve conflicts between hazards (bad air against heat in a home without air conditioning).
- More languages, each with its own verification tests.

## Built with

Node.js, vanilla JavaScript, HTML and CSS, Open-Meteo (including ECMWF IFS and AIFS forecasts), Copernicus Atmosphere Monitoring Service, Mistral API, Cloudflare Tunnel.

## Disclosure

- **Built during the event.** The repository was created on 7 October 2026 and all its code was written inside the event window.
- **Earlier practice work.** Before the event the author kept a separate practice repository with an unrelated security-advisory experiment and a generic evaluation harness. No code from it is in this project.
- **AI assistance.** The project was built with an AI coding assistant (Claude Code), which wrote most of the code and text under the author's direction and did the read-through of the advice.
