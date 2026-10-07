// Standard notices: fixed-template text for any serious hazard that no verified model claim covers.
// Deterministic, so a serious hazard is never silently missing from a briefing.
import { SERIOUS } from './facts.mjs';

const T = {
  en: {
    day: { today: 'today', tomorrow: 'tomorrow', 'the day after tomorrow': 'the day after tomorrow' },
    metric: { heat: 'The heat index peaks at', rain: 'Total rainfall is forecast at', air: 'The US AQI peaks at', uv: 'The UV index peaks at' },
    advice: {
      heat: 'Follow your local heat guidance and check on people at risk.',
      rain: 'Follow official warnings from your meteorological service.',
      air: 'Follow your local air-quality guidance.',
      uv: 'Use sun protection around midday.',
    },
    level: (l) => l,
  },
  id: {
    day: { today: 'hari ini', tomorrow: 'besok', 'the day after tomorrow': 'lusa' },
    metric: { heat: 'Indeks panas memuncak di', rain: 'Curah hujan total diprakirakan', air: 'AQI AS memuncak di', uv: 'Indeks UV memuncak di' },
    advice: {
      heat: 'Ikuti panduan cuaca panas setempat dan periksa keadaan orang yang rentan.',
      rain: 'Ikuti peringatan resmi dari BMKG atau badan meteorologi setempat.',
      air: 'Ikuti panduan kualitas udara setempat.',
      uv: 'Gunakan pelindung matahari di sekitar tengah hari.',
    },
    level: (l) => ({
      'extreme caution': 'sangat waspada', danger: 'bahaya', 'extreme danger': 'sangat berbahaya',
      heavy: 'lebat', 'very heavy': 'sangat lebat', extreme: 'ekstrem',
      'unhealthy for sensitive groups': 'tidak sehat bagi kelompok sensitif', unhealthy: 'tidak sehat', 'very unhealthy': 'sangat tidak sehat', hazardous: 'berbahaya',
      'extra protection needed': 'perlu perlindungan ekstra',
    }[l] ?? l),
  },
};

export const isSerious = (f) => f.level !== 'n/a' && f.severity >= (SERIOUS[f.hazard] ?? Infinity);

// Serious facts that no verified claim cites as its first fact.
export function uncovered(facts, claims) {
  const first = new Set(claims.map((c) => c.fact_ids[0]));
  return facts.filter((f) => isSerious(f) && !first.has(f.id));
}

export function buildNotice(f, lang) {
  const t = T[lang] ?? T.en;
  return {
    kind: 'notice',
    fact_ids: [f.id],
    level: f.level,
    evidence: `${t.metric[f.hazard]} ${f.value}${f.unit ? ' ' + f.unit : ''} ${t.day[f.day]} (${t.level(f.level)}).`,
    advice: t.advice[f.hazard],
  };
}
