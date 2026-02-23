/**
 * RAWG API Service Client
 *
 * Wraps the RAWG.io video-games database API (https://rawg.io/apidocs).
 *
 * Features:
 *  - Search games with in-memory caching (5 min TTL for search, 15 min for details)
 *  - Fetch full game details by RAWG ID
 *  - Automatic retry on 429 (rate-limit) with exponential back-off
 *  - Cache fallback: returns stale cached data when the API is unavailable
 *  - Request deduplication within the same tick
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import config from '../config/app';
import MemoryCache from '../utils/cache';

// ──────────────────────────────────────────────
// Types for RAWG API responses
// ──────────────────────────────────────────────

export interface RawgSearchResult {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  metacritic: number | null;
  rating: number;
  ratings_count: number;
  platforms: Array<{ platform: { id: number; name: string; slug: string } }> | null;
  genres: Array<{ id: number; name: string; slug: string }> | null;
  short_screenshots: Array<{ id: number; image: string }> | null;
}

export interface RawgSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgSearchResult[];
}

export interface RawgGameDetail {
  id: number;
  slug: string;
  name: string;
  name_original: string;
  description: string;
  description_raw: string;
  released: string | null;
  tba: boolean;
  background_image: string | null;
  background_image_additional: string | null;
  metacritic: number | null;
  metacritic_url: string | null;
  rating: number;
  ratings_count: number;
  playtime: number;
  screenshots_count: number;
  movies_count: number;
  esrb_rating: { id: number; name: string; slug: string } | null;
  platforms: Array<{
    platform: { id: number; name: string; slug: string };
    released_at: string | null;
    requirements: { minimum?: string; recommended?: string } | null;
  }> | null;
  developers: Array<{ id: number; name: string; slug: string; image_background: string | null }> | null;
  publishers: Array<{ id: number; name: string; slug: string; image_background: string | null }> | null;
  genres: Array<{ id: number; name: string; slug: string }> | null;
  tags: Array<{ id: number; name: string; slug: string }> | null;
  website: string | null;
  reddit_url: string | null;
  clip: { clip: string; video: string } | null;
}

export interface RawgScreenshotsResponse {
  count: number;
  results: Array<{ id: number; image: string; width: number; height: number }>;
}

// ──────────────────────────────────────────────
// Dedicated cache for RAWG data (longer TTL)
// ──────────────────────────────────────────────

/** Search results: 5 min TTL */
const SEARCH_TTL = 300;
/** Game details: 15 min TTL */
const DETAIL_TTL = 900;
/** Stale fallback: data kept for 24 h after TTL expired */
const STALE_TTL = 86_400;

export const rawgCache = new MemoryCache(SEARCH_TTL);
/** Secondary stale store – used when RAWG API is unavailable */
const rawgStaleStore = new MemoryCache(STALE_TTL);

// ──────────────────────────────────────────────
// HTTP client with retry logic
// ──────────────────────────────────────────────

const BASE_URL = 'https://api.rawg.io/api';

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 15_000,
    params: { key: config.rawgApiKey },
  });

  return client;
}

const client = createClient();

/**
 * Execute an API request with retries + cache fallback.
 */
async function rawgGet<T>(path: string, params: Record<string, any> = {}, cacheKey: string, ttl: number): Promise<T> {
  // 1. Try fresh cache
  const cached = rawgCache.get<T>(cacheKey);
  if (cached) return cached;

  // 2. Call API with retry
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await client.get<T>(path, { params });
      // Cache fresh + stale
      rawgCache.set(cacheKey, res.data, ttl);
      rawgStaleStore.set(cacheKey, res.data, STALE_TTL);
      return res.data;
    } catch (err) {
      lastError = err as Error;
      const axErr = err as AxiosError;
      if (axErr.response?.status === 429) {
        // Rate limited – wait exponentially
        const wait = Math.pow(2, attempt) * 1000;
        console.warn(`⚠️ RAWG rate-limited. Retrying in ${wait}ms (attempt ${attempt + 1}/3)`);
        await sleep(wait);
        continue;
      }
      // Non-retriable error → break immediately
      break;
    }
  }

  // 3. Cache fallback (stale)
  const stale = rawgStaleStore.get<T>(cacheKey);
  if (stale) {
    console.warn(`⚠️ RAWG API unavailable. Returning stale cached data for key: ${cacheKey}`);
    return stale;
  }

  throw lastError ?? new Error('RAWG API request failed');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Search RAWG for games by query string.
 */
export async function searchRawg(
  query: string,
  page = 1,
  pageSize = 20,
): Promise<RawgSearchResponse> {
  const cacheKey = `rawg:search:${query.toLowerCase().trim()}:p${page}:s${pageSize}`;
  return rawgGet<RawgSearchResponse>(
    '/games',
    { search: query, page, page_size: pageSize, search_precise: true },
    cacheKey,
    SEARCH_TTL,
  );
}

/**
 * Get full details for a single RAWG game by its RAWG ID.
 */
export async function getRawgGameDetail(rawgId: number): Promise<RawgGameDetail> {
  const cacheKey = `rawg:detail:${rawgId}`;
  return rawgGet<RawgGameDetail>(`/games/${rawgId}`, {}, cacheKey, DETAIL_TTL);
}

/**
 * Get screenshots for a RAWG game.
 */
export async function getRawgScreenshots(rawgId: number): Promise<RawgScreenshotsResponse> {
  const cacheKey = `rawg:screenshots:${rawgId}`;
  return rawgGet<RawgScreenshotsResponse>(`/games/${rawgId}/screenshots`, {}, cacheKey, DETAIL_TTL);
}

/**
 * Map RAWG game detail to local Game creation attributes.
 */
export function mapRawgToGameFields(detail: RawgGameDetail): Record<string, any> {
  const releaseDate = detail.released || null;
  const releaseYear = releaseDate ? parseInt(releaseDate.split('-')[0], 10) : null;

  let releaseStatus: string = 'released';
  if (detail.tba) {
    releaseStatus = 'coming_soon';
  } else if (!releaseDate) {
    releaseStatus = 'in_development';
  } else {
    const rd = new Date(releaseDate);
    releaseStatus = rd > new Date() ? 'coming_soon' : 'released';
  }

  let ageRating: string | null = null;
  if (detail.esrb_rating) {
    ageRating = detail.esrb_rating.name;
  }

  return {
    title: detail.name,
    slug: detail.slug,
    description: detail.description_raw || detail.description || null,
    cover_url: detail.background_image || null,
    banner_url: detail.background_image_additional || null,
    release_date: releaseDate,
    release_year: releaseYear,
    release_status: releaseStatus,
    availability_status: 'available',
    metacritic_score: detail.metacritic || null,
    age_rating: ageRating,
    rawg_id: detail.id,
    average_rating: detail.rating || null,
    total_reviews: detail.ratings_count || 0,
    trailer_url: detail.clip?.clip || detail.clip?.video || null,
  };
}

/**
 * Extract developer/publisher names from RAWG detail (for findOrCreate).
 */
export function extractCompanies(detail: RawgGameDetail): {
  developers: Array<{ name: string; slug: string }>;
  publishers: Array<{ name: string; slug: string }>;
} {
  return {
    developers: (detail.developers || []).map(d => ({ name: d.name, slug: d.slug })),
    publishers: (detail.publishers || []).map(p => ({ name: p.name, slug: p.slug })),
  };
}

/**
 * Extract genre slugs from RAWG detail (for findOrCreate).
 */
export function extractGenres(detail: RawgGameDetail): Array<{ name: string; slug: string }> {
  return (detail.genres || []).map(g => ({ name: g.name, slug: g.slug }));
}

export default {
  searchRawg,
  getRawgGameDetail,
  getRawgScreenshots,
  mapRawgToGameFields,
  extractCompanies,
  extractGenres,
  rawgCache,
};
