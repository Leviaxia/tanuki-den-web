
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PRODUCTS } from "../constants";

// Use import.meta.env for Vite
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

// Initialize the API client
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function getOtakuRecommendation(userQuery: string) {
  // Check for missing key
  if (!genAI) {
    return "El espíritu Tanuki está descansando (Falta API Key). Intenta más tarde. 🍃";
  }

  const productContext = PRODUCTS.map(p => `- ${p.name}: ${p.category}, $${p.price}.`).join('\n');

  try {
    // Get the generative model (using the standard gemini-1.5-flash)
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: {
        parts: [{
          text: `Eres el "Espíritu Tanuki", un guía sabio y minimalista de una tienda boutique anime.
        
        REGLAS DE RESPUESTA:
        1. Sé BREVE y CALIDO (máximo 2-3 frases).
        2. No divagues. Ve directo al grano con un tono amable.
        3. Usa un emoji ocasional (✨, 🍃, 🎋).
        4. Si preguntan por productos, menciona 1 o 2 máximo del catálogo.
        
        Catálogo:
        ${productContext}
        
        Responde siempre en español.` }]
      }
    });

    const result = await model.generateContent(userQuery);
    const response = await result.response;
    return response.text();

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Error Mágico: ${error.message || error}`;
  }
}
