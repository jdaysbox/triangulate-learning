import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

export class LlmError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

/** Call the model and parse a strict-JSON reply. Hard 8s timeout to stay under Vercel's 10s limit. */
export async function callJson<T>(system: string, user: string, maxTokens: number): Promise<T> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LlmError("Server is missing ANTHROPIC_API_KEY. See .env.local.example.", 500);

  const client = new Anthropic({ apiKey, timeout: 8000, maxRetries: 0 });
  let text = "";
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    });
    text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
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
