const MODEL = process.env.MISTRAL_MODEL || 'open-mistral-nemo';

function prompt(facts, profile, lang) {
  const table = facts.map((f) => `${f.id} | ${f.day} (${f.weekday}) | ${f.metric} = ${f.value} ${f.unit} | level: ${f.level}`).join('\n');
  return `You write a short personal climate-preparedness briefing from FACTS only.
Rules:
- Output JSON only: {"claims":[{"fact_ids":["heat-0"],"level":"<level of the FIRST fact_id, copied exactly>","evidence":"<one natural sentence saying what is forecast, with the cited numbers and units>","advice":"<one concrete action for this person>"}]}
- 4 to 8 claims. Focus on the highest-severity facts. Cover every hazard whose level is not low, good, light, or "little or no rain".
- "evidence" may contain only numbers copied from the cited facts. Never write dates. Refer to days as today, tomorrow, or by weekday.
- Facts with "level: n/a" may only appear in fact_ids after a leveled fact.
- Do not invent forecasts, places, or numbers. Do not give medical diagnosis.
- Write evidence and advice in ${lang === 'id' ? 'Indonesian' : 'English'}. Keep "level" in English exactly as given.
- Person profile (tailor the advice): ${profile.length ? profile.join(', ') : 'general adult'}.

FACTS:
${table}`;
}

export async function askModel(facts, profile, lang) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) throw new Error('MISTRAL_API_KEY is not set');
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt(facts, profile, lang) }],
    }),
    signal: AbortSignal.timeout(40000),
  });
  if (!r.ok) throw new Error(`Mistral returned HTTP ${r.status}`);
  const text = (await r.json()).choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Model returned invalid JSON');
  }
}

export { MODEL };
