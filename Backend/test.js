import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch"; // make sure to install: npm install node-fetch
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
const model = "gemini-2.5-flash";

export const generateVideoAnalysis = async () => {
    try {
        // Cloudinary video URL
        const url = "https://res.cloudinary.com/dvwdsxirc/video/upload/v1758417351/testVideo_xvzo0j.mp4";

        // Fetch video as a buffer
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
        const buffer = await response.arrayBuffer();

        // Convert buffer into FileData for Gemini
        const videoFile = {
            inlineData: {
                data: Buffer.from(buffer).toString("base64"),
                mimeType: "video/mp4",
            },
        };

        const prompt = `
            You are an expert video content strategist. Analyze the provided video.
            Your task is to deeply understand the video's content, audience intent, and optimal positioning.
            Research current trends as well and let the user know what else they can be doing.

            Perform the following steps:

            1. **Content Analysis**
            - Provide a concise summary of the video's key themes, messages, and tone.
            - Identify the target audience (demographics, interests, professional/personal use).
            - Highlight emotional triggers or hooks that stand out.

            2. **Platform Recommendation**
            - Decide whether the video is best suited for **YouTube, X (Twitter), or LinkedIn**.
            - Justify your choice based on audience behavior, video length, tone, and platform algorithms.

            3. **Content Optimization**
            - Suggest 3–5 highly compelling, platform-specific **titles** optimized for CTR and discoverability.
            - Write a strong, engaging **description** (2–3 paragraphs) that highlights the video's value and encourages engagement.
            - Provide a list of **10–15 relevant hashtags** tailored to the platform, mixing broad reach (trending) and niche-specific tags.

            4. **Engagement Strategy**
            - Suggest the best posting style (e.g., short-form caption, long-form educational, thread/series).
            - Recommend the ideal posting time and format (vertical/landscape) for the platform.

            Return the final response in **valid JSON** with the following structure:

            {
                "summary": "...",
                "targetAudience": "...",
                "platform": {
                    "recommended": "YouTube | X | LinkedIn",
                    "justification": "..."
                },
                "content": {
                    "titles": ["...", "...", "..."],
                    "description": "...",
                    "hashtags": ["...", "...", "..."]
                },
                "engagementStrategy": {
                    "postingStyle": "...",
                    "bestTime": "...",
                    "format": "vertical | landscape"
                }
            }
        `;

        // Send both video and prompt
        const result = await ai.models.generateContent({
            model,
            contents: [
                { role: "user", parts: [videoFile, { text: prompt }] }
            ],
        });

        console.log(result.text);
    } catch (error) {
        console.error("Error analyzing video:", error);
    }
};

generateVideoAnalysis();
