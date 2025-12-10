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
}

export interface Platform {
  id: number;
  name: string;
  slug: string;
  manufacturer?: string;
  type: 'console' | 'handheld' | 'pc' | 'mobile';
  generation?: number;
  release_year?: number;
  logo_url?: string;
  primary_color?: string;
}
