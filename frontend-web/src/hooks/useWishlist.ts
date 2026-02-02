import { useState, useEffect, useCallback, useMemo } from 'react';

const WISHLIST_KEY = 'gamevault_wishlist';

interface WishlistItem {
    id: number;
    title: string;
    cover_url?: string;
    addedAt: string;
}

interface UseWishlistReturn {
    wishlist: WishlistItem[];
    wishlistIds: Set<number>;
    addToWishlist: (game: { id: number; title: string; cover_url?: string }) => void;
    removeFromWishlist: (gameId: number) => void;
    isInWishlist: (gameId: number) => boolean;
    toggleWishlist: (game: { id: number; title: string; cover_url?: string }) => void;
    clearWishlist: () => void;
    wishlistCount: number;
}

/**
 * Custom hook for managing wishlist state with localStorage persistence
 */
export const useWishlist = (): UseWishlistReturn => {
    const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
        try {
            const stored = localStorage.getItem(WISHLIST_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever wishlist changes
    useEffect(() => {
        try {
            localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
            // Also update legacy format for useUserStats compatibility
            localStorage.setItem('wishlist', JSON.stringify(wishlist.map(item => item.id)));
            // Dispatch custom event for same-tab updates
            window.dispatchEvent(new Event('wishlist-updated'));
        } catch (error) {
            console.error('Failed to save wishlist to localStorage:', error);
        }
    }, [wishlist]);

    // Memoized Set for O(1) lookups
    const wishlistIds = useMemo(() => {
        return new Set(wishlist.map(item => item.id));
    }, [wishlist]);

    const addToWishlist = useCallback((game: { id: number; title: string; cover_url?: string }) => {
        setWishlist(prev => {
            if (prev.some(item => item.id === game.id)) {
                return prev;
            }
            return [
                ...prev,
                {
                    id: game.id,
                    title: game.title,
                    cover_url: game.cover_url,
                    addedAt: new Date().toISOString()
                }
            ];
        });
    }, []);

    const removeFromWishlist = useCallback((gameId: number) => {
        setWishlist(prev => prev.filter(item => item.id !== gameId));
    }, []);

    const isInWishlist = useCallback((gameId: number): boolean => {
        return wishlistIds.has(gameId);
    }, [wishlistIds]);

    const toggleWishlist = useCallback((game: { id: number; title: string; cover_url?: string }) => {
        if (wishlistIds.has(game.id)) {
            removeFromWishlist(game.id);
        } else {
            addToWishlist(game);
        }
    }, [wishlistIds, addToWishlist, removeFromWishlist]);

    const clearWishlist = useCallback(() => {
        setWishlist([]);
    }, []);

    const wishlistCount = wishlist.length;

    return {
        wishlist,
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        wishlistCount
    };
};

export default useWishlist;
