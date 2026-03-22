import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getVault = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("userConfig").order("asc").collect();
  },
});

export const addVaultItem = mutation({
  args: {
    label: v.string(),
    value: v.string(),
    type: v.union(v.literal("link"), v.literal("text")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("userConfig", {
      label: args.label,
      value: args.value,
      type: args.type,
      createdAt: Date.now(),
    });
  },
});

export const removeVaultItem = mutation({
  args: { id: v.id("userConfig") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
