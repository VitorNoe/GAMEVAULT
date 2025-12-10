import { api } from './api';
import { Game } from '../types/game.types';
import { PaginatedResponse, PaginationParams } from '../types/api.types';

export const gameService = {
  async getAllGames(params?: PaginationParams & { 
    search?: string;
    release_status?: string;
    availability_status?: string;
    year?: number;
  }): Promise<PaginatedResponse<Game>> {
    const response = await api.get<PaginatedResponse<Game>>('/games', { params });
    return response.data;
  },

  async getGameById(id: number): Promise<Game> {
    const response = await api.get(`/games/${id}`);
    return response.data.data.game;
  },

  async searchGames(query: string, params?: PaginationParams): Promise<PaginatedResponse<Game>> {
    const response = await api.get<PaginatedResponse<Game>>('/games/search', {
      params: { q: query, ...params },
    });
    return response.data;
  },

  async getUpcomingReleases(params?: PaginationParams): Promise<PaginatedResponse<Game>> {
    const response = await api.get<PaginatedResponse<Game>>('/games/upcoming-releases', { params });
    return response.data;
  },

  async getAbandonwareGames(params?: PaginationParams): Promise<PaginatedResponse<Game>> {
    const response = await api.get<PaginatedResponse<Game>>('/games/abandonware', { params });
    return response.data;
  },
};
