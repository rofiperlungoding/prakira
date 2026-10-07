// Standard notices: fixed-template text for any serious hazard that no verified model claim covers.
// Deterministic, so a serious hazard is never silently missing from a briefing.
import { isSerious } from './facts.mjs';

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
    num: (v) => String(v),
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
      caution: 'waspada', 'extreme caution': 'sangat waspada', danger: 'bahaya', 'extreme danger': 'sangat berbahaya',
      moderate: 'sedang', heavy: 'lebat', 'very heavy': 'sangat lebat', extreme: 'ekstrem',
      'unhealthy for sensitive groups': 'tidak sehat bagi kelompok sensitif', unhealthy: 'tidak sehat', 'very unhealthy': 'sangat tidak sehat', hazardous: 'berbahaya',
      'protection needed': 'perlu perlindungan', 'extra protection needed': 'perlu perlindungan ekstra',
    }[l] ?? l),
    num: (v) => String(v).replace('.', ','), // Indonesian decimal comma
  },
};

// Serious facts that no verified claim cites (in any position).
export function uncovered(facts, claims, th) {
  const cited = new Set(claims.flatMap((c) => c.fact_ids));
  return facts.filter((f) => isSerious(f, th) && !cited.has(f.id));
}

// One notice per hazard: it describes the worst uncovered day and cites every uncovered day of that hazard.
export function buildNotices(facts, claims, th, lang) {
  const t = T[lang] ?? T.en;
  const byHazard = new Map();
  for (const f of uncovered(facts, claims, th)) byHazard.set(f.hazard, [...(byHazard.get(f.hazard) ?? []), f]);
  return [...byHazard.values()].map((group) => {
    group.sort((a, b) => b.severity - a.severity || b.value - a.value);
    const f = group[0];
    return {
      kind: 'notice',
      fact_ids: group.map((x) => x.id),
      level: f.level,
      evidence: `${t.metric[f.hazard]} ${t.num(f.value)}${f.unit ? ' ' + f.unit : ''} ${t.day[f.day]} (${t.level(f.level)}).`,
      advice: t.advice[f.hazard],
    };
  });
}
