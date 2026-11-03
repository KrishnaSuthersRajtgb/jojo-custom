import { wishlistApi, type WishlistItem, type WishlistData } from './api';

export type { WishlistItem, WishlistData };

export const wishlistService = {
  getWishlist: async (): Promise<WishlistItem[]> => {
    const res = await wishlistApi.getWishlist();
    return res.data.items;
  },

  addItem: async (item: {
    fabricId: string;
    fabricName: string;
    tone?: string;
    hex?: string;
    pricePerMeter?: number;
  }): Promise<WishlistItem[]> => {
    const res = await wishlistApi.addItem(item);
    return res.data.items;
  },

  removeItem: async (fabricId: string): Promise<WishlistItem[]> => {
    const res = await wishlistApi.removeItem(fabricId);
    return res.data.items;
  },
};
