import { z } from "zod";

export const createVideoSchema = z.object({
  cloudinaryPublicId: z.string().min(1, "cloudinaryPublicId is required"),
  cloudinaryUrl: z.string().url("A valid cloudinaryUrl is required"),
  title: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  fileSize: z.number().optional(),
  duration: z.number().optional(),
  format: z.string().optional(),
});
