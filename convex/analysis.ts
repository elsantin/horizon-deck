import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Obtener todos los análisis (para el Dashboard)
export const getAnalysis = query({
  handler: async (ctx) => {
    return await ctx.db.query("analysis").order("desc").collect();
  },
});

// Guardar un nuevo análisis (se usará al final del Gema Flow)
export const saveAnalysis = mutation({
  args: {
    score: v.number(),
    cargo: v.string(),
    empresa: v.string(),
    pago: v.string(),
    esfuerzo: v.union(v.literal("Bajo"), v.literal("Medio"), v.literal("Alto")),
    tier: v.union(
      v.literal("Tier 1"),
      v.literal("Tier 2"),
      v.literal("Tier 3"),
    ),
    resumen_ejecutivo: v.string(),
    analisis_estrategico_markdown: v.string(),
    propuesta_markdown: v.string(),
    createdAt: v.number(),
    postedAt: v.optional(v.string()),
    jobLink: v.optional(v.string()),
    companyLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analysis", {
      ...args,
    });
  },
});

// Eliminar un análisis
export const removeAnalysis = mutation({
  args: { id: v.id("analysis") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (existing) {
      await ctx.db.delete(args.id);
    }
  },
});

// Marcar/desmarcar como "ya apliqué"
export const toggleApplied = mutation({
  args: { id: v.id("analysis") },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (existing) {
      await ctx.db.patch(args.id, { applied: !existing.applied });
    }
  },
});

// Restaurar backup (Replace Total)
export const importBackup = mutation({
  args: {
    analyses: v.array(
      v.object({
        score: v.number(),
        cargo: v.string(),
        empresa: v.string(),
        pago: v.string(),
        esfuerzo: v.union(v.literal("Bajo"), v.literal("Medio"), v.literal("Alto")),
        tier: v.union(
          v.literal("Tier 1"),
          v.literal("Tier 2"),
          v.literal("Tier 3"),
        ),
        resumen_ejecutivo: v.string(),
        analisis_estrategico_markdown: v.string(),
        propuesta_markdown: v.string(),
        createdAt: v.number(),
        applied: v.optional(v.boolean()),
        postedAt: v.optional(v.string()),
        jobLink: v.optional(v.string()),
        companyLink: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    // 1. Borrar todos los análisis actuales
    const all = await ctx.db.query("analysis").collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }

    // 2. Insertar los nuevos análisis
    for (const data of args.analyses) {
      await ctx.db.insert("analysis", data);
    }
  },
});
