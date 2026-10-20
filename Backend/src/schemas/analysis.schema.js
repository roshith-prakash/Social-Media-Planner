import { z } from "zod";

export const analyzeSchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
});

export const regenerateSchema = z.object({
  agent: z.enum(["content", "quality", "strategy", "seo", "platform"], {
    message: "agent must be one of: content, quality, strategy, seo, platform",
  }),
});
