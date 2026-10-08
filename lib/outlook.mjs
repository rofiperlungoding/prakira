// Long-range outlook: how many hot days a year three climate models give for this place in 2011-2020 and
// in 2041-2050. Source: Open-Meteo Climate API (CMIP6 HighResMIP models, downscaled to 10 km and
// bias-corrected against ERA5-Land; docs checked 2026-10-08).
// Limits, to be shown with the result: model output, not measurement; a high-emissions pathway ("as close
// to RCP8.5 as possible" per the docs); three models; two 10-year windows; daily maximum air temperature,
// not heat index.
// When the Climate API is unavailable, the card looks back instead of ahead: the same count from NASA
// POWER's record (lib/power.mjs) for 1991-2000 and 2011-2020, marked `source: 'observed'`.
// Two equal 10-year windows are used, not the 30-year normal period: each decade of daily data for three
// models counts as many calls against Open-Meteo's free daily limit, and equal windows compare like with like.
import { getJson } from './facts.mjs';
import { load, save } from './store.mjs';
import { powerDaily } from './power.mjs';

export const MODELS = ['MRI_AGCM3_2_S', 'EC_Earth3P_HR', 'MPI_ESM1_2_XR'];
export const PAST = [2011, 2020];
export const FUTURE = [2041, 2050];
export const OBSERVED = [[1991, 2000], [2011, 2020]];

// Mean number of days per year, within [fromYear, toYear], with a value at or above the threshold.
// Years with no data at all are left out of the mean. Null when no year has data.
export function hotDaysPerYear(time, values, threshold, fromYear, toYear) {
  const perYear = new Map();
  for (let i = 0; i < time.length; i++) {
    const y = Number(time[i].slice(0, 4));
    if (y < fromYear || y > toYear || values[i] == null) continue;
    perYear.set(y, (perYear.get(y) ?? 0) + (values[i] >= threshold ? 1 : 0));
  }
  if (!perYear.size) return null;
  return [...perYear.values()].reduce((a, b) => a + b, 0) / perYear.size;
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const span = (xs) => ({ median: Math.round(median(xs)), min: Math.round(Math.min(...xs)), max: Math.round(Math.max(...xs)) });

// Uses 35 deg C. Where every model gives under one such day a year in both periods, falls back to 30 deg C;
// where that is also under one day a year, reports `rare`.
export function buildOutlook(daily, models = MODELS, PAST_ = PAST, FUTURE_ = FUTURE) {
  const series = models.map((m) => daily[`temperature_2m_max_${m}`]).filter(Array.isArray);
  if (!series.length) return null;
  const periods = { past: PAST_, future: FUTURE_ };
  for (const threshold of [35, 30]) {
    const past = series.map((v) => hotDaysPerYear(daily.time, v, threshold, ...PAST_)).filter((x) => x != null);
    const future = series.map((v) => hotDaysPerYear(daily.time, v, threshold, ...FUTURE_)).filter((x) => x != null);
    if (!past.length || !future.length) return null;
    if ([...past, ...future].some((x) => x >= 1)) return { threshold, models: series.length, periods, past: span(past), future: span(future), rare: false };
  }
  return { threshold: 30, models: series.length, periods, rare: true };
}

// Joins the two decade responses into one { time, temperature_2m_max_<model>... } object.
export function joinDaily(a, b) {
  const out = {};
  for (const k of Object.keys(a)) out[k] = [...a[k], ...(b[k] ?? [])];
  return out;
}

const cache = new Map();
const MAX_LOCATIONS = 200;

// The same count from a record of what already happened: one series, two past decades.
export function buildObserved(daily) {
  const out = buildOutlook({ time: daily.time, temperature_2m_max_record: daily.temperature_2m_max }, ['record'], ...OBSERVED);
  return out && { ...out, source: 'observed' };
}

let pausedUntil = 0;

export async function getOutlook(lat, lon) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  let out = cache.get(key) ?? load('outlook', key);
  // After a failure, leave the Climate API alone for 10 minutes (same reason as in lib/climate.mjs).
  if (!out && Date.now() >= pausedUntil) {
    try {
      const url = ([from, to]) => `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&start_date=${from}-01-01&end_date=${to}-12-31&models=${MODELS.join(',')}&daily=temperature_2m_max`;
      const [a, b] = await Promise.all([getJson(url(PAST), true, 25000), getJson(url(FUTURE), true, 25000)]);
      out = buildOutlook(joinDaily(a.daily, b.daily));
      if (!out) throw new Error('No climate projection data for this location');
      save('outlook', key, out);
    } catch (e) {
      pausedUntil = Date.now() + 10 * 60_000;
      console.error('outlook: climate models unavailable, using NASA POWER record:', e.message);
    }
  }
  // The look back is kept on disk only, so the projection replaces it as soon as it can be fetched.
  if (!out) {
    let seen = load('observed', key);
    if (!seen) {
      seen = buildObserved(await powerDaily(lat, lon));
      if (!seen) throw new Error('No long temperature record for this location');
      save('observed', key, seen);
    }
    return seen;
  }
  if (!cache.has(key)) {
    if (cache.size >= MAX_LOCATIONS) cache.delete(cache.keys().next().value);
    cache.set(key, out);
  }
  return out;
}
