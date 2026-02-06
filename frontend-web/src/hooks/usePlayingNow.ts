import { useState, useEffect, useCallback, useMemo } from 'react';

const PLAYING_KEY = 'gamevault_playing_now';

interface PlayingItem {
    id: number;
    title: string;
    cover_url?: string;
    addedAt: string;
}

interface UsePlayingNowReturn {
    playingList: PlayingItem[];
    playingIds: Set<number>;
    addToPlaying: (game: { id: number; title: string; cover_url?: string }) => void;
    removeFromPlaying: (gameId: number) => void;
    isPlaying: (gameId: number) => boolean;
    togglePlaying: (game: { id: number; title: string; cover_url?: string }) => void;
    clearPlaying: () => void;
    playingCount: number;
}

/**
 * Custom hook for managing "Playing Now" state with localStorage persistence
 */
export const usePlayingNow = (): UsePlayingNowReturn => {
    const [playingList, setPlayingList] = useState<PlayingItem[]>(() => {
        try {
            const stored = localStorage.getItem(PLAYING_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever list changes
    useEffect(() => {
        try {
            localStorage.setItem(PLAYING_KEY, JSON.stringify(playingList));
            // Also update legacy format for useUserStats compatibility
            localStorage.setItem('playing_now', JSON.stringify(playingList.map(item => item.id)));
            // Dispatch custom event for same-tab updates
            window.dispatchEvent(new Event('playing-updated'));
        } catch (error) {
            console.error('Failed to save playing list to localStorage:', error);
        }
    }, [playingList]);

    // Memoized Set for O(1) lookups
    const playingIds = useMemo(() => {
        return new Set(playingList.map(item => item.id));
    }, [playingList]);

    const addToPlaying = useCallback((game: { id: number; title: string; cover_url?: string }) => {
        setPlayingList(prev => {
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

    const removeFromPlaying = useCallback((gameId: number) => {
        setPlayingList(prev => prev.filter(item => item.id !== gameId));
    }, []);

    const isPlaying = useCallback((gameId: number): boolean => {
        return playingIds.has(gameId);
    }, [playingIds]);

    const togglePlaying = useCallback((game: { id: number; title: string; cover_url?: string }) => {
        if (playingIds.has(game.id)) {
            removeFromPlaying(game.id);
        } else {
            addToPlaying(game);
        }
    }, [playingIds, addToPlaying, removeFromPlaying]);

    const clearPlaying = useCallback(() => {
        setPlayingList([]);
    }, []);

    const playingCount = playingList.length;

    return {
        playingList,
        playingIds,
        addToPlaying,
        removeFromPlaying,
        isPlaying,
        togglePlaying,
        clearPlaying,
        playingCount
    };
};

export default usePlayingNow;
