import { useState, useEffect, useCallback, useMemo } from 'react';

const COMPLETED_KEY = 'gamevault_completed';

interface CompletedItem {
    id: number;
    title: string;
    cover_url?: string;
    addedAt: string;
}

interface UseCompletedReturn {
    completedList: CompletedItem[];
    completedIds: Set<number>;
    addToCompleted: (game: { id: number; title: string; cover_url?: string }) => void;
    removeFromCompleted: (gameId: number) => void;
    isCompleted: (gameId: number) => boolean;
    toggleCompleted: (game: { id: number; title: string; cover_url?: string }) => void;
    clearCompleted: () => void;
    completedCount: number;
}

/**
 * Custom hook for managing "Completed" games state with localStorage persistence
 */
export const useCompleted = (): UseCompletedReturn => {
    const [completedList, setCompletedList] = useState<CompletedItem[]>(() => {
        try {
            const stored = localStorage.getItem(COMPLETED_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Persist to localStorage whenever list changes
    useEffect(() => {
        try {
            localStorage.setItem(COMPLETED_KEY, JSON.stringify(completedList));
            // Also update legacy format for useUserStats compatibility
            localStorage.setItem('completed', JSON.stringify(completedList.map(item => item.id)));
            // Dispatch custom event for same-tab updates
            window.dispatchEvent(new Event('completed-updated'));
        } catch (error) {
            console.error('Failed to save completed list to localStorage:', error);
        }
    }, [completedList]);

    // Memoized Set for O(1) lookups
    const completedIds = useMemo(() => {
        return new Set(completedList.map(item => item.id));
    }, [completedList]);

    const addToCompleted = useCallback((game: { id: number; title: string; cover_url?: string }) => {
        setCompletedList(prev => {
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

    const removeFromCompleted = useCallback((gameId: number) => {
        setCompletedList(prev => prev.filter(item => item.id !== gameId));
    }, []);

    const isCompleted = useCallback((gameId: number): boolean => {
        return completedIds.has(gameId);
    }, [completedIds]);

    const toggleCompleted = useCallback((game: { id: number; title: string; cover_url?: string }) => {
        if (completedIds.has(game.id)) {
            removeFromCompleted(game.id);
        } else {
            addToCompleted(game);
        }
    }, [completedIds, addToCompleted, removeFromCompleted]);

    const clearCompleted = useCallback(() => {
        setCompletedList([]);
    }, []);

    const completedCount = completedList.length;

    return {
        completedList,
        completedIds,
        addToCompleted,
        removeFromCompleted,
        isCompleted,
        toggleCompleted,
        clearCompleted,
        completedCount
    };
};

export default useCompleted;
