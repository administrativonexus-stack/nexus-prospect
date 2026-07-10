import OpenAI from "openai"
import { getSetting } from "@/lib/settings"

export async function getOpenAIClient(userId: string): Promise<OpenAI> {
  const apiKey = await getSetting("openai_api_key", userId)
  if (!apiKey) throw new Error("OpenAI API key not configured. Set it in Settings > OpenAI.")
  return new OpenAI({ apiKey })
}
