import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_KEY) {
  throw new Error("GEMINI_KEY is not set in environment variables");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

export default ai;
