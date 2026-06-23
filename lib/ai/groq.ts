import Groq from 'groq-sdk';

/**
 * Groq client — Llama 3.3 70B for clinical triage / report generation.
 * Initialized lazily so `next build` prerendering never throws on a missing key.
 */
let groqClient: Groq | null = null;

function getClient(): Groq {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in the environment.');
  }
  groqClient = new Groq({ apiKey });
  return groqClient;
}

/**
 * Call Groq Llama 3.3 70B with a system/user message pair.
 * `response_format: { type: 'json_object' }` forces valid JSON output.
 * The caller is responsible for parsing the returned JSON string into an object.
 *
 * @returns parsed JSON object
 */
export async function callGroq(
  userContent: string,
  systemPrompt: string,
  model = 'llama-3.3-70b-versatile'
): Promise<object> {
  try {
    const completion = await getClient().chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      // CRITICAL: forces the model to emit a single valid JSON object.
      response_format: { type: 'json_object' },
      // Clinical triage is a low-creativity task — keep it deterministic.
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response content from Groq.');
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`Groq returned non-JSON content despite json_object mode: ${content.slice(0, 200)}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Groq call failed: ${message}`);
  }
}
