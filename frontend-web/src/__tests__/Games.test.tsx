/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Games } from '../pages/Games';

// framer-motion is auto-mocked via src/__mocks__/framer-motion.tsx

const mockGetAllGames = jest.fn();
const mockSearchGames = jest.fn();
jest.mock('../services/gameService', () => ({
    gameService: {
        getAllGames: (...args: any[]) => mockGetAllGames(...args),
        searchGames: (...args: any[]) => mockSearchGames(...args),
    },
}));

jest.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        isAuthenticated: false,
        loading: false,
        user: null,
    }),
}));

const makePaginatedResponse = (games: any[], total = games.length) => ({
    success: true,
    data: {
        games,
        pagination: { total, page: 1, limit: 20, totalPages: Math.ceil(total / 20) || 1 },
    },
});

const sampleGames = [
    {
        id: 1, title: 'The Legend of Zelda', slug: 'zelda',
        release_status: 'released' as const, availability_status: 'available' as const,
        release_year: 2023, release_date: '2023-05-12',
        cover_url: 'https://example.com/zelda.jpg',
        average_rating: 4.8, total_reviews: 120, metacritic_score: 96,
        created_at: '2023-01-01', updated_at: '2023-01-01',
    },
    {
        id: 2, title: 'Hollow Knight', slug: 'hollow-knight',
        release_status: 'released' as const, availability_status: 'available' as const,
        release_year: 2017, release_date: '2017-02-24',
        cover_url: 'https://example.com/hollow.jpg', // provide a cover so title doesn't duplicate
        average_rating: 4.6, total_reviews: 80, metacritic_score: 87,
        created_at: '2023-01-01', updated_at: '2023-01-01',
    },
];

const renderGames = async () => {
    let result: any;
    await act(async () => {
        result = render(
            <MemoryRouter initialEntries={['/games']}>
                <Games />
            </MemoryRouter>,
        );
        jest.advanceTimersByTime(400);
    });
    return result;
};

describe('Games catalog page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
    });
    afterEach(() => jest.useRealTimers());

    it('renders the catalog heading', async () => {
        mockGetAllGames.mockResolvedValue(makePaginatedResponse(sampleGames, 2));
        await renderGames();
        await waitFor(() => {
            expect(screen.getByText(/games catalog/i)).toBeInTheDocument();
        });
    });

    it('displays game titles after data loads', async () => {
        mockGetAllGames.mockResolvedValue(makePaginatedResponse(sampleGames, 2));
        await renderGames();

        await waitFor(() => {
            expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument();
            expect(screen.getByText('Hollow Knight')).toBeInTheDocument();
        });
    });

    it('shows total game count', async () => {
        mockGetAllGames.mockResolvedValue(makePaginatedResponse(sampleGames, 42));
        await renderGames();

        await waitFor(() => {
            expect(screen.getByText(/42 games/)).toBeInTheDocument();
        });
    });

    it('shows empty state when no games match', async () => {
        mockGetAllGames.mockResolvedValue(makePaginatedResponse([], 0));
        await renderGames();

        await waitFor(() => {
            expect(screen.getByText(/no games found/i)).toBeInTheDocument();
        });
    });

    it('shows error message on API failure', async () => {
        mockGetAllGames.mockRejectedValue({
            response: { data: { message: 'Server error' } },
        });
        await renderGames();

        await waitFor(() => {
            expect(screen.getByText('Server error')).toBeInTheDocument();
        });
    });

    it('links each game card to its detail page', async () => {
        mockGetAllGames.mockResolvedValue(makePaginatedResponse(sampleGames));
        await renderGames();

        await waitFor(() => {
            const links = screen.getAllByRole('link');
            const gameLinks = links.filter(l => l.getAttribute('href')?.startsWith('/games/'));
            expect(gameLinks.length).toBe(2);
            expect(gameLinks[0]).toHaveAttribute('href', '/games/1');
            expect(gameLinks[1]).toHaveAttribute('href', '/games/2');
        });
    });
});
