// ===== API Types =====
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    games?: T[];
    items?: T[];
    platforms?: T[];
    pagination: Pagination;
  };
}

// ===== User Types =====
export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  type: 'user' | 'admin';
  is_banned?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ===== Game Types =====
export type ReleaseStatus =
  | 'released'
  | 'early_access'
  | 'open_beta'
  | 'closed_beta'
  | 'alpha'
  | 'coming_soon'
  | 'in_development'
  | 'cancelled';

export type AvailabilityStatus =
  | 'available'
  | 'out_of_catalog'
  | 'expired_license'
  | 'abandonware'
  | 'public_domain'
  | 'discontinued'
  | 'rereleased';

export interface Game {
  id: number;
  title: string;
  slug: string;
  description?: string;
  synopsis?: string;
  release_year?: number;
  release_date?: string;
  cover_url?: string;
  banner_url?: string;
  trailer_url?: string;
  developer_id?: number;
  publisher_id?: number;
  release_status: ReleaseStatus;
  availability_status: AvailabilityStatus;
  age_rating?: string;
  average_rating?: number;
  total_reviews: number;
  is_early_access?: boolean;
  was_rereleased?: boolean;
  metacritic_score?: number;
  created_at: string;
  updated_at: string;
  developer?: { id: number; name: string; slug: string };
  platforms?: GamePlatform[];
  awards?: Award[];
}

export interface GamePlatform {
  id: number;
  name: string;
  slug: string;
  manufacturer?: string;
  type: 'console' | 'handheld' | 'pc' | 'mobile';
}

export interface Award {
  id: number;
  name: string;
  slug: string;
  year: number;
  category: string;
  relevance?: number;
}

// ===== Collection Types =====
export type CollectionStatus =
  | 'playing'
  | 'completed'
  | 'owned'
  | 'backlog'
  | 'dropped'
  | 'paused'
  | 'abandoned'
  | 'not_started'
  | 'wishlist';

export interface CollectionItem {
  id: number;
  user_id: number;
  game_id: number;
  platform_id?: number;
  status: CollectionStatus;
  format: 'physical' | 'digital';
  hours_played?: number;
  personal_notes?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  Game?: Game;
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
  status?: CollectionStatus;
  format?: 'physical' | 'digital';
  platform_id?: number;
}

export interface UpdateCollectionData {
  status?: CollectionStatus;
  format?: 'physical' | 'digital';
  hours_played?: number;
  personal_notes?: string;
  rating?: number;
}

// ===== Wishlist Types =====
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

// ===== Notification Types =====
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'release' | 'wishlist' | 'collection' | 'system';
  data?: Record<string, any>;
  read: boolean;
  timestamp: string;
}

// ===== Constants =====
export const RELEASE_STATUS_LABELS: Record<ReleaseStatus, string> = {
  released: 'Released',
  early_access: 'Early Access',
  open_beta: 'Open Beta',
  closed_beta: 'Closed Beta',
  alpha: 'Alpha',
  coming_soon: 'Coming Soon',
  in_development: 'In Development',
  cancelled: 'Cancelled',
};

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  available: 'Available',
  out_of_catalog: 'Out of Catalog',
  expired_license: 'Expired License',
  abandonware: 'Abandonware',
  public_domain: 'Public Domain',
  discontinued: 'Discontinued',
  rereleased: 'Re-released',
};

export const COLLECTION_STATUS_LABELS: Record<string, string> = {
  playing: 'Playing',
  completed: 'Completed',
  owned: 'Owned',
  backlog: 'Backlog',
  dropped: 'Dropped',
  paused: 'Paused',
  abandoned: 'Abandoned',
  not_started: 'Not Started',
  wishlist: 'Wishlist',
};
