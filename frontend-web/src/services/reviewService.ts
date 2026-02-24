import { api } from './api';
import { PaginationParams } from '../types/api.types';

export interface Review {
  id: number;
  user_id: number;
  game_id: number;
  platform_id?: number;
  rating: number;
  review_text?: string;
  has_spoilers: boolean;
  hours_played?: number;
  recommends?: boolean;
  likes_count: number;
  dislikes_count: number;
  moderation_status?: string;
  created_at: string;
  updated_at: string;
  User?: {
    id: number;
    name: string;
    avatar_url?: string;
  };
  Platform?: {
    id: number;
    name: string;
  };
  userLike?: 'like' | 'dislike' | null;
}

export interface CreateReviewData {
  game_id: number;
  rating: number;
  platform_id?: number;
  review_text?: string;
  has_spoilers?: boolean;
  hours_played?: number;
  recommends?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  review_text?: string;
  has_spoilers?: boolean;
  hours_played?: number;
  recommends?: boolean;
  platform_id?: number;
}

export interface ReviewParams extends PaginationParams {
  sort?: string;
  order?: 'ASC' | 'DESC';
  has_spoilers?: boolean;
  recommends?: boolean;
  min_rating?: number;
  max_rating?: number;
}

export const reviewService = {
  async getGameReviews(gameId: number, params?: ReviewParams) {
    const response = await api.get(`/reviews/game/${gameId}`, { params });
    return response.data;
  },

  async getUserReviews(userId: number, params?: PaginationParams) {
    const response = await api.get(`/reviews/user/${userId}`, { params });
    return response.data;
  },

  async getReviewById(id: number) {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  async createReview(data: CreateReviewData) {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  async updateReview(id: number, data: UpdateReviewData) {
    const response = await api.put(`/reviews/${id}`, data);
    return response.data;
  },

  async deleteReview(id: number) {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  },

  async likeReview(id: number, likeType: 'like' | 'dislike') {
    const response = await api.post(`/reviews/${id}/like`, { like_type: likeType });
    return response.data;
  },

  async removeLike(id: number) {
    const response = await api.delete(`/reviews/${id}/like`);
    return response.data;
  },
};
