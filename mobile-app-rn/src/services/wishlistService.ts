import { api } from './api';
import { WishlistItem, PaginationParams } from '../types';

export interface WishlistParams extends PaginationParams {
  priority?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const wishlistService = {
  async getWishlist(params?: WishlistParams): Promise<any> {
    return api.get('/wishlist', params);
  },

  async checkGame(gameId: number): Promise<{ inWishlist: boolean; item?: WishlistItem }> {
    try {
      const response = await api.get(`/wishlist/check/${gameId}`);
      return { inWishlist: true, item: response.data || response };
    } catch {
      return { inWishlist: false };
    }
  },

  async addToWishlist(data: { game_id: number; priority?: string; max_price?: number }): Promise<WishlistItem> {
    const response = await api.post('/wishlist', data);
    return response.data || response;
  },

  async removeFromWishlist(id: number): Promise<void> {
    await api.delete(`/wishlist/${id}`);
  },
};
