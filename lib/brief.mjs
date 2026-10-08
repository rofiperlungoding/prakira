import { getFacts, thresholds, isSerious } from './facts.mjs';
import { askModel, MODEL } from './llm.mjs';
import { verifyAll, PROFILES } from './verify.mjs';
import { buildNotices, buildCompound } from './notice.mjs';
import { getContext } from './climate.mjs';
import { tracer } from './trace.mjs';
import { getAgreement } from './models.mjs';

export function cleanProfile(p) {
  return Array.isArray(p) ? p.filter((x) => PROFILES.includes(x)) : [];
}

// `onStep` receives each step as it starts and ends, for a live display. The finished steps are also
// returned as `trace`.
// `climate: false` skips the 30-year normal (the evaluation does not need it and it is costly to fetch).
export async function makeBrief({ lat, lon, profile, lang, onStep, climate = true }) {
  const tr = tracer(onStep);

  tr.start('forecast');
  let got;
  try {
    got = await getFacts(lat, lon);
  } catch (e) {
    tr.fail('forecast', e.message);
    throw e;
  }
  const { facts, warnings, tmax, utcOffset } = got;
  tr.done('forecast', { values: facts.length, air: facts.some((f) => f.hazard === 'air') });

  // Climate context is optional: it fails only when both records (ERA5 and NASA POWER) are unreachable,
  // and that must not block the briefing.
  let context = [];
  if (climate) {
    tr.start('climate');
    try {
      context = await getContext(lat, lon, tmax);
      tr.done('climate', { days: context.length, source: context[0]?.source });
    } catch (e) {
      warnings.push('The comparison with the 30-year normal is unavailable right now: neither climate record answered.');
      tr.fail('climate', e.message);
    }
  }

  // A second optional layer: do a physics model and an AI model agree on the temperature? Skipped with the
  // climate layer (the evaluation needs neither), and a failure never blocks the briefing.
  let models = [];
  if (climate) {
    tr.start('models');
    try {
      models = await getAgreement(lat, lon, utcOffset, [...new Set(facts.map((f) => f.date))]);
      tr.done('models', { days: models.length, widest: Math.max(...models.map((m) => m.diff)) });
    } catch (e) {
      tr.fail('models', e.message);
    }
  }

  tr.start('rules');
  const th = thresholds(profile);
  const serious = facts.filter((f) => isSerious(f, th));
  const out = { generatedAt: new Date().toISOString(), facts, warnings, context, models, compound: buildCompound(facts, lang), model: MODEL, serious: serious.map((f) => f.id), quiet: !serious.length, claims: [], notices: [], rejected: [], total: 0, error: null, attempts: 0, trace: tr.list };
  tr.done('rules', { levelled: facts.filter((f) => f.level !== 'n/a').length, serious: serious.length });

  // Nothing serious for this household: no model call and no advice. Saying nothing is better than over-warning.
  if (out.quiet) return out;

  // Up to 2 retries (3 s apart) if the model call fails or nothing verifies. Never loops further.
  for (let a = 1; a <= 3 && !out.claims.length; a++) {
    if (a > 1) await new Promise((r) => setTimeout(r, 3000)); // free tier rate limit (HTTP 429)
    out.attempts = a;
    tr.start('model', { attempt: a });
    let raw;
    try {
      raw = await askModel(facts, serious, profile, lang);
    } catch (e) {
      out.error = e.message;
      tr.fail('model', e.message, { attempt: a });
      continue;
    }
    tr.done('model', { attempt: a, claims: Array.isArray(raw?.claims) ? raw.claims.length : 0 });
    tr.start('verify');
    const v = verifyAll(raw, facts, th, lang);
    Object.assign(out, { claims: v.verified, rejected: v.rejected, total: v.total, error: null });
    tr.done('verify', { kept: v.verified.length, removed: v.rejected.length });
  }

  // Serious hazards the model did not cover still reach the user, as fixed-template notices.
  tr.start('notices');
  out.notices = buildNotices(facts, out.claims, th, lang);
  tr.done('notices', { notices: out.notices.length, compound: Boolean(out.compound) });
  return out;
}
