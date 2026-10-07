# AGENTS.md: start here (any AI coding assistant)

This repository is **Prakira**, a ForgeHacks 2026 submission (track AI + Climate). Deadline: Saturday 2026-10-10, 23:00 WIB at the latest; internal target 18:00 WIB.

## Read in this order before doing anything

1. **`PLAN.md`**: mission, current state, task list with acceptance tests, operating rules, decision log, session log. It is the single source of truth for what to do next.
2. `docs/climate-novelty-literature.md`: why the product is shaped this way (requirements R1 to R8).
3. `README.md`: the public description.
4. `DEPLOY.local.md` if present (not in git): private server deployment notes.

## Rules that matter most

- Do the next unchecked task in `PLAN.md` section 7, in order. A task is done only when its acceptance test passes.
- After each task: run `npm test`, tick the task in `PLAN.md`, add a line to the session log in `PLAN.md` section 13 (what changed, what was verified, what is next), commit, push.
- Model output is untrusted. Hazard levels come from rules in `lib/facts.mjs`, never from the model.
- No new dependencies, frameworks or build steps. Node built-ins only.
- Never print, log or commit secrets (`.env`). Never commit `*.local.md`.
- Never claim a check passed unless it was run. State what was not verified.
- Public wording: "auditable", "verified against the forecast data". Never "first", "novel", "medical".
- The owner writes casual Indonesian and wants short, direct replies. Files, commits and submission text are in clear English.

## Commands

```bash
npm test             # unit tests, offline
npm start            # http://localhost:3000 (needs .env with MISTRAL_API_KEY)
npm run eval -- 20   # live evaluation over 20 locations
```
