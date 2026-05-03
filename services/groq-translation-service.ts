import 'server-only';
import Groq from 'groq-sdk';

/**
 * Groq-backed translation service — the sole translation provider.
 *
 * Why Groq (and not Groq / HuggingFace):
 *   - Groq free tier: 20 RPD on `Groq-2.5-flash-lite` — too low for cron.
 *   - HuggingFace free tier: shrinking credits + translation models destroy
 *     embedded HTML tags.
 *   - Groq free tier on `llama-3.3-70b-versatile`: ~14,400 RPD, 30 RPM.
 *     720× the headroom, comparable quality for movie synopses, preserves
 *     HTML naturally because it's a general-purpose LLM not a specialized
 *     translation model.
 *
 * Hot-swap models via `GROQ_MODEL` env var. Check the Groq dashboard for
 * current free-tier model availability before switching.
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

if (!GROQ_API_KEY) {
  console.warn('[groq-translation-service] GROQ_API_KEY is not set — translation calls will throw');
}

const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

const LOCALE_LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
};

export interface BatchTranslationItem {
  id: string;
  content: string;
}

/**
 * Translate multiple movie synopses in ONE Groq request via JSON output mode.
 *
 * Groq supports OpenAI-style `response_format: { type: 'json_object' }` which
 * forces the model to emit valid JSON. We wrap the array in an object key
 * because strict JSON-mode requires an object root.
 */
export async function translateMovieContentsBatch(
  items: BatchTranslationItem[],
  targetLocale: string
): Promise<Map<string, string>> {
  if (!groq) {
    throw new Error('Groq client not initialized — check GROQ_API_KEY');
  }
  if (items.length === 0) return new Map();

  const targetLanguage = LOCALE_LANGUAGE_NAMES[targetLocale];
  if (!targetLanguage) {
    throw new Error(`Unsupported translation target: ${targetLocale}`);
  }

  const inputJson = JSON.stringify(items.map((it) => ({ id: it.id, content: it.content })));

  const systemPrompt = `You translate Vietnamese movie synopses to ${targetLanguage}.
Rules:
- Output ONLY a JSON object: {"results": [{"id": "<id>", "content": "<translated>"}, ...]}.
- Translate naturally, like a real movie description.
- PRESERVE all HTML tags exactly (<p>, <br>, <strong>, etc.). Translate only text inside tags.
- Keep proper nouns (character / place names) as-is unless there is a widely-known ${targetLanguage} equivalent.
- Return entries in the SAME order as input. Include every input id; do not drop any.`;

  const userPrompt = `Input array:\n${inputJson}`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? '';
  if (!text) {
    throw new Error('Groq returned empty completion');
  }

  let parsed: { results?: Array<{ id?: string; content?: string }> };
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Groq JSON parse failed: ${(err as Error).message}`);
  }

  const results = parsed?.results;
  if (!Array.isArray(results)) {
    throw new Error('Groq response missing `results` array');
  }

  const out = new Map<string, string>();
  for (const entry of results) {
    if (entry?.id && typeof entry.content === 'string') {
      out.set(entry.id, entry.content.trim());
    }
  }
  return out;
}

/**
 * Convenience wrapper for translating a single movie's content.
 * Routes through the batch function with a single-item array — keeps the
 * codebase to one prompt template and one output-shape contract.
 */
export async function translateMovieContent(
  movieId: string,
  content: string,
  targetLocale: string
): Promise<string> {
  const map = await translateMovieContentsBatch([{ id: movieId, content }], targetLocale);
  const out = map.get(movieId);
  if (!out) {
    throw new Error('Groq returned no content for single-item translation');
  }
  return out;
}
