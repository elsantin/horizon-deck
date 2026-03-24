import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  analysis: defineTable({
    score: v.number(),
    cargo: v.string(),
    empresa: v.string(),
    pago: v.string(),
    esfuerzo: v.union(v.literal("Bajo"), v.literal("Medio"), v.literal("Alto")),
    tier: v.union(v.literal("Tier 1"), v.literal("Tier 2"), v.literal("Tier 3")),
    resumen_ejecutivo: v.string(),
    analisis_estrategico_markdown: v.string(),
    propuesta_markdown: v.string(),
    applied: v.optional(v.boolean()),
    createdAt: v.number(), // timestamp
    postedAt: v.optional(v.string()), // Real date of the post
    jobLink: v.optional(v.string()),
    companyLink: v.optional(v.string()),
    horizonId: v.optional(v.string()), // UUID estable para backup/restore
  }),
  
  messages: defineTable({
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system"), v.literal("data")),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_session", ["sessionId"]),

  userConfig: defineTable({
    label: v.string(),
    value: v.string(),
    type: v.union(v.literal("link"), v.literal("text")),
    createdAt: v.number(),
  }),
});
