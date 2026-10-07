// Flesch-Kincaid grade level for English text. Used only in the evaluation, to check the grade 8 target that
// MacKay et al. (2026) found AI-written heat messages did not meet. Not valid for Indonesian.
// ponytail: syllables are counted with a vowel-group heuristic, good to about one syllable per long word.
// Use a pronunciation dictionary if the metric ever decides anything by a narrow margin.

export function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  let n = (w.match(/[aeiouy]+/g) ?? []).length;
  if (n > 1 && /[^aeiouyl]e$/.test(w)) n--; // silent final e: "shade", "close"; not "little", "free"
  return Math.max(1, n);
}

// Numbers, units and symbols are ignored: the grade describes the words a person has to read.
export function fleschKincaid(text) {
  const words = text.replace(/°\s?[CF]\b/g, ' ').match(/[A-Za-z][A-Za-z'’-]*/g) ?? [];
  if (!words.length) return null;
  const sentences = Math.max(1, (text.match(/[.!?]+(?=\s|$)/g) ?? []).length);
  const syl = words.reduce((s, w) => s + syllables(w), 0);
  return 0.39 * (words.length / sentences) + 11.8 * (syl / words.length) - 15.59;
}
