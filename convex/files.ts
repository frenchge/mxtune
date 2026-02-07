import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Générer une URL de téléchargement pour uploader un fichier
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Obtenir l'URL d'un fichier stocké
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Obtenir les URLs de plusieurs fichiers
export const getUrls = query({
  args: { storageIds: v.array(v.id("_storage")) },
  handler: async (ctx, args) => {
    const urls = await Promise.all(
      args.storageIds.map(async (id) => ({
        id,
        url: await ctx.storage.getUrl(id),
      }))
    );
    return urls;
  },
});

// Ajouter une image à une moto
export const addImageToMoto = mutation({
  args: {
    motoId: v.id("motos"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const moto = await ctx.db.get(args.motoId);
    if (!moto) throw new Error("Moto non trouvée");
    
    const currentImages = moto.images || [];
    await ctx.db.patch(args.motoId, {
      images: [...currentImages, args.storageId],
    });
    
    return args.storageId;
  },
});

// Supprimer une image d'une moto
export const removeImageFromMoto = mutation({
  args: {
    motoId: v.id("motos"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const moto = await ctx.db.get(args.motoId);
    if (!moto) throw new Error("Moto non trouvée");
    
    const currentImages = moto.images || [];
    const newImages = currentImages.filter((id) => id !== args.storageId);
    
    await ctx.db.patch(args.motoId, {
      images: newImages,
    });
    
    // Supprimer le fichier du storage
    await ctx.storage.delete(args.storageId);
    
    return args.storageId;
  },
});
