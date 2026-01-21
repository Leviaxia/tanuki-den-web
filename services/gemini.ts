
import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../constants";

// Use import.meta.env for Vite instead of process.env
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

// Only initialize if key exists to prevent crash on load
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function getOtakuRecommendation(userQuery: string) {
  // DEBUG ALERT for Tablet
  if (!ai) {
    return "El espíritu Tanuki está descansando (Falta API Key). Intenta más tarde. 🍃";
  }

  const productContext = PRODUCTS.map(p => `- ${p.name}: ${p.category}, $${p.price}.`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-001',
      contents: userQuery,
      config: {
        systemInstruction: `Eres el "Espíritu Tanuki", un guía sabio y minimalista de una tienda boutique anime.
        
        REGLAS DE RESPUESTA:
        1. Sé BREVE y CALIDO (máximo 2-3 frases).
        2. No divagues. Ve directo al grano con un tono amable.
        3. Usa un emoji ocasional (✨, 🍃, 🎋).
        4. Si preguntan por productos, menciona 1 o 2 máximo del catálogo.
        5. IMPORTANTE: Si quieren CONTACTARSE, sugieren COMPRAR, o dudas de soporte, diles que escriban al Whatsapp: 3226870628.
        
        Catálogo:
        ${productContext}
        
        Responde siempre en español.`,
        temperature: 0.7,
      },
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    // Return explicit error
    return `Error Mágico: ${error.message || error}`;
  }
}
