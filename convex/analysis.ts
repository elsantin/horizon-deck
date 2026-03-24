import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Obtener todos los análisis (para el Dashboard)
export const getAnalysis = query({
  handler: async (ctx) => {
    return await ctx.db.query("analysis").order("desc").collect();
  },
});

// Guardar un nuevo análisis — genera horizonId automáticamente si no viene
export const saveAnalysis = mutation({
  args: {
    score: v.number(),
    cargo: v.string(),
    empresa: v.string(),
    pago: v.string(),
    esfuerzo: v.union(v.literal("Bajo"), v.literal("Medio"), v.literal("Alto")),
    tier: v.union(v.literal("Tier 1"), v.literal("Tier 2"), v.literal("Tier 3")),
    resumen_ejecutivo: v.string(),
    analisis_estrategico_markdown: v.string(),
    propuesta_markdown: v.string(),
    createdAt: v.number(),
    postedAt: v.optional(v.string()),
    jobLink: v.optional(v.string()),
    companyLink: v.optional(v.string()),
    horizonId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const horizonId = args.horizonId ?? crypto.randomUUID();
    return await ctx.db.insert("analysis", {
      ...args,
      horizonId,
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

// ----------------------------------------------------------------
// BACKUP / RESTORE
// ----------------------------------------------------------------

/**
 * Upsert de un análisis por horizonId.
 * - Si existe un doc con ese horizonId → lo parchea (sobreescribe).
 * - Si no existe → lo inserta como nuevo.
 */
export const upsertAnalysis = mutation({
  args: {
    horizonId: v.string(),
    score: v.number(),
    cargo: v.string(),
    empresa: v.string(),
    pago: v.string(),
    esfuerzo: v.union(v.literal("Bajo"), v.literal("Medio"), v.literal("Alto")),
    tier: v.union(v.literal("Tier 1"), v.literal("Tier 2"), v.literal("Tier 3")),
    resumen_ejecutivo: v.string(),
    analisis_estrategico_markdown: v.string(),
    propuesta_markdown: v.string(),
    createdAt: v.number(),
    applied: v.optional(v.boolean()),
    postedAt: v.optional(v.string()),
    jobLink: v.optional(v.string()),
    companyLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Buscar si ya existe un documento con ese horizonId
    const existing = await ctx.db
      .query("analysis")
      .filter((q) => q.eq(q.field("horizonId"), args.horizonId))
      .first();

    if (existing) {
      // Parchear con los nuevos datos conservando el _id de Convex
      const { horizonId: _hid, ...rest } = args;
      await ctx.db.patch(existing._id, { ...rest, horizonId: args.horizonId });
    } else {
      // Insertar como documento nuevo
      await ctx.db.insert("analysis", { ...args });
    }
  },
});

/**
 * Migración silenciosa: asigna horizonId a todos los documentos
 * que no lo tengan. Ejecutar UNA SOLA VEZ desde el dashboard de Convex.
 */
export const backfillHorizonIds = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("analysis").collect();
    let count = 0;
    for (const doc of all) {
      if (!doc.horizonId) {
        await ctx.db.patch(doc._id, { horizonId: crypto.randomUUID() });
        count++;
      }
    }
    console.log(`backfillHorizonIds: ${count} documentos actualizados.`);
  },
});
