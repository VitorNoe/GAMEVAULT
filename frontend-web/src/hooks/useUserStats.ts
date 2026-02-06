import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './useAuth';

export interface UserStats {
    collection: number;
    wishlist: number;
    playing: number;
    completed: number;
    reviews: number;
    notifications: number;
}

const defaultStats: UserStats = {
    collection: 0,
    wishlist: 0,
    playing: 0,
    completed: 0,
    reviews: 0,
    notifications: 0,
};

// Get wishlist count from localStorage
const getLocalWishlistCount = (): number => {
    try {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        return Array.isArray(wishlist) ? wishlist.length : 0;
    } catch {
        return 0;
    }
};

// Get playing now count from localStorage
const getLocalPlayingCount = (): number => {
    try {
        const playing = JSON.parse(localStorage.getItem('playing_now') || '[]');
        return Array.isArray(playing) ? playing.length : 0;
    } catch {
        return 0;
    }
};

// Get completed count from localStorage
const getLocalCompletedCount = (): number => {
    try {
        const completed = JSON.parse(localStorage.getItem('completed') || '[]');
        return Array.isArray(completed) ? completed.length : 0;
    } catch {
        return 0;
    }
};

export const useUserStats = () => {
    const { isAuthenticated } = useAuth();
    const [stats, setStats] = useState<UserStats>(() => ({
        ...defaultStats,
        wishlist: getLocalWishlistCount(),
        playing: getLocalPlayingCount(),
        completed: getLocalCompletedCount(),
    }));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        // Always get local counts
        const localWishlistCount = getLocalWishlistCount();
        const localPlayingCount = getLocalPlayingCount();
        const localCompletedCount = getLocalCompletedCount();

        if (!isAuthenticated) {
            setStats({
                ...defaultStats,
                wishlist: localWishlistCount,
                playing: localPlayingCount,
                completed: localCompletedCount,
            });
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/users/me/stats');
            if (response.data.success) {
                const serverStats = response.data.data.stats;
                // Use local counts if server returns 0 (fallback to localStorage)
                setStats({
                    ...serverStats,
                    wishlist: serverStats.wishlist > 0 ? serverStats.wishlist : localWishlistCount,
                    playing: serverStats.playing > 0 ? serverStats.playing : localPlayingCount,
                    completed: serverStats.completed > 0 ? serverStats.completed : localCompletedCount,
                });
            }
        } catch (err: any) {
            console.error('Error fetching user stats:', err);
            setError(err.response?.data?.message || 'Failed to fetch statistics');
            // On error, at least show local counts
            setStats(prev => ({
                ...prev,
                wishlist: localWishlistCount,
                playing: localPlayingCount,
                completed: localCompletedCount,
            }));
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // Fetch stats on mount and when auth changes
    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Listen for localStorage changes (wishlist updates)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'wishlist') {
                setStats(prev => ({ ...prev, wishlist: getLocalWishlistCount() }));
            }
            if (e.key === 'playing_now') {
                setStats(prev => ({ ...prev, playing: getLocalPlayingCount() }));
            }
            if (e.key === 'completed') {
                setStats(prev => ({ ...prev, completed: getLocalCompletedCount() }));
            }
        };

        // Custom events for same-tab updates
        const handleWishlistUpdate = () => {
            setStats(prev => ({ ...prev, wishlist: getLocalWishlistCount() }));
        };
        const handlePlayingUpdate = () => {
            setStats(prev => ({ ...prev, playing: getLocalPlayingCount() }));
        };
        const handleCompletedUpdate = () => {
            setStats(prev => ({ ...prev, completed: getLocalCompletedCount() }));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('wishlist-updated', handleWishlistUpdate);
        window.addEventListener('playing-updated', handlePlayingUpdate);
        window.addEventListener('completed-updated', handleCompletedUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('wishlist-updated', handleWishlistUpdate);
            window.removeEventListener('playing-updated', handlePlayingUpdate);
            window.removeEventListener('completed-updated', handleCompletedUpdate);
        };
    }, []);

    // Auto-refresh every 60 seconds when authenticated
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated, fetchStats]);

    // Function to manually refresh stats
    const refreshStats = useCallback(() => {
        fetchStats();
    }, [fetchStats]);

    // Format number for display (e.g., 1000 -> 1k)
    const formatCount = useCallback((count: number): string => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        }
        return count.toString();
    }, []);

    return {
        stats,
        loading,
        error,
        refreshStats,
        formatCount,
    };
};

export default useUserStats;
