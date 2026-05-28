import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.24.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function limitText(text: string, maxWords = 55): string {
  return text.split(" ").slice(0, maxWords).join(" ");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image");
    const question = formData.get("question");
    const context = formData.get("context");
    const isQuestion = typeof question === "string" && question.trim() !== "";
    const hasContext = typeof context === "string" && context.trim() !== "";

    console.log("Edge Function fields:", {
      hasQuestion: isQuestion,
      hasContext: hasContext,
      question: question ?? "null"
    });

    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Se requiere una imagen en el campo "image"' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    const modelName = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY no está configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Data = base64Encode(new Uint8Array(arrayBuffer));
    const mimeType = imageFile.type || "image/jpeg";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    let prompt = `Eres un asistente de visión para personas ciegas. Describe esta imagen de forma completa y detallada en español.

Incluye: escena general, objetos y su ubicación (izquierda/derecha/centro/fondo), colores, texto visible leído literalmente, y cualquier elemento relevante para navegación o seguridad.

Habla directo: "Hay una...", "A la izquierda...", "Se lee...". Sin frases introductorias.
Máximo 120 palabras en total.`;

    if (isQuestion) {
      prompt = `Estás analizando una imagen.${hasContext ? ` Descripción previa: "${context}"` : ""}

Responde en español esta pregunta de forma precisa basándote en lo que ves en la imagen: "${question}"

Ve directo a la respuesta. Sin frases introductorias.`;
    }

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    };

    const generatePromise = model.generateContent([prompt, imagePart]);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), 25000);
    });

    const result = await Promise.race([generatePromise, timeoutPromise]) as any;
    const response = await result.response;
    const description = response.text().trim();

    return new Response(
      JSON.stringify({ description }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error.message === "TIMEOUT") {
      return new Response(
        JSON.stringify({ error: "Timeout de 12 segundos excedido al llamar a Gemini" }),
        { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || "Error interno del servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
