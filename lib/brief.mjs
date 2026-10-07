import { getFacts } from './facts.mjs';
import { askModel, MODEL } from './llm.mjs';
import { verifyAll, PROFILES } from './verify.mjs';

export function cleanProfile(p) {
  return Array.isArray(p) ? p.filter((x) => PROFILES.includes(x)) : [];
}

// Up to 2 retries (3 s apart) if the model call fails or nothing verifies. Never loops further.
export async function makeBrief({ lat, lon, profile, lang }) {
  const { facts, warnings } = await getFacts(lat, lon);
  const out = { facts, warnings, model: MODEL, claims: [], rejected: [], total: 0, error: null, attempts: 0 };
  for (let a = 1; a <= 3 && !out.claims.length; a++) {
    if (a > 1) await new Promise((r) => setTimeout(r, 3000)); // free tier rate limit (HTTP 429)
    out.attempts = a;
    try {
      const v = verifyAll(await askModel(facts, profile, lang), facts);
      Object.assign(out, { claims: v.verified, rejected: v.rejected, total: v.total, error: null });
    } catch (e) {
      out.error = e.message;
    }
  }
  return out;
}
