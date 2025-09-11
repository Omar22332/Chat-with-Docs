/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { GoogleGenAI, GenerateContentResponse, Tool, HarmCategory, HarmBlockThreshold, Content, Type } from "@google/genai";
import { UrlContextMetadataItem } from '../types';

// IMPORTANT: The API key MUST be set as an environment variable `process.env.API_KEY`
const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI;

// Model supporting URL context, consistent with user examples and documentation.
const MODEL_NAME = "gemini-2.5-flash"; 

const getAiInstance = (): GoogleGenAI => {
  if (!API_KEY) {
    console.error("API_KEY is not set in environment variables. Please set process.env.API_KEY.");
    throw new Error("Gemini API Key not configured. Set process.env.API_KEY.");
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

interface GeminiResponse {
  text: string;
  urlContextMetadata?: UrlContextMetadataItem[];
}

export const streamContentWithUrlContext = async (
  prompt: string,
  urls: string[]
): Promise<AsyncIterable<GenerateContentResponse>> => {
  const currentAi = getAiInstance();
  
  let fullPrompt = prompt;
  if (urls.length > 0) {
    const urlList = urls.join('\n');
    fullPrompt = `${prompt}\n\nRelevant URLs for context:\n${urlList}`;
  }

  const tools: Tool[] = [{ urlContext: {} }];
  const contents: Content[] = [{ role: "user", parts: [{ text: fullPrompt }] }];

  try {
    const responseStream = await currentAi.models.generateContentStream({
      model: MODEL_NAME,
      contents: contents,
      config: { 
        tools: tools,
        safetySettings: safetySettings,
      },
    });
    return responseStream;
  } catch (error) {
    console.error("Error calling Gemini Stream API:", error);
    if (error instanceof Error) {
      const googleError = error as any; 
      if (googleError.message && googleError.message.includes("API key not valid")) {
// Fix: Corrected environment variable name in error message.
         throw new Error("Invalid API Key. Please check your API_KEY environment variable.");
      }
      if (googleError.message && googleError.message.includes("quota")) {
        throw new Error("API quota exceeded. Please check your Gemini API quota.");
      }
      if (googleError.type === 'GoogleGenAIError' && googleError.message) {
        throw new Error(`Gemini API Error: ${googleError.message}`);
      }
      throw new Error(`Failed to get response stream from AI: ${error.message}`);
    }
    throw new Error("Failed to get response stream from AI due to an unknown error.");
  }
};

export const getInitialSuggestions = async (urls: string[]): Promise<GeminiResponse> => {
  if (urls.length === 0) {
    return { text: JSON.stringify({ suggestions: ["Add some URLs to get topic suggestions."] }) };
  }
  const currentAi = getAiInstance();
  const urlList = urls.join('\n');
  
  const promptText = `Based on the content of the following documentation URLs, provide 3-4 concise and actionable questions a developer might ask to explore these documents. These questions should be suitable as quick-start prompts.

Relevant URLs:
${urlList}`;

  const contents: Content[] = [{ role: "user", parts: [{ text: promptText }] }];

  try {
    const response: GenerateContentResponse = await currentAi.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        safetySettings: safetySettings,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                description: "A concise and actionable question a developer might ask."
              }
            }
          },
          required: ["suggestions"],
        }
      },
    });

    const text = response.text;
    return { text };

  } catch (error) {
    console.error("Error calling Gemini API for initial suggestions:", error);
     if (error instanceof Error) {
      const googleError = error as any; 
      if (googleError.message && googleError.message.includes("API key not valid")) {
// Fix: Corrected environment variable name in error message.
         throw new Error("Invalid API Key for suggestions. Please check your API_KEY environment variable.");
      }
      if (googleError.message && googleError.message.includes("Tool use with a response mime type: 'application/json' is unsupported")) {
        throw new Error("Configuration error: Cannot use tools with JSON response type for suggestions. This should be fixed in the code.");
      }
      throw new Error(`Failed to get initial suggestions from AI: ${error.message}`);
    }
    throw new Error("Failed to get initial suggestions from AI due to an unknown error.");
  }
};