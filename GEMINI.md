# GEMINI.md: handover and quality rules for Gemini

You are taking over **Prakira** from another assistant. The project is submitted to ForgeHacks 2026 (track AI + Climate) and is being judged on 10 and 11 October 2026. Judges open the live site, the repository and the video. Your job is to keep all of them correct and consistent. It is not to add things.

Read this file fully before you touch anything. Then read `AGENTS.md` and `PLAN.md` section 0.

## 1. State on 2026-10-10

| Thing | State |
|---|---|
| Live site | https://prakira.rofihosted.space, served from the last commit on `main` |
| Devpost | Submitted by the owner on 2026-10-10. It can be edited until the lock at 23:00 WIB |
| Demo video | Made (2:34). The owner uploaded it to YouTube. The link is not yet in `README.md` |
| Tests | `npm test`: 43 of 43 pass |
| Devpost text | `docs/devpost-draft.md` (one block per form field) and `docs/devpost-about.md` (the About text) |
| Pictures | `docs/screenshots/` (retaken from the live site on 2026-10-10), `docs/architecture.svg` |

## 1b. Sponsor benefits: status from the owner (2026-10-10)

Owner's report, not checked by the assistant. Redemption codes are left out on purpose: the repository is public. The packet (`ForgeHacks 2026 Participant Packet`) has them.

| Benefit | Value | Status |
|---|---|---|
| Featherless AI | $25 | Claimed. Login email arrived 3 October |
| Adaption | $500 | Claimed. Email arrived 5 October |
| Momen | $100 | Claimed. Welcome email arrived 3 October |
| n8n Cloud Pro | 1 month | Claimed. Activation email arrived 3 October |
| YouCam API (Perfect Corp) | $27.50 | Claimed |
| Agentboxd Builder | 1 month | Claimed |
| DevSwarm, ProjectAAL | | Skipped. Not used |
| Kariaa | $40 | On hold. The owner will decide later |

Rules for these benefits:
- They are for the owner's own use. Using them does not change the project. Do not add a feature because a benefit is available.
- Do not put a redemption code in any file in this repository.
- If the owner asks you to use one, ask first which benefit and what for. Do not sign up for anything or accept terms on the owner's behalf.

## 2. What is still open

Do these only when the owner asks, in this order.

1. Put the YouTube link in `README.md` (under the badges) and in `docs/devpost-draft.md` where it says "add the YouTube link". Then tick M10 in `PLAN.md` section 7.
2. Tick M11 in `PLAN.md` section 7 once the owner confirms that the public Devpost page opens logged out and every link works.
3. **Owner's decision, do not decide it yourself:** the live page says the daily rain classes (20, 50, 100, 150 mm) come from "WMO-No. 1150 / WMO-No. 8". That was never confirmed. A search on 2026-10-10 found the same cut points in a provincial report that cites BMKG, and did not find them in either WMO document. The README and the Devpost text already say "commonly quoted from BMKG, not checked against a primary source". If the owner says "ganti", change the wording in `lib/facts.mjs` (comment), `public/index.html` (English and Indonesian strings) and `public/about.html` to match the README, run the checks in section 5, and deploy.

Everything else is finished. If you think something else needs doing, write it to the owner as a proposal and wait.

## 3. Rules that are not negotiable

1. **No new features, files of code, dependencies or build steps.** Node built-ins only. The video, the README and the Devpost text describe the site as it is now. A new feature makes all three wrong.
2. **Do not edit `lib/` or `public/` unless the owner asks for that exact change.** These are what the judges test.
3. **The model never supplies a number or a hazard level.** Levels come from the rules in `lib/facts.mjs`. Do not move any of that into a prompt.
4. **Never write a claim you did not check in this session.** This covers standards, citations, percentages, "conforms to", "aligned with", "benchmarked", "verified", "tested on". If you did not open the source or run the command, do not write it. See section 4.
5. **Never write that a check passed unless you ran it and read its output.** Paste the result line into the session log. If you could not run something, write "not verified" and why.
6. **Banned words in public text:** "first", "novel", "revolutionary", "state of the art", "medical" (except in the sentence "not medical advice"), "guarantees", "certified", "compliant".
7. **Numbers come from one place.** Every evaluation figure must match the table in `README.md` section "Evaluation". Do not round differently in two places. Do not invent a new figure.
8. **Secrets.** Never print, log or commit `.env`. Never commit `*.local.md`.
9. **Do not run `npm run eval`** or anything that calls the Open-Meteo archive in a loop. It used up the free daily quota once.
10. **Deploy only when the owner asks**, and only with the command in `DEPLOY.local.md`. Restart only the `prakira` service.

## 4. Why rule 4 exists: what went wrong before

On 2026-10-09 a Gemini session added the following to the README, the Devpost text and the live pages. None of it had been checked, and all of it had to be found and removed or flagged the next day:

- A citation, "Zhao et al., 2027". It is not in `docs/climate-novelty-literature.md` and is dated in the future.
- "ISO/IEC 42001 alignment". That is a management-system standard for organisations. The project was never assessed against it.
- "Benchmarked against WMO Climatological Standard Normals". Nothing was benchmarked. The code averages an ERA5-based archive over 1991 to 2020.
- "Conforms to WCAG 2.1 AA/AAA". A contrast check on one page is not conformance.
- The rain classes attributed to two WMO documents (still on the live page, see section 2).

The product's whole argument is that every number has a source the reader can check. One invented source costs more than any feature could earn. **A citation is allowed only if it is already in `docs/climate-novelty-literature.md` or in the "Sources for the hazard levels" table of the README, or if you opened the primary source in this session and you record its URL and the date in the session log.**

## 5. Checks to run before every commit

```bash
npm test                                   # must end with: pass 43, fail 0
git status --short                         # only files you meant to change
git diff --stat                            # a text edit that removes hundreds of lines is a mistake: stop and restore
```

If you changed `public/` or `lib/`, also start the server and look at the page in a browser at 1280 px and at 375 px, in English and in Indonesian, before you say it works:

```bash
npm start                                  # http://localhost:3000, needs .env
PLAYWRIGHT_PATH="C:/Users/Rofi/Documents/Codes/CatCoder/CatCoder/node_modules/playwright" node scripts/ui-check.cjs http://localhost:3000 docs/screenshots
```

The server reads `public/index.html` once at start. Restart it after an edit.

Before you finish, compare these three and fix any difference in wording or figures: `README.md`, `docs/devpost-about.md`, the live page.

## 6. How to work with the owner

- The owner writes short, casual Indonesian and wants short, direct replies in Indonesian. Files, commits and anything public are in clear English.
- When the owner gives a task, do all of it and report the result. Do not hand back a list of steps for the owner to do.
- When the owner asks a question, answer it first. Do not start changing files because of a question.
- Show a screenshot for any visual change.
- Design: one accent colour (Sunrise `#f4a04c`), Ink `#101a13`, Cream `#fff3d6`, Paper `#fbfbf6`; Outfit 500 for headings, DM Sans for text. The guide is `docs/brand/README.md`. The owner rejects cluttered layouts, bordered cards and anything that makes the user think. Keep it simple.

## 7. After each task

1. Run the checks in section 5.
2. Add one line to the session log in `PLAN.md` section 13: what changed, what you verified and how, what you did not verify, what is next.
3. Commit with a plain English message and push:

```bash
git -c user.email="$(git log -1 --format=%ae)" commit -m "docs: ..."
git push
```

## 8. If you are unsure

Stop and ask the owner one short question. A wrong change during judging is worse than no change.
