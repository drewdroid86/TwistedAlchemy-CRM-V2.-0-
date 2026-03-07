/**
 * Receipt Processing Service
 * Uses Google Gemini AI to extract structured data from receipt images.
 * Returns vendor, date, total amount, and line items.
 */
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function processReceiptImage(base64Image: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Extract details from this receipt image for a woodworking shop. 
  Identify the vendor, date, and total amount. 
  Also, list the individual items if possible.
  Return the data in the specified JSON format.`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vendor: { type: Type.STRING },
          date: { type: Type.STRING, description: "ISO date format YYYY-MM-DD" },
          total_amount: { type: Type.NUMBER },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                unit_price: { type: Type.NUMBER }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
