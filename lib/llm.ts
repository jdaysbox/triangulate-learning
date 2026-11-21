import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

export class LlmError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

/** Call the model and parse a strict-JSON reply. Hard 8s timeout to stay under Vercel's 10s limit. */
export async function callJson<T>(system: string, user: string, maxTokens: number): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new LlmError("Server is missing GEMINI_API_KEY. See .env.local.example.", 500);

  const ai = new GoogleGenAI({ apiKey });
  let text = "";
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        maxOutputTokens: maxTokens,
        temperature: 0.4,
        abortSignal: AbortSignal.timeout(8500),
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });
    text = res.text ?? "";
  } catch {
    throw new LlmError("The AI service was slow or unavailable. Please try again.", 504);
  }

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) throw new LlmError("AI returned an unreadable response. Please retry.");
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new LlmError("AI returned malformed JSON. Please retry.");
  }
}

export const isStr = (v: unknown): v is string => typeof v === "string";
