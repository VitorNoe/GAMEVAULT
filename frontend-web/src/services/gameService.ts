import { api } from './api';
import { Game } from '../types/game.types';
import { PaginatedResponse, PaginationParams } from '../types/api.types';

export interface Award {
  id: number;
  name: string;
  slug: string;
  year: number;
  category: string;
  relevance?: number;
  website?: string;
}

export interface GameWithAwards extends Game {
  awards?: Award[];
  developer?: { id: number; name: string; slug: string };
  platforms?: Array<{ id: number; name: string; slug: string }>;
}

export interface UpcomingGameWithCountdown extends Game {
  developer?: { id: number; name: string; slug: string };
  platforms?: Array<{ id: number; name: string; slug: string }>;
  countdown?: {
    release_date: string;
    days_until_release: number;
    is_released: boolean;
    countdown_label: string;
  };
}

export const gameService = {
  async getAllGames(params?: PaginationParams & { 
    search?: string;
    release_status?: string;
    availability_status?: string;
    year?: number;
    sort?: string;
    order?: string;
    awards?: boolean;
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

  async getGotyGames(params?: PaginationParams): Promise<any> {
    const response = await api.get('/games/goty', { params });
    return response.data;
  },

  async getUpcomingReleases(params?: PaginationParams): Promise<PaginatedResponse<Game>> {
    const response = await api.get<PaginatedResponse<Game>>('/games/upcoming-releases', { params });
    return response.data;
  },

  async getUpcomingCountdown(params?: PaginationParams): Promise<any> {
    const response = await api.get('/games/upcoming-countdown', { params });
    return response.data;
  },

  async getReleaseTimeline(params?: PaginationParams & { type?: string }): Promise<any> {
    const response = await api.get('/games/release-timeline', { params });
    return response.data;
  },

  async getGameCountdown(gameId: number): Promise<any> {
    const response = await api.get(`/games/${gameId}/countdown`);
    return response.data;
  },

  async getAbandonwareGames(params?: PaginationParams): Promise<PaginatedResponse<Game>> {
    const response = await api.get<PaginatedResponse<Game>>('/games/abandonware', { params });
    return response.data;
  },
};
