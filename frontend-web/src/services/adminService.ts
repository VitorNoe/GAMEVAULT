import { api } from './api';

import { PaginationParams } from '../types/api.types';

export interface AdminUserParams extends PaginationParams {
  search?: string;
  type?: string;
  is_banned?: boolean;
  email_verified?: boolean;
}

export interface ModerationReviewParams extends PaginationParams {
  status?: string;
  game_id?: number;
  user_id?: number;
}

export interface DashboardReport {
  total_users: number;
  total_games: number;
  total_reviews: number;
  total_collections: number;
  new_users_today: number;
  new_reviews_today: number;
  flagged_reviews: number;
  banned_users: number;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  activity_type: string;
  entity_type: string;
  entity_id: number;
  details?: string;
  created_at: string;
  User?: {
    id: number;
    name: string;
  };
}

export const adminService = {
  // User management
  async getUsers(params?: AdminUserParams) {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  async getUserById(id: number) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  async updateUserRole(id: number, role: 'regular' | 'admin') {
    const response = await api.put(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  async banUser(id: number, reason?: string) {
    const response = await api.post(`/admin/users/${id}/ban`, { reason });
    return response.data;
  },

  async unbanUser(id: number) {
    const response = await api.post(`/admin/users/${id}/unban`);
    return response.data;
  },

  async deleteUser(id: number) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  // Moderation
  async getModerationReviews(params?: ModerationReviewParams) {
    const response = await api.get('/admin/moderation/reviews', { params });
    return response.data;
  },

  async moderateReview(id: number, action: 'approve' | 'flag' | 'remove', reason?: string) {
    const response = await api.put(`/admin/moderation/reviews/${id}`, { action, reason });
    return response.data;
  },

  async deleteReview(id: number, reason?: string) {
    const response = await api.delete(`/admin/moderation/reviews/${id}`, { data: { reason } });
    return response.data;
  },

  async deleteGame(id: number, reason?: string) {
    const response = await api.delete(`/admin/moderation/games/${id}`, { data: { reason } });
    return response.data;
  },

  async getModerationLog(params?: PaginationParams & { entity_type?: string; admin_id?: number }) {
    const response = await api.get('/admin/moderation/log', { params });
    return response.data;
  },

  // Activity logs
  async getActivityLogs(params?: PaginationParams & { activity_type?: string; entity_type?: string; user_id?: number }) {
    const response = await api.get('/admin/activity-logs', { params });
    return response.data;
  },

  // Reports
  async getDashboard(): Promise<DashboardReport> {
    const response = await api.get('/admin/reports/dashboard');
    return response.data.data || response.data;
  },

  async getTopGames(limit?: number) {
    const response = await api.get('/admin/reports/top-games', { params: { limit } });
    return response.data;
  },

  async getMostReviewed(limit?: number) {
    const response = await api.get('/admin/reports/most-reviewed', { params: { limit } });
    return response.data;
  },

  async getActiveUsers(limit?: number) {
    const response = await api.get('/admin/reports/active-users', { params: { limit } });
    return response.data;
  },

  async getRegistrationTrend() {
    const response = await api.get('/admin/reports/registration-trend');
    return response.data;
  },

  async getReviewTrend() {
    const response = await api.get('/admin/reports/review-trend');
    return response.data;
  },

  // Report exports (CSV / PDF)
  async exportReport(report: string, format: 'csv' | 'pdf' = 'csv', limit?: number) {
    const response = await api.get(`/admin/reports/export/${report}`, {
      params: { format, limit },
      responseType: 'blob',
    });
    return response;
  },

  async exportDashboard(format: 'csv' | 'pdf' = 'csv') {
    const response = await api.get('/admin/reports/export/dashboard', {
      params: { format },
      responseType: 'blob',
    });
    return response;
  },
};
