// Deterministic layer: fetch forecast + air quality, compute facts and hazard levels.
// The LLM never sets a level; it can only cite facts produced here.

const BANDS = {
  // Apparent temperature, deg C. Cut points follow the NWS heat-index bands (80/90/103/125 F).
  heat: [[27, 'low'], [32, 'caution'], [41, 'extreme caution'], [54, 'danger'], [Infinity, 'extreme danger']],
  // Daily rainfall, mm/day. BMKG classes.
  rain: [[5, 'minimal'], [20, 'light'], [50, 'moderate'], [100, 'heavy'], [Infinity, 'very heavy']],
  // US AQI. EPA bands.
  aqi: [[50, 'good'], [100, 'moderate'], [150, 'unhealthy for sensitive groups'], [200, 'unhealthy'], [300, 'very unhealthy'], [Infinity, 'hazardous']],
  // UV index. WHO bands.
  uv: [[2.99, 'low'], [5.99, 'moderate'], [7.99, 'high'], [10.99, 'very high'], [Infinity, 'extreme']],
};

export function level(hazard, value) {
  const bands = BANDS[hazard];
  const i = bands.findIndex(([max]) => value <= max);
  return { severity: i, level: bands[i][1] };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const REL = ['today', 'tomorrow', 'the day after tomorrow'];

// One retry on network failure only (not on HTTP errors).
async function getJson(url, retry = true) {
  let r;
  try {
    r = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (e) {
    if (retry) return getJson(url, false);
    throw new Error(`Upstream ${new URL(url).host} unreachable: ${e.cause?.code ?? e.message}`);
  }
  if (!r.ok) throw new Error(`Upstream ${new URL(url).host} returned HTTP ${r.status}`);
  return r.json();
}

export async function geocode(q) {
  const j = await getJson(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&name=${encodeURIComponent(q)}`);
  return (j.results ?? []).map((p) => ({ name: p.name, admin: p.admin1 ?? '', country: p.country ?? '', lat: p.latitude, lon: p.longitude }));
}

export function buildFacts(fc, aq) {
  const d = fc.daily;
  const facts = [];
  const days = Math.min(3, d.time.length);
  for (let i = 0; i < days; i++) {
    const date = d.time[i];
    const base = { date, day: REL[i], weekday: WEEKDAYS[new Date(date + 'T00:00:00Z').getUTCDay()] };
    const heat = d.apparent_temperature_max[i];
    const rain = d.precipitation_sum[i];
    const uv = d.uv_index_max[i];
    const aqiVals = aq.hourly.us_aqi.filter((v, k) => v != null && aq.hourly.time[k].startsWith(date));
    const pmVals = aq.hourly.pm2_5.filter((v, k) => v != null && aq.hourly.time[k].startsWith(date));
    if (heat != null) facts.push({ ...base, id: `heat-${i}`, hazard: 'heat', metric: 'peak apparent temperature', value: heat, unit: '°C', ...level('heat', heat) });
    if (rain != null) facts.push({ ...base, id: `rain-${i}`, hazard: 'rain', metric: 'total rainfall', value: rain, unit: 'mm', ...level('rain', rain) });
    if (d.precipitation_probability_max[i] != null) facts.push({ ...base, id: `rainprob-${i}`, hazard: 'rain', metric: 'peak rain probability', value: d.precipitation_probability_max[i], unit: '%', severity: 0, level: 'n/a' });
    if (aqiVals.length) {
      const a = Math.max(...aqiVals);
      facts.push({ ...base, id: `aqi-${i}`, hazard: 'air', metric: 'peak US AQI', value: a, unit: '', ...level('aqi', a) });
    }
    if (pmVals.length) facts.push({ ...base, id: `pm25-${i}`, hazard: 'air', metric: 'peak PM2.5', value: Math.max(...pmVals), unit: 'µg/m³', severity: 0, level: 'n/a' });
    if (uv != null) facts.push({ ...base, id: `uv-${i}`, hazard: 'uv', metric: 'peak UV index', value: uv, unit: '', ...level('uv', uv) });
  }
  return facts;
}

export async function getFacts(lat, lon) {
  const c = `latitude=${lat}&longitude=${lon}&timezone=auto`;
  const warnings = [];
  // Air quality is optional: if only that API fails, keep heat/rain/UV and say so.
  const [fc, aq] = await Promise.all([
    getJson(`https://api.open-meteo.com/v1/forecast?${c}&forecast_days=3&daily=apparent_temperature_max,precipitation_sum,precipitation_probability_max,uv_index_max`),
    getJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${c}&forecast_days=3&hourly=pm2_5,us_aqi`).catch((e) => {
      warnings.push(`Air quality unavailable: ${e.message}`);
      return { hourly: { time: [], us_aqi: [], pm2_5: [] } };
    }),
  ]);
  const facts = buildFacts(fc, aq);
  if (!facts.length) throw new Error('No forecast data returned for this location');
  return { facts, warnings };
}
