import { GoogleGenAI, Type } from "@google/genai";
import { Project } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestProjectPrice(project: Project) {
  const model = "gemini-3-flash-preview";
  
  const prompt = `You are a pricing expert for a woodworking and furniture refurbishment shop.
The shop runs two brands:
- Twisted Twig: Cosmetic refurbishment of secondhand furniture (paint, stain, hardware, upholstery).
- Wood Grain Alchemist (WGA): Custom furniture builds from raw lumber, structural repairs.

Analyze the following project data and suggest a retail price.
Project Data:
- Brand: ${project.brand}
- Title: ${project.title}
- Description: ${project.description}
- Item Cost (Raw material/furniture cost): $${project.financials.item_cost}
- Supplies Cost (Paint, hardware, etc.): $${project.financials.supplies_cost}
- Labor Hours: ${project.financials.labor_hours || 0}
- Hourly Rate: $${project.financials.hourly_rate || 45}

Provide a JSON response with the following structure:
- suggested_price: The recommended retail price (number).
- price_range: A string representing a reasonable price range (e.g., "$400 - $550").
- strategy: The pricing strategy used (e.g., "Value Added", "Cost-Plus", "Market Competitive").
- reasoning: A brief explanation of why this price is recommended, considering the brand, costs, and labor.
- margin_at_suggested: The estimated profit margin percentage at the suggested price.

Output MUST be valid JSON matching the specified schema. Do not include markdown formatting like \`\`\`json.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggested_price: { type: Type.NUMBER },
            price_range: { type: Type.STRING },
            strategy: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            margin_at_suggested: { type: Type.NUMBER }
          },
          required: ["suggested_price", "price_range", "strategy", "reasoning", "margin_at_suggested"]
        }
      }
    });

    let jsonStr = response.text || "{}";
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error suggesting price:", error);
    throw new Error("Failed to suggest price.");
  }
}
