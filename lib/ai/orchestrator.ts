import { generateContent as geminiGenerate } from './gemini';
import { generateContent as groqGenerate } from './groq';

export async function analyzeWithGemini(prompt: string): Promise<string> {
  return geminiGenerate(prompt);
}

export async function analyzeWithGroq(prompt: string): Promise<string> {
  return groqGenerate(prompt);
}

export async function orchestrateAnalysis(
  geminiPrompt: string,
  groqPrompt: string
): Promise<{ gemini: string; groq: string }> {
  const [geminiResult, groqResult] = await Promise.all([
    analyzeWithGemini(geminiPrompt),
    analyzeWithGroq(groqPrompt),
  ]);
  return { gemini: geminiResult, groq: groqResult };
}