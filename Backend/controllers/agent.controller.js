import { google } from "googleapis";
import { Readable } from "stream"
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import fetch from "node-fetch"; // make sure to install: npm install node-fetch
import { prisma } from "../utils/prismaClient.js";
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_KEY });
const model = "gemini-2.5-flash";

export const uploadVideoFromCDN = async (user, cdnUrl, title, description) => {

    function getAuthorizedClient(user) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );

        oauth2Client.setCredentials({
            access_token: user.youtubeAccessToken,
            refresh_token: user.youtubeRefreshToken,
            expiry_date: user.youtubeTokenExpiry?.getTime(),
        });

        return oauth2Client;
    }

    console.log(cdnUrl)

    const auth = getAuthorizedClient(user);
    const youtube = google.youtube({ version: "v3", auth });

    // Stream video bytes from CDN
    const response = await fetch(cdnUrl);
    if (!response.ok) throw new Error(`Failed to fetch CDN video: ${response.statusText}`);


    const res = await youtube.videos.insert({
        part: "snippet,status",
        requestBody: {
            snippet: { title, description },
            status: { privacyStatus: "public" },
        },
        media: {
            body: response.body,
        },
    });

    console.log(res.data)

    return res.data;
}

export const generateVideoAnalysis = async (req, res) => {
    try {
        // Cloudinary video URL
        const url = req?.body?.url

        console.log(url)

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

        const text = result.text;

        if (text) {
            let JSONtext = text.replace("json", "").replaceAll("`", "");
            const jsonValues = JSON.parse(JSONtext);
            return res.status(200).send({ data: jsonValues });
        } else {
            throw Error("Could not generate a response");
        }

        res.status(200).send({ data: result.text })
    } catch (error) {
        console.error("Error analyzing video:", error);
    }
};


export const uploadVideoViaAI = async (req, res) => {

    const cdnUrl = req?.body?.cdnUrl
    const userId = req?.body?.userId
    const analysis = req?.body?.analysis

    const prompt = `
            You are an expert video content strategist. Read the given analysis - Choose a title and a description from the data. Return it in the following json format.


            {
                "title" : "Your title",
                "description" : "Your description
            }
            
            Do not return anything else.
        `;

    // Send both video and prompt
    const result = await ai.models.generateContent({
        model,
        contents: [
            { role: "user", parts: [{ text: prompt }, { text: JSON.stringify(analysis) }] }
        ],
    });

    const text = result.text;

    if (text) {
        let JSONtext = text.replace("json", "").replaceAll("`", "");
        const jsonValues = JSON.parse(JSONtext);

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        console.log("Starting upload")
        // Upload video
        const video = await uploadVideoFromCDN(user, cdnUrl, jsonValues?.title, jsonValues?.description);

        console.log("Back in calling function : ", video)
        res.status(200).send({ success: true, video });
    } else {
        throw Error("Could not generate a response");
    }

}