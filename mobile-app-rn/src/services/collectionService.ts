import { api } from './api';
import {
  CollectionItem,
  CollectionStats,
  AddToCollectionData,
  UpdateCollectionData,
  PaginationParams,
} from '../types';

export interface CollectionParams extends PaginationParams {
  status?: string;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export const collectionService = {
  async getCollection(params?: CollectionParams): Promise<any> {
    return api.get('/collection', params);
  },

  async getStats(): Promise<CollectionStats> {
    const response = await api.get('/collection/stats');
    return response.data || response;
  },

  async getGameStatus(gameId: number): Promise<CollectionItem | null> {
    try {
      const response = await api.get(`/collection/status/${gameId}`);
      return response.data || response;
    } catch {
      return null;
    }
  },

  async addToCollection(data: AddToCollectionData): Promise<CollectionItem> {
    const response = await api.post('/collection', data);
    return response.data || response;
  },

  async updateItem(id: number, data: UpdateCollectionData): Promise<CollectionItem> {
    const response = await api.put(`/collection/${id}`, data);
    return response.data || response;
  },

  async removeFromCollection(id: number): Promise<void> {
    await api.delete(`/collection/${id}`);
  },
};
