const MODEL = process.env.MISTRAL_MODEL || 'open-mistral-nemo';

// `serious` = the facts this household must be briefed on (chosen by rules, not by the model).
// The model is asked for one thing only: a short action per hazard. It is told not to write numbers, and
// the evidence sentence shown beside each action is built from the data (lib/notice.mjs), not by the model.
const DAY_ID = { today: 'hari ini', tomorrow: 'besok', 'the day after tomorrow': 'lusa' };

function prompt(facts, serious, profile, lang) {
  const when = (f) => (lang === 'id' ? DAY_ID[f.day] : f.day);
  const row = (f) => `${f.hazard} | ${when(f)} | ${f.metric} = ${f.value} ${f.unit} | level: ${f.level}`;
  const hazards = [...new Set(serious.map((f) => f.hazard))];
  return `You help one household prepare for the next three days. For each hazard listed, write one short action.

Output JSON only:
{"claims":[{"hazard":"<one of: ${hazards.join(', ')}>","advice":"<one short, concrete action for this household>"}]}

Rules:
- Write exactly ${hazards.length} claim(s), one for each of these hazards and no others: ${hazards.join(', ')}.
- "advice": short everyday words a 12-year-old knows, at most 14 words, one action. Prefer words of one or two syllables (say "often", not "regularly"; "breathing", not "respiratory"; "drink water", not "stay hydrated").
- Never write a number, a temperature, a clock time, a dose, a brand name or a diagnosis. The numbers are shown to the reader separately.
- Match the action to the level: only when the level is danger, extreme danger, unhealthy, very unhealthy, hazardous, or extreme may you tell people to stay indoors or inside. At every other level, never use the words indoors or inside; suggest shade, water, rest, lighter activity, or protection instead.
- If a hazard is worse on one day than on the others, you may say which day in words (today, tomorrow).
- Tailor the advice to this household: ${profile.length ? profile.join(', ') : 'general adults'}.
- Write the advice in ${lang === 'id' ? 'Indonesian' : 'English'}.

FORECAST (for your understanding; do not copy numbers from it):
${serious.map(row).join('\n')}`;
}

export const askModel = (facts, serious, profile, lang) => chat(prompt(facts, serious, profile, lang));

// The one place that talks to the model. Sends one user message, expects one JSON object back.
export async function chat(content, timeoutMs = 40000) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('MISTRAL_API_KEY is not set');
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content }],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) throw new Error(`Mistral returned HTTP ${r.status}`);
  const text = (await r.json()).choices?.[0]?.message?.content ?? '';
  try {
    const j = JSON.parse(text);
    return Array.isArray(j) ? j[0] : j; // the model sometimes wraps the object in a one-element array
  } catch {
    throw new Error('Model returned invalid JSON');
  }
}

export { MODEL };
