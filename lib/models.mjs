// Do two forecast models agree? Compares air temperature from ECMWF's physics model (IFS, 0.25 deg) and
// ECMWF's machine-learning model (AIFS Single, 0.25 deg), both served by Open-Meteo. Shown as a plain
// measure of forecast uncertainty: when two independent models differ, confidence in either is lower.
// It does not say which model is right, and the two are never blended.
// Identifiers checked with a live call on 2026-10-08: `ecmwf_aifs025_single` returns values;
// `ecmwf_aifs025` returns only nulls.
import { getJson } from './facts.mjs';

export const PHYSICS = 'ecmwf_ifs025';
export const AI = 'ecmwf_aifs025_single';

// AIFS produces a value every 6 hours (00, 06, 12, 18 UTC); Open-Meteo fills the hours in between by
// interpolation. Only the native 6-hourly steps are compared, so interpolation is not mistaken for agreement.
// `times` are UTC ("2026-10-08T06:00"). Returns, for each local date asked for, the largest difference in
// deg C at a shared step, and how many steps were compared.
export function agreement(times, a, b, utcOffsetSeconds, dates) {
  const byDate = new Map(dates.map((d) => [d, { date: d, diff: null, steps: 0 }]));
  for (let i = 0; i < times.length; i++) {
    if (a[i] == null || b[i] == null) continue;
    const utc = new Date(times[i] + ':00Z');
    if (utc.getUTCHours() % 6 !== 0 || utc.getUTCMinutes() !== 0) continue;
    const local = new Date(utc.getTime() + utcOffsetSeconds * 1000).toISOString().slice(0, 10);
    const e = byDate.get(local);
    if (!e) continue;
    const d = Math.abs(a[i] - b[i]);
    e.steps++;
    if (e.diff == null || d > e.diff) e.diff = d;
  }
  return [...byDate.values()].filter((e) => e.steps > 0).map((e) => ({ ...e, diff: Math.round(e.diff * 10) / 10, label: label(e.diff) }));
}

// Cut points are this project's choice, not a standard: up to 1 deg C "agree", up to 3 "differ somewhat".
export function label(diff) {
  return diff <= 1 ? 'agree' : diff <= 3 ? 'differ somewhat' : 'differ';
}

export async function getAgreement(lat, lon, utcOffsetSeconds, dates) {
  // Four days in UTC cover three local days in any time zone. A small request: it does not threaten the quota.
  const j = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=GMT&forecast_days=4&models=${PHYSICS},${AI}&hourly=temperature_2m`, false, 8000);
  const out = agreement(j.hourly.time, j.hourly[`temperature_2m_${PHYSICS}`] ?? [], j.hourly[`temperature_2m_${AI}`] ?? [], utcOffsetSeconds, dates);
  if (!out.length) throw new Error('the two models returned no shared time steps');
  return out;
}
