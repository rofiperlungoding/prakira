const MODEL = process.env.MISTRAL_MODEL || 'open-mistral-nemo';

// `serious` = the facts this household must be briefed on (chosen by rules, not by the model).
function prompt(facts, serious, profile, lang) {
  const row = (f) => `${f.id} | ${f.hazard} | ${f.day} (${f.weekday}) | ${f.metric} = ${f.value} ${f.unit} | level: ${f.level}`;
  const hazards = [...new Set(serious.map((f) => f.hazard))];
  // Most severe first, so the first fact_id carries the level the claim must state.
  const required = (h) => serious.filter((f) => f.hazard === h).sort((a, b) => b.severity - a.severity || b.value - a.value).map((f) => f.id);
  return `You write a short climate-preparedness briefing for one household, from FACTS only.

Output JSON only:
{"claims":[{"fact_ids":["heat-0","heat-1"],"level":"<level of the FIRST fact_id, copied exactly>","evidence":"<one short sentence saying what is forecast, with the cited numbers and units>","advice":"<one short, concrete action for this household>"}]}

Rules:
- Write exactly ${hazards.length} claim(s), one per hazard, with fact_ids starting exactly like this:
${hazards.map((h) => `  ${h}: ${JSON.stringify(required(h))}`).join('\n')}
- You may add CONTEXT facts of the same hazard after those ids. Never mix hazards in one claim. Mention every cited day in the evidence.
- "evidence": only numbers copied from the cited facts. No dates. Say today, tomorrow, or the weekday.
- "advice": plain words a 12-year-old understands, at most 20 words, one action. No numbers, no clock times, no doses, no brand names, no diagnosis. Match the action to the level: only when the level is danger, extreme danger, unhealthy, very unhealthy, hazardous, or extreme may you tell people to stay indoors or inside. At every other level, never use the words indoors or inside; suggest shade, water, rest, lighter activity, or protection instead.
- Tailor the advice to this household: ${profile.length ? profile.join(', ') : 'general adults'}.
- Write evidence and advice in ${lang === 'id' ? 'Indonesian' : 'English'}. Keep "level" in English exactly as given.

MUST COVER:
${serious.map(row).join('\n')}

CONTEXT (other facts, for reference):
${facts.filter((f) => !serious.includes(f)).map(row).join('\n')}`;
}

export async function askModel(facts, serious, profile, lang) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('MISTRAL_API_KEY is not set');
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt(facts, serious, profile, lang) }],
    }),
    signal: AbortSignal.timeout(40000),
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
