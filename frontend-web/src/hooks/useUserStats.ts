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

export const useUserStats = () => {
    const { isAuthenticated } = useAuth();
    const [stats, setStats] = useState<UserStats>(() => ({
        ...defaultStats,
        wishlist: getLocalWishlistCount(),
    }));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        // Always get local wishlist count
        const localWishlistCount = getLocalWishlistCount();

        if (!isAuthenticated) {
            setStats({
                ...defaultStats,
                wishlist: localWishlistCount,
            });
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/users/me/stats');
            if (response.data.success) {
                const serverStats = response.data.data.stats;
                // Use local wishlist count if server returns 0 (fallback to localStorage)
                setStats({
                    ...serverStats,
                    wishlist: serverStats.wishlist > 0 ? serverStats.wishlist : localWishlistCount,
                });
            }
        } catch (err: any) {
            console.error('Error fetching user stats:', err);
            setError(err.response?.data?.message || 'Failed to fetch statistics');
            // On error, at least show local wishlist count
            setStats(prev => ({
                ...prev,
                wishlist: localWishlistCount,
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
                setStats(prev => ({
                    ...prev,
                    wishlist: getLocalWishlistCount(),
                }));
            }
        };

        // Custom event for same-tab updates
        const handleWishlistUpdate = () => {
            setStats(prev => ({
                ...prev,
                wishlist: getLocalWishlistCount(),
            }));
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('wishlist-updated', handleWishlistUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('wishlist-updated', handleWishlistUpdate);
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
