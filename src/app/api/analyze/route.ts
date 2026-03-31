import { generateText, Output } from 'ai';
import { google } from '@ai-sdk/google';
import { horizonSchema } from '@/lib/schema';
import type { HorizonSettings } from '@/lib/settings';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      oferta,
      settings,
      jobLink,
      companyLink,
      model,
      deepAnalysis,
    }: {
      oferta: string;
      settings: HorizonSettings;
      jobLink?: string | null;
      companyLink?: string | null;
      model?: string;
      deepAnalysis?: boolean;
    } = await req.json();

    if (!oferta) {
      return new Response('Oferta no proporcionada', { status: 400 });
    }

    // Construir el prompt de sistema dinámicamente desde los settings del usuario
    const portfolioSection = settings.portfolioUrls?.trim()
      ? `\nPORTFOLIO / PROYECTOS:\n${settings.portfolioUrls}`
      : "";

    const stackSection = settings.currentStack?.trim()
      ? `\nSTACK ACTUAL: ${settings.currentStack}`
      : "";



    const signatureSection = settings.masterSignature?.trim()
      ? `\n\nFIRMA MAESTRA — Usar OBLIGATORIAMENTE al final de TODOS los pitches:\n${settings.masterSignature}`
      : "";

    // Las Voice Guidelines son la instrucción principal para redactar 'propuesta_markdown'
    const voiceSection = settings.voiceGuidelines?.trim()
      ? `\n\nDETAILED VOICE GUIDELINES — Seguir EXACTAMENTE para redactar el campo 'propuesta_markdown':\n${settings.voiceGuidelines}`
      : "\n\nVOICE: Redacta el pitch en inglés fluido, conversacional y directo. Sé conciso.";

    const fullPrompt = `${settings.systemPrompt}

${settings.bio}${portfolioSection}${stackSection}${signatureSection}${voiceSection}

---
CRITICAL RULES FOR THIS ANALYSIS:
- PROPORTIONAL PROFITABILITY RULE: Evaluate rates based on a $12.50/hr baseline ($2,000/mo for 160h). Formula: Vp = (Budget / Hours) * 160. If Vp >= $2,000, categorize as TIER 1.
- METADATA EXTRACTION: Siempre intenta extraer la fecha real en 'posted_at'. CRÍTICO: NO inventes ni adivines 'job_link' ni 'company_link'; solo extráelos si aparecen de forma explícita y literal en el texto provisto.

EJEMPLOS DE OUTPUT ESPERADO (Seguir el ESTILO y FORMATO de estos ejemplos):
${settings.outputExamples}

---

AHORA ANALIZA LA SIGUIENTE OFERTA O MENSAJE:

${oferta}
`;

    // El model del body tiene prioridad; fallback al preferredModel de settings
    const modelToUse = model ?? settings.preferredModel ?? 'gemini-3-flash-preview';

    const { output: aiResult } = await generateText({
      model: google(modelToUse),
      output: Output.object({ schema: horizonSchema }),
      prompt: fullPrompt,
      ...(deepAnalysis && {
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingLevel: "high",
            },
          },
        },
      }),
    });

    // Los links manuales tienen prioridad sobre los extraídos por la IA
    const finalResult = {
      ...aiResult,
      job_link:     jobLink     ?? aiResult.job_link     ?? null,
      company_link: companyLink ?? aiResult.company_link ?? null,
    };

    return Response.json(finalResult);
  } catch (error: any) {
    console.error("Error analizando oferta:", error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno del servidor', details: error }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

