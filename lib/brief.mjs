import { getFacts, thresholds, isSerious } from './facts.mjs';
import { askModel, MODEL } from './llm.mjs';
import { verifyAll, PROFILES } from './verify.mjs';
import { buildNotices, buildCompound } from './notice.mjs';
import { getContext } from './climate.mjs';

export function cleanProfile(p) {
  return Array.isArray(p) ? p.filter((x) => PROFILES.includes(x)) : [];
}

export async function makeBrief({ lat, lon, profile, lang }) {
  const { facts, warnings, tmax } = await getFacts(lat, lon);
  // Climate context is optional: a failure of the archive API must not block the briefing.
  const context = await getContext(lat, lon, tmax).catch((e) => {
    warnings.push(`Climate context unavailable: ${e.message}`);
    return [];
  });
  const th = thresholds(profile);
  const serious = facts.filter((f) => isSerious(f, th));
  const out = { facts, warnings, context, compound: buildCompound(facts, lang), model: MODEL, serious: serious.map((f) => f.id), quiet: !serious.length, claims: [], notices: [], rejected: [], total: 0, error: null, attempts: 0 };
  // Nothing serious for this household: no model call and no advice. Saying nothing is better than over-warning.
  if (out.quiet) return out;
  // Up to 2 retries (3 s apart) if the model call fails or nothing verifies. Never loops further.
  for (let a = 1; a <= 3 && !out.claims.length; a++) {
    if (a > 1) await new Promise((r) => setTimeout(r, 3000)); // free tier rate limit (HTTP 429)
    out.attempts = a;
    try {
      const v = verifyAll(await askModel(facts, serious, profile, lang), facts, th);
      Object.assign(out, { claims: v.verified, rejected: v.rejected, total: v.total, error: null });
    } catch (e) {
      out.error = e.message;
    }
  }
  // Serious hazards the model did not cover still reach the user, as fixed-template notices.
  out.notices = buildNotices(facts, out.claims, th, lang);
  return out;
}
