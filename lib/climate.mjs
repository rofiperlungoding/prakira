// Climate context: how the forecast daily maximum compares with the local 1991-2020 average for the same
// week of the year. Source: Open-Meteo historical archive (ERA5-based reanalysis).
// Limits, to be stated wherever this is shown: the forecast and the archive come from different models, so
// part of any difference is model bias; the grid cell is coarse; this is context, not a health indicator.
import { getJson } from './facts.mjs';
import { load, save } from './store.mjs';

const md = (d) => d.toISOString().slice(5, 10);

// Sum and count of the archive value for each calendar day (MM-DD) over all years.
export function byCalendarDay(daily) {
  const m = new Map();
  for (let i = 0; i < daily.time.length; i++) {
    const v = daily.temperature_2m_max[i];
    if (v == null) continue;
    const k = daily.time[i].slice(5);
    const e = m.get(k) ?? [0, 0];
    e[0] += v; e[1] += 1;
    m.set(k, e);
  }
  return m;
}

// Mean over all years of the 7 calendar days centred on `date` (YYYY-MM-DD). Null when there is no data.
export function normalFor(calendar, date) {
  const base = new Date(date + 'T00:00:00Z');
  let sum = 0, n = 0;
  for (let k = -3; k <= 3; k++) {
    const e = calendar.get(md(new Date(base.getTime() + k * 86400000)));
    if (e) { sum += e[0]; n += e[1]; }
  }
  return n ? sum / n : null;
}

export function buildContext(calendar, tmax) {
  return tmax.flatMap(({ date, value }) => {
    const normal = normalFor(calendar, date);
    if (value == null || normal == null) return [];
    return [{ date, forecast: Math.round(value), normal: Math.round(normal), anomaly: Math.round(value - normal) }];
  });
}

// In memory first (capped), then on disk (lib/store.mjs), then the network. One 30-year request counts as
// many calls against Open-Meteo's daily limit, so a place is fetched once and kept.
const cache = new Map();
const MAX_LOCATIONS = 50;

export async function getContext(lat, lon, tmax) {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`;
  let calendar = cache.get(key);
  if (!calendar) {
    const saved = load('normal', key);
    if (saved) calendar = new Map(saved);
  }
  if (!calendar) {
    const j = await getJson(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=1991-01-01&end_date=2020-12-31&daily=temperature_2m_max&timezone=auto`);
    calendar = byCalendarDay(j.daily);
    save('normal', key, [...calendar]);
  }
  if (!cache.has(key)) {
    if (cache.size >= MAX_LOCATIONS) cache.delete(cache.keys().next().value);
    cache.set(key, calendar);
  }
  return buildContext(calendar, tmax);
}
