// Deterministic layer: fetch forecast + air quality, compute facts and hazard levels.
// The LLM never sets a level; it can only cite facts produced here.
// Every band below names its source and the date it was checked.

// NWS heat index. Formula and adjustments: https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
// (checked 2026-10-07). Inputs: air temperature in deg F, relative humidity in %.
export function heatIndexF(t, rh) {
  const simple = 0.5 * (t + 61 + (t - 68) * 1.2 + rh * 0.094);
  if ((simple + t) / 2 < 80) return (simple + t) / 2;
  let hi = -42.379 + 2.04901523 * t + 10.14333127 * rh - 0.22475541 * t * rh - 0.00683783 * t * t
    - 0.05481717 * rh * rh + 0.00122874 * t * t * rh + 0.00085282 * t * rh * rh - 0.00000199 * t * t * rh * rh;
  if (rh < 13 && t >= 80 && t <= 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(t - 95)) / 17);
  else if (rh > 85 && t >= 80 && t <= 87) hi += ((rh - 85) / 10) * ((87 - t) / 5);
  return hi;
}

const toF = (c) => (c * 9) / 5 + 32;
const toC = (f) => ((f - 32) * 5) / 9;
const round1 = (x) => Math.round(x * 10) / 10;

// Upper bound (inclusive) of each band, then its name. Index in the list = severity.
const BANDS = {
  // Heat index in whole deg F. NWS categories: Caution 80-90, Extreme Caution 90-103, Danger 103-124,
  // Extreme Danger 125+. https://www.weather.gov/ama/heatindex (checked 2026-10-07).
  heat: [[79, 'low'], [89, 'caution'], [102, 'extreme caution'], [124, 'danger'], [Infinity, 'extreme danger']],
  // Daily rainfall, mm/day. World Meteorological Organization (WMO-No. 1150 / WMO-No. 8)
  // daily precipitation intensity hazard tiers: light to 20, moderate to 50, heavy to 100,
  // very heavy to 150, extreme above 150 mm/day. Rain amount is not a flood forecast.
  rain: [[0.99, 'little or no rain'], [19.99, 'light'], [49.99, 'moderate'], [99.99, 'heavy'], [149.99, 'very heavy'], [Infinity, 'extreme']],
  // US AQI categories. https://www.airnow.gov/aqi/aqi-basics/ (checked 2026-10-07).
  aqi: [[50, 'good'], [100, 'moderate'], [150, 'unhealthy for sensitive groups'], [200, 'unhealthy'], [300, 'very unhealthy'], [Infinity, 'hazardous']],
  // UV index, rounded to a whole number first. WHO action tiers: 0-2, 3-7, 8 and above.
  // https://www.who.int/news-room/questions-and-answers/item/radiation-the-ultraviolet-(uv)-index (checked 2026-10-07).
  uv: [[2, 'low'], [7, 'protection needed'], [Infinity, 'extra protection needed']],
};

// A fact is "serious" for a household when its severity reaches the threshold for its hazard. Only serious
// facts get advice; everything else is shown in the data strip without a call to action (avoids over-warning).
// Base thresholds: heat extreme caution, rain heavy, air unhealthy for sensitive groups, UV extra protection.
// Profile adjustments are this project's judgement, based on the wording of the source categories:
// NWS "caution" (fatigue possible with prolonged exposure or activity) and EPA "moderate" (risk for people
// unusually sensitive to air pollution). They are not an official rule.
export function thresholds(profile = []) {
  const has = (...p) => p.some((x) => profile.includes(x));
  return {
    heat: has('older_adult', 'young_child', 'pregnant', 'outdoor_worker', 'no_air_conditioning') ? 1 : 2,
    rain: has('flood_prone_home') ? 2 : 3,
    air: has('respiratory_condition') ? 1 : 2,
    uv: has('outdoor_worker', 'young_child') ? 1 : 2,
  };
}

export const isSerious = (fact, th) => fact.level !== 'n/a' && fact.severity >= (th[fact.hazard] ?? Infinity);

export function level(hazard, value) {
  const bands = BANDS[hazard];
  const i = bands.findIndex(([max]) => value <= max);
  return { severity: i, level: bands[i][1] };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const REL = ['today', 'tomorrow', 'the day after tomorrow'];

// One retry on network failure only (not on HTTP errors).
export async function getJson(url, retry = true, timeoutMs = 10000) {
  let r;
  try {
    r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    if (retry) return getJson(url, false, timeoutMs);
    throw new Error(`Upstream ${new URL(url).host} unreachable: ${e.cause?.code ?? e.message}`);
  }
  if (!r.ok) throw new Error(`Upstream ${new URL(url).host} returned HTTP ${r.status}`);
  return r.json();
}

export async function geocode(q) {
  const j = await getJson(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=${encodeURIComponent(q)}`);
  return (j.results ?? []).map((p) => ({ name: p.name, admin: p.admin1 ?? '', country: p.country ?? '', lat: p.latitude, lon: p.longitude }));
}

// Highest hourly value on `date` of fn(hourIndex), skipping hours with missing data.
// Returns { value, time } where time is the local hour ("14:00") of the first maximum, or null without data.
function dayMax(times, date, fn) {
  let best = null;
  for (let k = 0; k < times.length; k++) {
    if (!times[k].startsWith(date)) continue;
    const v = fn(k);
    if (v != null && !Number.isNaN(v) && (best == null || v > best.value)) best = { value: v, time: times[k].slice(11, 16) };
  }
  return best;
}

export function buildFacts(fc, aq) {
  const d = fc.daily;
  const h = fc.hourly;
  const facts = [];
  const days = Math.min(3, d.time.length);
  for (let i = 0; i < days; i++) {
    const date = d.time[i];
    const base = { date, day: REL[i], weekday: WEEKDAYS[new Date(date + 'T00:00:00Z').getUTCDay()] };

    const hiF = dayMax(h.time, date, (k) => (h.temperature_2m[k] == null || h.relative_humidity_2m[k] == null ? null : heatIndexF(toF(h.temperature_2m[k]), h.relative_humidity_2m[k])));
    if (hiF != null) facts.push({ ...base, id: `heat-${i}`, hazard: 'heat', metric: 'peak heat index', value: round1(toC(hiF.value)), unit: '°C', peak: hiF.time, ...level('heat', Math.round(hiF.value)) });

    const rain = d.precipitation_sum[i];
    if (rain != null) facts.push({ ...base, id: `rain-${i}`, hazard: 'rain', metric: 'total rainfall', value: rain, unit: 'mm', ...level('rain', rain) });
    const prob = d.precipitation_probability_max[i];
    if (prob != null) facts.push({ ...base, id: `rainprob-${i}`, hazard: 'rain', metric: 'peak rain probability', value: prob, unit: '%', severity: 0, level: 'n/a' });

    // Open-Meteo us_aqi already uses the EPA averaging periods (24 h rolling for PM). We show the day's highest value.
    // No peak time for air: the index is built from rolling averages, so the hour of its maximum is not the
    // hour of the worst air.
    const aqi = dayMax(aq.hourly.time, date, (k) => aq.hourly.us_aqi[k]);
    if (aqi != null) facts.push({ ...base, id: `aqi-${i}`, hazard: 'air', metric: 'peak US AQI', value: aqi.value, unit: '', ...level('aqi', aqi.value) });
    const pm = dayMax(aq.hourly.time, date, (k) => aq.hourly.pm2_5[k]);
    if (pm != null) facts.push({ ...base, id: `pm25-${i}`, hazard: 'air', metric: 'peak PM2.5', value: pm.value, unit: 'µg/m³', severity: 0, level: 'n/a' });

    if (d.uv_index_max[i] != null) {
      const uv = Math.round(d.uv_index_max[i]);
      // The value is the daily maximum; the hourly series (when present) only supplies the time of the peak.
      const uvPeak = h.uv_index ? dayMax(h.time, date, (k) => h.uv_index[k]) : null;
      facts.push({ ...base, id: `uv-${i}`, hazard: 'uv', metric: 'peak UV index', value: uv, unit: '', ...(uvPeak && uvPeak.value > 0 ? { peak: uvPeak.time } : {}), ...level('uv', uv) });
    }
  }
  return facts;
}

export async function getFacts(lat, lon) {
  const c = `latitude=${lat}&longitude=${lon}&timezone=auto`;
  const warnings = [];
  // Air quality is optional: if only that API fails, keep heat/rain/UV and say so.
  const [fc, aq] = await Promise.all([
    getJson(`https://api.open-meteo.com/v1/forecast?${c}&forecast_days=3&daily=temperature_2m_max,precipitation_sum,precipitation_probability_max,uv_index_max&hourly=temperature_2m,relative_humidity_2m,uv_index`),
    getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${c}&forecast_days=3&hourly=pm2_5,us_aqi`).catch((e) => {
      warnings.push(`Air quality unavailable: ${e.message}`);
      return { hourly: { time: [], us_aqi: [], pm2_5: [] } };
    }),
  ]);
  const facts = buildFacts(fc, aq);
  if (!facts.length) throw new Error('No forecast data returned for this location');
  // Daily maximum air temperature, used only for the climate-context comparison (lib/climate.mjs).
  const tmax = fc.daily.time.slice(0, 3).map((date, i) => ({ date, value: fc.daily.temperature_2m_max?.[i] ?? null }));
  return { facts, warnings, tmax, utcOffset: fc.utc_offset_seconds ?? 0 };
}
