import { api } from './api';
import { PaginationParams } from '../types/api.types';

export interface PreservationSource {
  id: number;
  name: string;
  slug: string;
  url: string;
  source_type: 'museum' | 'archive' | 'organization';
  logo_url?: string;
  description?: string;
  created_at?: string;
}

export interface GamePreservationLink {
  game_id: number;
  source_id: number;
  available: boolean;
  specific_url?: string;
  notes?: string;
  source?: PreservationSource;
  created_at?: string;
}

export interface RereleaseRequest {
  id: number;
  game_id: number;
  total_votes: number;
  status: 'active' | 'fulfilled' | 'archived';
  fulfilled_date?: string;
  created_at: string;
  updated_at: string;
  Game?: {
    id: number;
    title: string;
    slug: string;
    cover_url?: string;
    release_year?: number;
    developer?: { id: number; name: string; slug: string };
  };
  votes?: Array<{
    request_id: number;
    user_id: number;
    comment?: string;
    vote_date: string;
    User?: { id: number; username: string };
  }>;
}

export interface RereleaseParams extends PaginationParams {
  status?: 'active' | 'fulfilled' | 'archived';
}

export const preservationService = {
  // Preservation Sources
  async getSources(params?: { source_type?: string; search?: string }) {
    const response = await api.get('/preservation/sources', { params });
    return response.data;
  },

  async getSourceById(id: number) {
    const response = await api.get(`/preservation/sources/${id}`);
    return response.data;
  },

  async getGamePreservation(gameId: number) {
    const response = await api.get(`/preservation/games/${gameId}`);
    return response.data;
  },

  // Re-release Requests & Voting
  async getRereleases(params?: RereleaseParams) {
    const response = await api.get('/rereleases', { params });
    return response.data;
  },

  async getMostVoted(limit: number = 20) {
    const response = await api.get('/rereleases/most-voted', { params: { limit } });
    return response.data;
  },

  async getRereleaseById(id: number) {
    const response = await api.get(`/rereleases/${id}`);
    return response.data;
  },

  async createRerelease(gameId: number) {
    const response = await api.post('/rereleases', { game_id: gameId });
    return response.data;
  },

  async vote(gameId: number, comment?: string) {
    const response = await api.post(`/rereleases/${gameId}/vote`, { comment });
    return response.data;
  },

  async removeVote(gameId: number) {
    const response = await api.delete(`/rereleases/${gameId}/vote`);
    return response.data;
  },
};
