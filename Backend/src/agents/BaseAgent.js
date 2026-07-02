import ai, { GEMINI_MODEL } from "../config/gemini.js";
import parseAIJson from "../utils/parseJSON.js";

/**
 * BaseAgent — Abstract base class for all AI agents.
 *
 * Each agent:
 * 1. Receives the shared video file URI + accumulated context
 * 2. Builds a specialized system prompt
 * 3. Calls Gemini with strict JSON output instructions
 * 4. Returns a validated, parsed result object
 *
 * To create a new agent: extend BaseAgent and implement `buildPrompt(context)`
 * and optionally override `processResult(raw)`.
 */
class BaseAgent {
  constructor(name) {
    if (new.target === BaseAgent) {
      throw new Error("BaseAgent is abstract and cannot be instantiated directly");
    }
    this.name = name;
    this.model = GEMINI_MODEL;
  }

  /**
   * Build the prompt string for this agent.
   * @param {object} context - Accumulated context from prior agents
   * @returns {string} - Prompt string
   */
  // eslint-disable-next-line no-unused-vars
  buildPrompt(context) {
    throw new Error(`${this.name}.buildPrompt() must be implemented`);
  }

  /**
   * Post-process the parsed JSON result (optional override).
   * @param {object} raw - Parsed JSON from Gemini
   * @returns {object}
   */
  processResult(raw) {
    return raw;
  }

  /**
   * Execute this agent.
   * @param {string} videoFileUri - Gemini File API URI for the uploaded video
   * @param {object} context - Accumulated results from prior agents
   * @returns {object} - Parsed agent output
   */
  async run(videoFileUri, context = {}) {
    const startTime = Date.now();
    try {
      const prompt = this.buildPrompt(context);

      const contents = [
        {
          role: "user",
          parts: [
            // Attach video only for agents that need direct video access
            ...(videoFileUri && this.needsVideo
              ? [{ fileData: { fileUri: videoFileUri, mimeType: "video/mp4" } }]
              : []),
            { text: prompt },
          ],
        },
      ];

      const result = await ai.models.generateContent({
        model: this.model,
        contents,
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });

      const rawText = result.text;
      const parsed = parseAIJson(rawText);
      const processed = this.processResult(parsed);

      const elapsed = Date.now() - startTime;
      console.log(`✅ ${this.name} completed in ${elapsed}ms`);

      return processed;
    } catch (error) {
      console.error(`❌ ${this.name} failed:`, error.message);
      throw error;
    }
  }
}

export default BaseAgent;
