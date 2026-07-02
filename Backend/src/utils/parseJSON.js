/**
 * parseAIJson — Safely parses JSON from Gemini model output.
 *
 * Gemini sometimes wraps JSON in markdown code fences:
 *   ```json { ... } ```
 * This function strips those fences before parsing.
 */
const parseAIJson = (text) => {
  if (!text) throw new Error("Empty response from AI model");

  // Strip markdown code fences if present
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    return JSON.parse(clean);
  } catch (err) {
    // Try to extract JSON by finding the first { or [ and last } or ]
    const objMatch = clean.match(/(\{[\s\S]*\})/);
    const arrMatch = clean.match(/(\[[\s\S]*\])/);
    const match = objMatch || arrMatch;
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Fall through
      }
    }
    throw new Error(`Failed to parse AI JSON response: ${err.message}. Raw: ${clean.substring(0, 200)}`);
  }
};

export default parseAIJson;
