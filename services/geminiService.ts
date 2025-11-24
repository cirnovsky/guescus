
import { GoogleGenAI } from "@google/genai";
import { CommentNode } from "../types";
import { getEnv } from "../constants";

// Safety check for API Key
const getClient = () => {
  const apiKey = getEnv('API_KEY');
  if (!apiKey) {
    throw new Error("Gemini API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const summarizeComments = async (comments: CommentNode[]): Promise<string> => {
  try {
    const ai = getClient();
    
    // Flatten comments and replies into a text transcript
    const transcript = comments.map(c => {
        const author = c.author?.login || "Unknown";
        let text = `${author}: ${c.body}`;
        if(c.replies.nodes.length > 0) {
            text += '\n' + c.replies.nodes.map(r => `  - Reply by ${r.author?.login || 'Unknown'}: ${r.body}`).join('\n');
        }
        return text;
    }).join('\n\n');

    if (!transcript.trim()) return "No comments to summarize.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following discussion thread concisely in 3 bullet points:\n\n${transcript}`,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return "Unable to summarize at this time. Please check API configuration.";
  }
};

export const suggestReply = async (contextComments: CommentNode[], partialInput: string): Promise<string> => {
    try {
        const ai = getClient();
        
        const recentContext = contextComments.slice(-5).map(c => `${c.author?.login}: ${c.body}`).join('\n');
        
        const prompt = `
        You are a helpful assistant in a comment section.
        Based on the recent conversation:
        ${recentContext}
        
        The user is typing: "${partialInput}"
        
        Suggest a polite, constructive completion or full response for the user. Keep it under 50 words.
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
    
        return response.text || "";
      } catch (error) {
        console.error("Gemini Suggestion Error:", error);
        return "";
      }
};
