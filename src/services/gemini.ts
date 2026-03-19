import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface ColorRecommendation {
  name: string;
  hex: string;
  reason: string;
}

export interface RoomAnalysisResult {
  roomStyle: string;
  styleDescription: string;
  recommendedColors: ColorRecommendation[];
}

export async function analyzeRoomImage(base64Image: string, mimeType: string): Promise<RoomAnalysisResult> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
      "分析这张房间照片。识别室内设计风格。从 'Miller Paint' 品牌中推荐正好 3 种完美搭配此房间的具体涂料颜色。假设涂料为缎光面（satin finish）。提供 Miller Paint 的官方颜色名称、近似的十六进制代码（hex code），以及推荐理由。请务必用中文（简体）输出房间风格、风格描述和推荐理由。颜色名称可以保留英文官方名称。",
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          roomStyle: {
            type: Type.STRING,
            description: "The identified interior design style of the room.",
          },
          styleDescription: {
            type: Type.STRING,
            description: "A brief description of why this style was identified and its key characteristics.",
          },
          recommendedColors: {
            type: Type.ARRAY,
            description: "3 recommended satin paint colors from Miller Paint.",
            items: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: "The official name of the Miller Paint color.",
                },
                hex: {
                  type: Type.STRING,
                  description: "The approximate HEX color code for this paint (e.g., #FFFFFF).",
                },
                reason: {
                  type: Type.STRING,
                  description: "Why this specific color and a satin finish works well for this room.",
                }
              },
              required: ["name", "hex", "reason"]
            }
          }
        },
        required: ["roomStyle", "styleDescription", "recommendedColors"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(text) as RoomAnalysisResult;
}
