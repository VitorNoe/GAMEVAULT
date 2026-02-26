import { api } from './api';
import { Game } from '../types/game.types';
import { PaginationParams } from '../types/api.types';

export interface CollectionItem {
  id: number;
  user_id: number;
  game_id: number;
  platform_id: number;
  status: 'owned' | 'playing' | 'completed' | 'dropped' | 'backlog';
  format?: 'physical' | 'digital';
  rating?: number;
  price_paid?: number;
  created_at: string;
  updated_at: string;
  Game?: Game;
  Platform?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface CollectionStats {
  total: number;
  by_status: Record<string, number>;
  by_format: Record<string, number>;
  by_platform: Array<{ platform: string; count: number }>;
  total_spent: number;
  average_rating: number;
}

export interface AddToCollectionData {
  game_id: number;
  platform_id: number;
  status?: string;
  format?: string;
  rating?: number;
  price_paid?: number;
}

export interface UpdateCollectionData {
  status?: string;
  rating?: number;
  price_paid?: number;
}

export interface CollectionParams extends PaginationParams {
  status?: string;
  format?: string;
  platform_id?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const collectionService = {
  async getCollection(params?: CollectionParams) {
    const response = await api.get('/collection', { params });
    return response.data;
  },

  async getStats(): Promise<CollectionStats> {
    const response = await api.get('/collection/stats');
    return response.data.data || response.data;
  },

  async getStatistics() {
    const response = await api.get('/collection/statistics');
    return response.data.data || response.data;
  },

  async getGameStatus(gameId: number) {
    const response = await api.get(`/collection/status/${gameId}`);
    return response.data;
  },

  async addToCollection(data: AddToCollectionData) {
    const response = await api.post('/collection', data);
    return response.data;
  },

  async updateItem(id: number, data: UpdateCollectionData) {
    const response = await api.put(`/collection/${id}`, data);
    return response.data;
  },

  async removeFromCollection(id: number) {
    const response = await api.delete(`/collection/${id}`);
    return response.data;
  },

  async exportCollection(format: 'csv' | 'json' | 'pdf' = 'json') {
    if (format === 'pdf') {
      const response = await api.get('/collection/export', {
        params: { format },
        responseType: 'blob',
      });
      return response;
    }
    const response = await api.get('/collection/export', { params: { format } });
    return response.data;
  },
};
