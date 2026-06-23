import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini 1.5 client — Vision + Text pipeline for ShasthyaHub-AI.
 * Initialized lazily so the client is only built when an API key exists,
 * which keeps `next build` prerendering from throwing on a missing key.
 */
let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in the environment.');
  }
  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Pull a JSON object out of an LLM response that may contain prose,
 * markdown fences, or stray text around the object.
 *
 * 1. Try a direct parse.
 * 2. Otherwise grab everything between the first `{` and the last `}`.
 * 3. If that still fails, throw — never silently swallow.
 */
export function extractJsonSafely(text: string): object {
  const trimmed = text.trim();

  // 1. Direct parse — best case, the model returned clean JSON.
  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through to regex extraction
  }

  // 2. Strip markdown code fences if present, then extract the outermost braces.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenceMatch ? fenceMatch[1].trim() : trimmed;

  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const slice = candidate.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(slice);
    } catch {
      // fall through to throw
    }
  }

  throw new Error('JSON extraction failed: no valid JSON object found in response.');
}

/**
 * Run Gemini 1.5 Pro on an image + prompt and return a parsed JSON object.
 * The model is asked to emit JSON only; extractJsonSafely cleans up the rest.
 */
export async function callGeminiVision(
  imageBase64: string,
  mimeType: ImageMimeType,
  systemPrompt: string
): Promise<object> {
  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      { text: systemPrompt },
    ]);
    const text = result.response.text();
    return extractJsonSafely(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini vision call failed: ${message}`);
  }
}

/**
 * Run Gemini 1.5 Flash on a text-only prompt and return a parsed JSON object.
 * Flash is faster and cheaper — used for text triage / fallback paths.
 */
export async function callGeminiText(prompt: string): Promise<object> {
  try {
    const model = getClient().getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return extractJsonSafely(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini text call failed: ${message}`);
  }
}
