import { api } from './api';
import { Game, PaginationParams } from '../types';

export interface GameSearchParams extends PaginationParams {
  search?: string;
  release_status?: string;
  availability_status?: string;
  year?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
  awards?: boolean;
}

export interface PaginatedGames {
  games: Game[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const gameService = {
  async getAllGames(params?: GameSearchParams): Promise<PaginatedGames> {
    const response = await api.get('/games', params);
    return response.data || response;
  },

  async getGameById(id: number): Promise<Game> {
    const response = await api.get(`/games/${id}`);
    const data = response.data || response;
    return data.game || data;
  },

  async searchGames(query: string, params?: PaginationParams): Promise<PaginatedGames> {
    const response = await api.get('/games/search', { q: query, ...params });
    return response.data || response;
  },

  async getUpcomingReleases(params?: PaginationParams): Promise<PaginatedGames> {
    const response = await api.get('/games/upcoming-releases', params);
    return response.data || response;
  },

  async getUpcomingCountdown(params?: PaginationParams): Promise<PaginatedGames> {
    const response = await api.get('/games/upcoming-countdown', params);
    return response.data || response;
  },

  async getAbandonwareGames(params?: PaginationParams): Promise<PaginatedGames> {
    const response = await api.get('/games/abandonware', params);
    return response.data || response;
  },

  async getGotyGames(params?: PaginationParams): Promise<PaginatedGames> {
    const response = await api.get('/games/goty', params);
    return response.data || response;
  },
};
