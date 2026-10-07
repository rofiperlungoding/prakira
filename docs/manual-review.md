# Read-through of 12 briefings

Date: 2026-10-07.

**Who read them:** the AI coding assistant used to build the project (Claude). **No person and no clinician has reviewed this advice.** Treat this as a first screening, not as validation. A human review is still needed before any claim about the quality of the advice.

## What was read

22 verified model claims from 12 briefings, taken from two eval runs made on 2026-10-07 at about 15:43 and 15:45 UTC:

- English, held-out locations: Karachi, Mumbai, Mexico City, Tokyo, Accra, Las Vegas (8 claims).
- Indonesian, tuned locations: Jakarta, Surabaya, Delhi, Lagos, Dubai, Phoenix (14 claims).

Standard notices were not read: they are fixed text. Rejected claims were not read: users never see them.

Each claim was judged on two things: is the action sensible for the stated level and household, and does the evidence sentence say what the data says.

## Result

| | Count |
|---|---|
| Actions that read as sensible and proportionate | 20 of 22 |
| Actions that are questionable | 2 of 22 |
| Actions that are clearly wrong or unsafe | 0 of 22 |
| Evidence sentences with a wording problem | 7 of 22 (all in Indonesian; two of the seven have both problems below) |

### The two questionable actions

1. **Dubai, young child and respiratory condition, heat index 52.4 °C today (extreme danger), 47.2 °C tomorrow (danger).** The action said to keep the child indoors today, and to "be active in the morning or evening" tomorrow. Suggesting outdoor activity on a day at the "danger" level is not cautious enough for a young child. The verifier cannot catch this: it checks numbers and levels, not the judgement in the action.
2. **Mumbai, older adult without air conditioning, US AQI 213 to 298 (very unhealthy).** The action said to stay inside with doors and windows closed and to use fans. For a home without air conditioning in a hot climate, closing everything can raise indoor heat. The action for one hazard did not take the other hazard into account. Prakira writes one action per hazard, so this kind of conflict is possible by design.

### Evidence wording problems

- **"besok hari" for the day after tomorrow** in 7 Indonesian evidence sentences (Surabaya 3, Lagos 1, Dubai 3). It is not a standard phrase for that day; the correct word is "lusa". In four of the seven the weekday in brackets made the day clear. In the three Dubai sentences it did not.
- **One value used for two days**, in 2 sentences. Lagos: "Indeks panas 31,6 °C hari ini (Rabu) dan besok (Kamis)". Surabaya: "Ia 35 °C besok (Kamis) dan besok hari (Jumat)". The verifier at that time only checked that the number belonged to one of the cited days. It did not check that every cited day had its own value stated, so these sentences could pass even if the two days differed. Whether they did differ was not checked afterwards.

## What was changed because of this

- **Verifier:** a model claim is now rejected unless the value of every cited day appears in the evidence (`a cited value is not stated in the evidence`). Covered by a unit test.
- **Prompt:** for Indonesian output, the fact table now gives the day words in Indonesian (hari ini, besok, lusa) and the model is told to use the exact day words from the table.
- The eval was re-run after both changes. Results are in `PLAN.md`, section 8, and in the README.

## What was not fixed

- The two questionable actions. They are a limit of the design: the action text is written by a language model and is checked only for numbers, for digits, and for "stay indoors" at too low a level.
- **The verifier still does not check that each number is attached to the right day.** A sentence that swaps today's and tomorrow's values would pass, because both numbers belong to cited days.
- Conflicts between hazards (heat against polluted air) are flagged by the compound-day notice but not resolved in the actions.

## For a human reviewer

The eval writes every verified claim to `eval/out/report-*.json` (not in git). To repeat this review: run `npm run eval -- 15 en heldout`, open the newest report, and judge each `claims` entry against its `level` and `profile`. Suggested labels: sensible, questionable, wrong or unsafe; plus whether the evidence sentence is true to the data.
