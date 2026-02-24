import { api } from './api';
import { Game } from '../types/game.types';
import { PaginationParams } from '../types/api.types';

export interface WishlistItem {
  id: number;
  user_id: number;
  game_id: number;
  priority: 'low' | 'medium' | 'high';
  max_price?: number;
  created_at: string;
  updated_at: string;
  Game?: Game;
}

export interface AddToWishlistData {
  game_id: number;
  priority?: 'low' | 'medium' | 'high';
  max_price?: number;
}

export interface UpdateWishlistData {
  priority?: 'low' | 'medium' | 'high';
  max_price?: number;
}

export interface WishlistParams extends PaginationParams {
  priority?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const wishlistService = {
  async getWishlist(params?: WishlistParams) {
    const response = await api.get('/wishlist', { params });
    return response.data;
  },

  async checkGame(gameId: number): Promise<{ inWishlist: boolean; item?: WishlistItem }> {
    try {
      const response = await api.get(`/wishlist/check/${gameId}`);
      return { inWishlist: true, item: response.data.data || response.data };
    } catch {
      return { inWishlist: false };
    }
  },

  async addToWishlist(data: AddToWishlistData) {
    const response = await api.post('/wishlist', data);
    return response.data;
  },

  async getItem(id: number) {
    const response = await api.get(`/wishlist/${id}`);
    return response.data;
  },

  async updateItem(id: number, data: UpdateWishlistData) {
    const response = await api.put(`/wishlist/${id}`, data);
    return response.data;
  },

  async removeFromWishlist(id: number) {
    const response = await api.delete(`/wishlist/${id}`);
    return response.data;
  },

  async exportWishlist(format: 'csv' | 'json' = 'json') {
    const response = await api.get('/wishlist/export', { params: { format } });
    return response.data;
  },
};
