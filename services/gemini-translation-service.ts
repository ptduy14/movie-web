import 'server-only';
import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';

/**
 * Gemini-backed text translation service.
 *
 * Why server-only:
 *   - The Gemini API key MUST never be sent to the client. The `'server-only'`
 *     import will throw at build time if any client component accidentally
 *     imports this file.
 *
 * Model choice:
 *   - `models/gemini-2.5-flash-lite` is the current free-tier replacement for the now-
 *     sunset `gemini-1.5-flash` (Google retired the 1.5 family on 2025-09-24).
 *     Free tier limits: 10 RPM / 250K TPM / 250 RPD as of writing.
 *   - For higher quality prose, `gemini-2.5-pro` can be swapped in (smaller
 *     free tier).
 *   - The model name is overridable via `GEMINI_MODEL` env var so we can hot-
 *     swap without code changes if Google rotates models again.
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash-lite';

if (!GEMINI_API_KEY) {
  // Fail loudly at module-load, not at first call, so misconfiguration
  // surfaces immediately during deploy.
  console.warn(
    '[gemini-translation-service] GEMINI_API_KEY is not set — translation calls will throw'
  );
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const model = genAI?.getGenerativeModel({ model: GEMINI_MODEL });

/**
 * Map the locale code to the human-readable target language used in the prompt.
 * Add new locales here when extending support.
 */
const LOCALE_LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
};

/**
 * Translate a movie description from Vietnamese to the target locale.
 *
 * Preserves embedded HTML tags (the OPhim `content` field commonly wraps
 * paragraphs in `<p>...</p>`). Returns the raw translated string so callers
 * can drop it back in place of the original.
 *
 * Throws on API failure — the orchestrator handles fallback to original.
 */
export async function translateMovieContent(
  content: string,
  targetLocale: string
): Promise<string> {
  if (!model) {
    throw new Error('Gemini model not initialized — check GEMINI_API_KEY');
  }

  const targetLanguage = LOCALE_LANGUAGE_NAMES[targetLocale];
  if (!targetLanguage) {
    throw new Error(`Unsupported translation target: ${targetLocale}`);
  }

  const prompt = `You are translating a movie synopsis from Vietnamese to ${targetLanguage}.

Rules:
- Translate the meaning faithfully and naturally — sound like a movie description, not a literal word-for-word translation.
- PRESERVE all HTML tags exactly as they appear in the input (<p>, <br>, <strong>, etc.). Translate only the text inside tags.
- Keep proper nouns (character names, place names) as-is unless there is a widely-known ${targetLanguage} equivalent.
- Do NOT add any introductions, explanations, or markdown wrappers (no "Here is the translation:", no triple backticks).
- Output ONLY the translated text, ready to be inserted directly into a webpage.

Vietnamese input:
${content}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Defensive: strip accidental markdown code fences if Gemini ignores the rule
  return text
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export interface BatchTranslationItem {
  id: string;
  content: string;
}

/**
 * JSON schema for Gemini's structured output mode. Forces the model to emit
 * a syntactically valid JSON array — no escape errors from HTML quotes,
 * Vietnamese diacritics, or stray newlines in `content`.
 *
 * Without this, Gemini's free-form JSON occasionally breaks on inputs like
 * `<p>"Andrew" Cooper</p>` because the inner double quotes aren't escaped.
 */
const BATCH_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      id: { type: SchemaType.STRING },
      content: { type: SchemaType.STRING },
    },
    required: ['id', 'content'],
  },
};

/**
 * Translate multiple movie synopses in a SINGLE Gemini request.
 *
 * Rationale:
 *   Free-tier Gemini limits are per-request (15 RPM). Translating 5 movies in
 *   parallel = 5 calls; in 1 batched prompt = 1 call. Same total tokens, 1/N
 *   the RPM consumption.
 *
 * Output reliability:
 *   We use Gemini's *structured output* mode (`responseMimeType: application/json`
 *   + `responseSchema`) so the model is forced to emit valid JSON. This was
 *   added after observing parse failures at ~position 8800 caused by
 *   unescaped quotes inside HTML-bearing translations.
 *
 * Robustness fallbacks:
 *   - On parse failure → throws so the caller can decide (fallback to original
 *     content, retry per-item, etc.).
 *   - Entries missing `id` or `content` are skipped silently — callers detect
 *     by comparing the returned map size to input size.
 */
export async function translateMovieContentsBatch(
  items: BatchTranslationItem[],
  targetLocale: string
): Promise<Map<string, string>> {
  if (!genAI) {
    throw new Error('Gemini model not initialized — check GEMINI_API_KEY');
  }
  if (items.length === 0) return new Map();

  const targetLanguage = LOCALE_LANGUAGE_NAMES[targetLocale];
  if (!targetLanguage) {
    throw new Error(`Unsupported translation target: ${targetLocale}`);
  }

  // Re-instantiate the model with structured-output config. Doing this per
  // call is cheap (no network) and lets the single-translation function above
  // keep its plain-text output mode.
  const structuredModel = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: BATCH_RESPONSE_SCHEMA,
    },
  });

  const inputJson = JSON.stringify(items.map((it) => ({ id: it.id, content: it.content })));

  const prompt = `You are translating multiple movie synopses from Vietnamese to ${targetLanguage}.

Input is a JSON array of {id, content}. For each entry, translate the "content" field while keeping the "id" field unchanged.

Rules:
- Translate naturally, like a movie description (not literal word-for-word).
- PRESERVE all HTML tags exactly (<p>, <br>, <strong>, etc.). Translate only the text inside tags.
- Keep proper nouns (character / place names) as-is unless there's a widely-known ${targetLanguage} equivalent.
- Return entries in the SAME order as input.

Input JSON:
${inputJson}`;

  const result = await structuredModel.generateContent(prompt);
  const text = result.response.text();

  let parsed: Array<{ id?: string; content?: string }>;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    // Should not happen with responseSchema, but stay defensive
    throw new Error(
      `Gemini structured-output JSON was unparseable: ${(err as Error).message}`
    );
  }
  if (!Array.isArray(parsed)) {
    throw new Error('Gemini structured-output was not a JSON array');
  }

  const out = new Map<string, string>();
  for (const entry of parsed) {
    if (entry?.id && typeof entry.content === 'string') {
      out.set(entry.id, entry.content.trim());
    }
  }
  return out;
}
