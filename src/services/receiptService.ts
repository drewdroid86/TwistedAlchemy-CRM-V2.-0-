/**
 * Receipt Processing Service
 * Uses Google Gemini AI to extract structured data from receipt images.
 * Returns vendor, date, total amount, and line items.
 */
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function processReceiptImage(base64Image: string) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `You are an expert at extracting data from receipts for a woodworking shop.
The shop runs two brands:
- Twisted Twig: Cosmetic refurbishment of secondhand furniture (paint, stain, hardware, upholstery).
- Wood Grain Alchemist (WGA): Custom furniture builds from raw lumber, structural repairs.

Extract the following details from this receipt image:
- vendor: Name of the store or vendor.
- date: Date of purchase in YYYY-MM-DD format.
- total_amount: Total amount paid.
- items: List of individual items purchased.
  - description: Specific item description.
  - quantity: Number of items (default to 1 if not specified).
  - unit_price: Price per unit.
- notes: Any relevant notes or context.
- brand: Suggested brand for this purchase ("Twisted Twig" or "Wood Grain Alchemist") based on the items.

Rules:
- Handle missing values gracefully (e.g., empty string or 0).
- Ensure exact prices are extracted.
- Default quantities to 1 if not explicitly stated.
- Provide specific item descriptions.
- Output MUST be valid JSON matching the specified schema. Do not include markdown formatting like \`\`\`json.`;

  try {
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
        temperature: 0.2,
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
                },
                required: ["description", "quantity", "unit_price"]
              }
            },
            notes: { type: Type.STRING },
            brand: { type: Type.STRING, enum: ["Twisted Twig", "Wood Grain Alchemist"] }
          },
          required: ["vendor", "date", "total_amount", "items", "brand"]
        }
      }
    });

    let jsonStr = response.text || "{}";
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error processing receipt image:", error);
    throw new Error("Failed to process receipt image.");
  }
}
