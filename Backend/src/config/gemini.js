import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_KEY) {
  throw new Error("GEMINI_KEY is not set in environment variables");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

export const GEMINI_MODEL = "gemini-2.5-flash";

export default ai;
