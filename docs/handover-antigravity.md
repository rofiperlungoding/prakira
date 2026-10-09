# Handover: Prakira, for Antigravity (Gemini)

Written for: a coding assistant that takes over the project from Claude without prior context. Read this file end to end before any action. Then read `GEMINI.md` (rules), `AGENTS.md` (repository entry) and `PLAN.md` section 0 and the last ten session-log lines.

Status date: 2026-10-10, about 01:00 WIB. Latest commit on `main` at the time of writing: `94f7247`.

## 1. What the project is

**Prakira** is a ForgeHacks 2026 submission, track **AI + Climate**. It gives a household a short list of actions for the next 72 hours of heat, rain, air quality and UV, in English or Bahasa Indonesia. The model writes only the action. Code sets every hazard level and every number, from published rules and forecast data. Every action is screened before it is shown. The page lists what was removed and why.

- Live site: https://prakira.rofihosted.space (self-hosted on a tablet at home, behind a Cloudflare Tunnel)
- Repository: https://github.com/rofiperlungoding/prakira (public)
- Demo video: https://youtu.be/HVf6HvzaQvM (2:34)
- Devpost: submitted by the owner on 2026-10-10. The owner can still edit it until the lock at 23:00 WIB.
- Judging: 10 to 11 October 2026. Winners announced 12 October, 15:00 ET. The site and the video must stay up through 11 October.

## 2. Who the owner is and how to work with them

- Name in the repository: Rofi. Writes casual Indonesian. Wants short, direct replies in Indonesian. Files, commits, code comments and public text are in clear English.
- When given a task, do all of it and report the result. Do not hand back steps for the owner to do. (Repeated complaint from the owner.)
- When asked a question, answer it. Do not start changing files because of a question.
- Ask for one decision at a time, with a recommended option first.
- The owner pastes API keys into chat by mistake. Never ask for a key in chat. Never write a key to a file. See section 7.
- The owner rejects clutter, bordered cards and anything that makes the user think. Design is one accent colour, see section 6.

## 3. Repository state

- Branch `main`, clean except for one untracked file: `eval/second-model.mjs` (see section 8). Tests: `npm test`, 43 of 43 pass (last run at `94f7247`).
- Key directories: `lib/` (rules, model call, screen), `public/` (the page: `index.html`, `about.html`), `eval/` (live evaluation and the second-model check), `docs/` (Devpost text, brand kit, screenshots, video script, teleprompter, review log of the video in its own project).
- `DEPLOY.local.md` exists on the owner's PC and is **not** in git. It holds the deploy command. Do not commit it. Never print secrets from it.
- Deploy happens from the other repository `gtawifi-vps`, with `sh scripts/deploy_prakira.sh /c/Users/Rofi/Documents/Codes/climate-brief`. It restarts only the `prakira` service on the tablet. Do not restart `web`, `router`, `hermes` or `tunnel`. Deploy only when the owner asks.

## 4. Recent history (what changed and why)

Newest first.

- `94f7247`: rain classes now say "commonly quoted from BMKG, not checked against a primary source" (was "WMO-No. 1150 / WMO-No. 8", which could not be confirmed). The ISO/IEC 42001 phrase is removed from the About page. Owner decided "ganti". **Not yet deployed.**
- `ae7bd77`: plan and Gemini brief record that the n8n alert is published (owner's screenshot) and that both API keys were rotated (owner's report).
- `a7eb93e`: YouTube link added to the README and the Devpost draft. M10 and M11 ticked in `PLAN.md` on the owner's report. The owner reported the logged-out Devpost check as OK, but the assistant did not open the page.
- `d909636`: README rebuilt visually. Banner, four badges, evaluation figure cards (`docs/screenshots/stats.png`), a grid of screenshots, a hazards card picture (`docs/screenshots/hazards.png`), repository map folded. No claim changed. The repository About (description, website, topics) was set with `gh repo edit`.
- `2cc6cec`: Devpost draft split into one block per form field; `docs/devpost-about.md` is the About text (no tables, paste as is); screenshots retaken from the live site; 3:2 gallery pictures and a thumbnail added.
- `e2d939b`: architecture diagram redrawn in the app's look. `docs/architecture.svg` is the source. `docs/screenshots/architecture.png` is the rendered 3:2 picture used on Devpost and in the README.
- `7c3126a`, `a151fbf`: `GEMINI.md` written as the handover and rule file, then extended with sponsor status (no codes) and n8n and key rules.

Removed on 2026-10-10 because they were never checked (do not bring them back without a source): a citation "Zhao et al., 2027", "ISO/IEC 42001 alignment", "benchmarked against WMO normals", "conforms to WCAG 2.1 AA/AAA". The README's "Sources for the hazard levels" table is the only place a hazard-level source is listed; it is correct as written.

## 5. The demo video (finished, owner has it)

- Project: `C:\Users\Rofi\Documents\Codes\videoagents\videos\prakira-demo-16x9` (the owner's motion-reel studio, its own git repository is not used for this; its changes are uncommitted).
- Final file: `renders/16x9.mp4` in that project, a copy at `C:\Users\Rofi\Videos\Prakira-demo-ForgeHacks-2026.mp4` (82 MB, 1920×1080, 60 fps, h264 yuv420p, AAC 48 kHz stereo, 153.93 s). Preview 720p (13 MB) was sent to the owner.
- Gate: studio gate `SHIP` at review round 5 and `SHIP (final)` on the final file. Sound sync 11 of 13 hits within 45 ms, mean 28.2 ms. Loudness −14.1 LUFS, peak −1.2 dBFS. No near-blank frames. Longest static 1.45 s, max gap 2.02 s. Decodes end to end with no errors.
- Honest limits (already told to the owner): the reviews were done by the assistant alone (critic: self); the sound was measured, not listened to by anyone; the film clock is held once while the briefing generates; the Indonesian briefing was requested once before the capture; one real AI action in the take was removed by the screen.
- YouTube thumbnail: `C:\Users\Rofi\Videos\Prakira-youtube-thumbnail.png` (1920×1080, 251 KB). Devpost thumbnail: `docs/screenshots/thumbnail.png` (3:2).
- The owner uploaded the video to YouTube as public (link above).

## 6. Brand and design rules

- Colours: Ink `#101a13`, Sunrise `#f4a04c` (the one accent), Cream `#fff3d6`, Paper `#fbfbf6`. Headings Outfit 500, text DM Sans. Logo: a half disc over three bars. The guide is `docs/brand/README.md`.
- The owner's taste: short, clean, one accent, no bordered cards, no clutter. The result is a numbered list of points, with all data behind one switch ("Show all the data").
- Any visual change: check it in a browser at 1280 px and 375 px, in English and Indonesian, with `scripts/ui-check.cjs` (needs the Playwright path in `GEMINI.md` section 5). Show the owner a screenshot.

## 7. Keys, accounts and secrets

- **Rotated (owner's report, 2026-10-10):** the n8n API key and the Featherless API key. Both were pasted into chat by mistake. A scan of the repository and its full git history found neither key. Keep it that way.
- **Where keys live:** Windows user environment variables on the owner's PC (`N8N_API_KEY` is not set there any more; `FEATHERLESS_API_KEY` is set and was rotated). `.env` holds `MISTRAL_API_KEY` for the site and is git-ignored.
- Never print a key. Read one only into a shell variable, for example with `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('FEATHERLESS_API_KEY','User')"`, and check its length, not its value.
- Do not ask for a key in chat. If one is needed, tell the owner which variable to set (`setx NAME "value"`) and wait for "sudah".

## 8. The second-model check (decision pending)

- `eval/second-model.mjs` (untracked). Ten fixed fact scenarios, no forecast call, no archive call. It sends the same prompt (copied from `lib/llm.mjs`) to Mistral `open-mistral-nemo` and to Featherless, then runs every answer through the site's screen (`lib/verify.mjs`, unchanged).
- Result, one run, temperature 0.2: Mistral 18 of 27 actions kept (66.7%), AI covers 18 of 23 serious hazards (78.3%). Featherless `Qwen/Qwen2.5-7B-Instruct`: 15 of 26 kept (57.7%), covers 15 of 23 (65.2%).
- Main cause of rejection in both: the reviewed word list (`seek`, `change`, `boxes`, `damp`, `puddles`), not the model. Improving that means editing `lib/vocab.mjs`, which needs the owner's approval.
- `meta-llama/Llama-3.3-70B-Instruct` on Featherless still returns 403 (gated). The owner requested access on Hugging Face. Do not keep polling. Check once more only if the owner asks.
- **Pending decision:** keep the script in the repository or not. Do not commit it until the owner says so. Do not put these numbers in the README; they are not comparable with the held-out table there.

## 9. Sponsor benefits (owner's own use, not part of the product)

Status reported by the owner. Redemption codes are not in the repository on purpose. The packet has them: `ForgeHacks 2026 Participant Packet`.

| Benefit | Status |
|---|---|
| Featherless AI | Claimed (used for the second-model check) |
| Adaption ($500) | Claimed. Purpose for Prakira not decided. Dashboard not yet checked |
| Momen ($100) | Claimed. Purpose for Prakira not decided. Dashboard not yet checked |
| n8n Cloud Pro | Claimed. Used for the uptime alert |
| YouCam API | Claimed. Not relevant to Prakira |
| Agentboxd Builder | Claimed. Not relevant to Prakira |
| DevSwarm, ProjectAAL | Skipped |
| Kariaa ($40) | On hold, owner's decision |

Rule: using a benefit must not change the product. Do not add a feature because a benefit exists. Ask the owner before signing up for anything or accepting terms.

## 10. Monitoring

- An n8n Cloud workflow in the owner's account, named "Prakira uptime watch", checks `https://prakira.rofihosted.space/healthz` every 5 minutes and emails the owner if the answer is not 200. It shows as Published in the owner's n8n list (screenshot). The alert itself has not been tested. Its JSON is kept outside the repository.
- `/healthz` returns `{"ok":true}` with status 200 (checked on 2026-10-10).

## 11. Open items, in order

1. **Deploy the wording change (`94f7247`).** Owner must say "deploy". Then run the deploy command from `DEPLOY.local.md`. Check the live page in English and Indonesian for the new rain wording.
2. **Adaption and Momen dashboards.** Owner has not yet sent screenshots. Ask for one screenshot each, then propose a use for Prakira. Do not sign up for anything.
3. **Second-model script.** Keep or drop (section 8). Owner decides.
4. **Llama 70B on Featherless.** Blocked on Featherless' gate. Check only if the owner asks.
5. **Live Devpost page.** The owner reported it as checked (logged out). The assistant did not open it. Only check again if asked.
6. **Alert test.** Optional. Only with the owner's approval, because it changes the live service. Do not stop the service without asking.

Nothing else is owed to the judges. The submission is complete. Work from here is about keeping the live site correct, not adding features.

## 12. Things not to do

- Do not add features, dependencies or build steps. The video, README and Devpost text describe the site as it is.
- Do not change `lib/` or `public/` without the owner asking for that exact change.
- Do not let the model write a number or a hazard level. Levels come from `lib/facts.mjs`.
- Do not write a citation, standard, percentage or "verified" claim without opening the source or running the check in this session. Record the URL and date in the session log.
- Do not run `npm run eval` or any loop against the Open-Meteo archive. The free daily quota was used up once.
- Do not commit `.env`, `*.local.md`, `eval/out/`, keys, or redemption codes.
- Do not write "first", "novel", "revolutionary", "state of the art", "medical" (except "not medical advice"), "guarantees", "certified" or "compliant" in public text.

## 13. After each task

1. `npm test` must end with `pass 43`, `fail 0`.
2. `git status --short` shows only the files you meant to change.
3. Add one line to the session log in `PLAN.md` section 13: what changed, what was verified and how, what was not verified, what is next.
4. Commit with a plain English message, add the attribution line the team uses, and push:

```bash
git -c user.email="$(git log -1 --format=%ae)" commit -m "docs: ..."
git push
```

5. Tell the owner in Indonesian, in a few short lines, what changed and what is next.
