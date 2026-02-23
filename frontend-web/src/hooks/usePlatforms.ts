import { useState, useEffect, useCallback } from 'react';
import { platformService } from '../services/platformService';
import { Platform } from '../types/game.types';

interface UsePlatformsOptions {
  /** Fetch all platforms without pagination (for dropdowns). Default: false */
  all?: boolean;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface UsePlatformsReturn {
  platforms: Platform[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  refetch: () => void;
}

/**
 * Hook for fetching and managing the platform list.
 * Supports pagination, filtering by type/search, and "fetch all" mode for dropdowns.
 */
export const usePlatforms = (options: UsePlatformsOptions = {}): UsePlatformsReturn => {
  const { all = false, type, search, page = 1, limit = 20 } = options;

  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UsePlatformsReturn['pagination']>(null);

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (all) params.all = true;
      if (type) params.type = type;
      if (search) params.search = search;
      if (!all) {
        params.page = page;
        params.limit = limit;
      }

      const response = await platformService.getAllPlatforms(params);
      const data = response.data;
      setPlatforms(data.platforms ?? []);
      setPagination(data.pagination ?? null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || 'Error fetching platforms';
      setError(message);
      setPlatforms([]);
    } finally {
      setLoading(false);
    }
  }, [all, type, search, page, limit]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  return { platforms, loading, error, pagination, refetch: fetchPlatforms };
};

export default usePlatforms;
