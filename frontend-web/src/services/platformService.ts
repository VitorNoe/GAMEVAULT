import { api } from './api';
import { Platform, GamePlatform, GamePlatformInput } from '../types/game.types';
import { PaginatedResponse, PaginationParams, ApiResponse } from '../types/api.types';

export const platformService = {
  /**
   * Get all platforms (paginated).
   * Pass `all: true` in params to get all platforms without pagination (for dropdowns).
   */
  async getAllPlatforms(params?: PaginationParams & {
    search?: string;
    type?: string;
    manufacturer?: string;
    generation?: number;
    all?: boolean;
  }): Promise<PaginatedResponse<Platform>> {
    const response = await api.get<PaginatedResponse<Platform>>('/platforms', { params });
    return response.data;
  },

  /**
   * Get a single platform by ID (includes game_count).
   */
  async getPlatformById(id: number): Promise<Platform> {
    const response = await api.get<ApiResponse<{ platform: Platform }>>(`/platforms/${id}`);
    return response.data.data!.platform;
  },

  /**
   * Get games for a specific platform with per-platform release info.
   */
  async getPlatformGames(platformId: number, params?: PaginationParams): Promise<{
    platform: Platform;
    games: Array<any>;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const response = await api.get(`/platforms/${platformId}/games`, { params });
    return response.data.data;
  },

  /**
   * Get platforms for a specific game with release dates & exclusivity.
   */
  async getGamePlatforms(gameId: number): Promise<{
    game: { id: number; title: string; slug: string };
    platforms: GamePlatform[];
  }> {
    const response = await api.get(`/games/${gameId}/platforms`);
    return response.data.data;
  },

  /**
   * Set/replace all platform associations for a game (admin).
   */
  async setGamePlatforms(gameId: number, platforms: GamePlatformInput[]): Promise<{
    platforms: Array<{ platform_id: number; platform: Platform; platform_release_date: string | null; exclusivity: string }>;
  }> {
    const response = await api.post(`/games/${gameId}/platforms`, { platforms });
    return response.data.data;
  },

  /**
   * Remove a single platform association from a game (admin).
   */
  async removeGamePlatform(gameId: number, platformId: number): Promise<void> {
    await api.delete(`/games/${gameId}/platforms/${platformId}`);
  },

  /**
   * Create a new platform (admin).
   */
  async createPlatform(data: Omit<Platform, 'id' | 'game_count'>): Promise<Platform> {
    const response = await api.post<ApiResponse<{ platform: Platform }>>('/platforms', data);
    return response.data.data!.platform;
  },

  /**
   * Update a platform (admin).
   */
  async updatePlatform(id: number, data: Partial<Platform>): Promise<Platform> {
    const response = await api.put<ApiResponse<{ platform: Platform }>>(`/platforms/${id}`, data);
    return response.data.data!.platform;
  },

  /**
   * Delete a platform (admin). Fails if games are associated.
   */
  async deletePlatform(id: number): Promise<void> {
    await api.delete(`/platforms/${id}`);
  },
};
