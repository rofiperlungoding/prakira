// Second source for long records: NASA POWER daily maximum air temperature at 2 m (MERRA-2 reanalysis,
// grid about 0.5 x 0.625 deg, days in local solar time). Free, no key. Used when Open-Meteo's archive or
// climate API is unavailable, most often because its free daily limit is reached.
// https://power.larc.nasa.gov/docs/services/api/temporal/daily/ (checked with a live call on 2026-10-08).
// Limit, to be shown with any result: the grid is coarser than ERA5, so a city centre reads cooler here.
import { getJson } from './facts.mjs';

export const POWER_YEARS = [1991, 2020];

// POWER answers { properties: { parameter: { T2M_MAX: { "19910101": 28.18, ... } } } } and marks missing
// days with -999. Returns the same shape as an Open-Meteo daily block.
export function fromPower(j) {
  const days = j?.properties?.parameter?.T2M_MAX;
  if (!days || typeof days !== 'object') throw new Error('NASA POWER returned no temperature data');
  const time = [];
  const temperature_2m_max = [];
  for (const [k, v] of Object.entries(days)) {
    if (!/^\d{8}$/.test(k)) continue;
    time.push(`${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`);
    temperature_2m_max.push(typeof v === 'number' && v > -900 ? v : null);
  }
  if (!temperature_2m_max.some((v) => v != null)) throw new Error('NASA POWER returned no temperature data');
  return { time, temperature_2m_max };
}

export async function powerDaily(lat, lon) {
  const [from, to] = POWER_YEARS;
  return fromPower(await getJson(`https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX&community=RE&longitude=${lon}&latitude=${lat}&start=${from}0101&end=${to}1231&format=JSON`, true, 20000));
}
