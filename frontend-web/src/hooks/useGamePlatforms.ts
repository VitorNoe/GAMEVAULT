import { useState, useEffect, useCallback } from 'react';
import { platformService } from '../services/platformService';
import { GamePlatform, GamePlatformInput } from '../types/game.types';

interface UseGamePlatformsReturn {
  platforms: GamePlatform[];
  loading: boolean;
  error: string | null;
  /** Replace all platform associations for the game (admin). */
  setGamePlatforms: (platforms: GamePlatformInput[]) => Promise<void>;
  /** Remove a single platform association (admin). */
  removePlatform: (platformId: number) => Promise<void>;
  refetch: () => void;
}

/**
 * Hook for managing the N:N relationship between a game and its platforms.
 * Provides the platform list with per-platform release dates & exclusivity,
 * plus admin mutation methods.
 */
export const useGamePlatforms = (gameId: number | null): UseGamePlatformsReturn => {
  const [platforms, setPlatforms] = useState<GamePlatform[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlatforms = useCallback(async () => {
    if (!gameId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await platformService.getGamePlatforms(gameId);
      setPlatforms(data.platforms ?? []);
    } catch (err: any) {
      const message = err?.response?.data?.message || err.message || 'Error fetching game platforms';
      setError(message);
      setPlatforms([]);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const setGamePlatforms = useCallback(
    async (input: GamePlatformInput[]) => {
      if (!gameId) return;
      setError(null);
      try {
        await platformService.setGamePlatforms(gameId, input);
        await fetchPlatforms(); // refresh
      } catch (err: any) {
        const message = err?.response?.data?.message || err.message || 'Error setting game platforms';
        setError(message);
        throw err;
      }
    },
    [gameId, fetchPlatforms],
  );

  const removePlatform = useCallback(
    async (platformId: number) => {
      if (!gameId) return;
      setError(null);
      try {
        await platformService.removeGamePlatform(gameId, platformId);
        setPlatforms(prev => prev.filter(p => p.id !== platformId));
      } catch (err: any) {
        const message = err?.response?.data?.message || err.message || 'Error removing platform';
        setError(message);
        throw err;
      }
    },
    [gameId],
  );

  return {
    platforms,
    loading,
    error,
    setGamePlatforms,
    removePlatform,
    refetch: fetchPlatforms,
  };
};

export default useGamePlatforms;
