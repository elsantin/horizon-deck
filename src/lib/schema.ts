import { z } from "zod";

export const horizonSchema = z.object({
  score: z
    .number()
    .describe(
      "Puntuación de 0.0 a 10.0 en pasos de 0.5. Mide qué tan buena oportunidad representa para Santiago bajo sus criterios.",
    ),
  cargo: z
    .string()
    .describe("Nombre del puesto o rol detallado en la oferta laboral"),
  empresa: z
    .string()
    .describe("Nombre de la empresa o cliente que publica la oferta"),
  pago: z
    .string()
    .describe(
      "Rango salarial, tipo de compensación mensual o presupuesto del proyecto",
    ),
  esfuerzo: z
    .enum(["Bajo", "Medio", "Alto"])
    .describe(
      "Nivel de esfuerzo o tiempo semanal estimado que requerirá el trabajo",
    ),
  tier: z
    .enum(["Tier 1", "Tier 2", "Tier 3"])
    .describe(
      "Clasificación general de la oportunidad basándose en pago y compatibilidad (Tier 1 es lo mejor)",
    ),
  resumen_ejecutivo: z.string().describe(
    `Párrafo de 3 a 5 líneas que responde estas preguntas en orden:
  1. ¿Qué hace o a qué se dedica la empresa/cliente? (aunque no esté
     directamente relacionado con el trabajo, si se puede inferir del
     texto, mencionarlo brevemente)
  2. ¿Qué necesita exactamente? ¿Para qué proyecto o producto es el trabajo?
  3. ¿Vale la pena para Santiago? Diagnóstico directo: sí, no, o
     condicionalmente con el por qué fundamental.
  NO es un análisis estratégico. Es contexto + veredicto rápido. Tono directo.`,
  ),
  analisis_estrategico_markdown: z.string().describe(
    `Antes de los pros y contras, incluye siempre un párrafo breve titulado "El verdadero rol" que responda: ¿qué problema real está intentando resolver la empresa con este puesto? Una o dos líneas, directo.

    Copia íntegra del análisis detallado en formato Markdown, usando emojis relevantes (✅, 🚩, ⚠️) para denotar pros, contras y alertas. Debe justificar el Score final.`,
  ),
  propuesta_markdown: z.string().describe(
    `Cover letter/pitch en inglés para ser copiado y pegado directamente.

  ESTRUCTURA OBLIGATORIA:
  1. Saludo natural dirigido a la empresa o equipo (ej: "Hi [Empresa]," o "Hello,")
  2. Párrafo 1: algo específico del proyecto o rol que genuinamente
     conecta con lo que Santiago hace — solo mencionar cosas reales,
     no exagerar ni inventar habilidades.
  3. Párrafo 2: cómo su workflow o experiencia real aporta a esa necesidad.
     Tono honesto y directo, no de vendedor.
  4. Párrafo 3 (opcional si el pitch ya es suficientemente claro):
     call-to-action breve y amigable, abierto a conversar.
  5. Firma tal cual aparece en masterSignature, sin modificar.

  LÍMITE: máximo 1430 caracteres en total (es el límite del campo en Contra).
  TONO: humano, cercano, confiado sin ser arrogante. Nunca corporativo.`,
  ),
  posted_at: z
    .string()
    .optional()
    .describe("Fecha real de publicación de la oferta (extraída del texto)"),
  job_link: z
    .string()
    .optional()
    .describe(
      "Link directo de la oferta. IMPORTANTE: NO LO INTENTES ADIVINAR O INVENTAR. Si no está escrito literalmente en el texto de la oferta, omítelo/devuelve null.",
    ),
  company_link: z
    .string()
    .optional()
    .describe(
      "URL del sitio web o perfil de la empresa/cliente. SOLO incluir si hay una URL explícita y real en el texto de la oferta. Si no existe ninguna URL real, devolver null o string vacío. NUNCA inventar, construir ni asumir una URL a partir del nombre de la empresa o cualquier otro dato.",
    ),
});
