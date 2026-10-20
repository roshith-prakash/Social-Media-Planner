import ai, { GEMINI_MODEL } from "../config/gemini.js";
import parseAIJson from "../utils/parseJSON.js";
import { emit } from "../utils/sseEmitter.js";

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
   * @param {string} projectId - Optional project ID for SSE real-time streaming
   * @returns {object} - Parsed agent output
   */
  async run(videoFileUri, context = {}, projectId = null) {
    const startTime = Date.now();
    try {
      if (projectId) {
        emit(projectId, "agent_start", { agent: this.name, status: "running" });
      }

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

      const candidateModels = [
        this.model,
        "gemini-3-flash-preview",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
      ].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

      let lastError = null;
      let rawText = null;

      for (const modelToTry of candidateModels) {
        try {
          const result = await ai.models.generateContent({
            model: modelToTry,
            contents,
            config: {
              temperature: 0.3,
              responseMimeType: "application/json",
            },
          });
          rawText = result.text;
          if (modelToTry !== this.model) {
            console.log(`ℹ️ [${this.name}] Successfully responded using fallback model ${modelToTry}`);
          }
          break;
        } catch (err) {
          lastError = err;
          console.warn(`⚠️ [${this.name}] Call to ${modelToTry} failed (${err.status || err.message}). Checking fallback...`);
        }
      }

      if (!rawText) {
        throw lastError || new Error(`All candidate models failed for ${this.name}`);
      }

      const parsed = parseAIJson(rawText);
      const processed = this.processResult(parsed);

      const elapsed = Date.now() - startTime;
      console.log(`✅ ${this.name} completed in ${elapsed}ms`);

      if (projectId) {
        emit(projectId, "agent_done", { agent: this.name, status: "done", elapsed });
      }

      return processed;
    } catch (error) {
      console.error(`❌ ${this.name} failed:`, error.message);
      if (projectId) {
        emit(projectId, "agent_done", { agent: this.name, status: "failed", error: error.message });
      }
      throw error;
    }
  }
}

export default BaseAgent;

