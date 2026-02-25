/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Game } from '../types/game.types';

// framer-motion is auto-mocked via src/__mocks__/framer-motion.tsx

jest.mock('../utils/imageUtils', () => ({
    createImageErrorHandler: () => () => { },
}));

jest.mock('../utils/animations', () => ({
    getLimitedStagger: (i: number) => i * 0.03,
}));

import GameCard from '../components/games/GameCard';

const baseGame: Game = {
    id: 10, title: 'Celeste', slug: 'celeste',
    release_status: 'released', availability_status: 'available',
    release_year: 2018, release_date: '2018-01-25',
    cover_url: 'https://example.com/celeste.jpg',
    average_rating: 4.7, total_reviews: 50, metacritic_score: 92,
    created_at: '2023-01-01', updated_at: '2023-01-01',
};

const renderCard = (props: any = {}) =>
    render(
        <MemoryRouter>
            <GameCard game={baseGame} {...props} />
        </MemoryRouter>,
    );

describe('GameCard component', () => {
    it('renders game title', () => {
        renderCard();
        expect(screen.getByText('Celeste')).toBeInTheDocument();
    });

    it('links to the game detail page', () => {
        renderCard();
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/games/10');
    });

    it('renders cover image with correct alt text', () => {
        renderCard();
        const img = screen.getByAltText('Celeste');
        expect(img).toHaveAttribute('src', 'https://example.com/celeste.jpg');
    });

    it('shows metacritic score by default', () => {
        renderCard();
        expect(screen.getByText('92')).toBeInTheDocument();
    });

    it('hides metacritic when showMetacritic is false', () => {
        renderCard({ showMetacritic: false });
        expect(screen.queryByText('92')).not.toBeInTheDocument();
    });

    it('shows release status badge', () => {
        renderCard();
        expect(screen.getByText('Released')).toBeInTheDocument();
    });

    it('hides status badge when showStatus is false', () => {
        renderCard({ showStatus: false });
        expect(screen.queryByText('Released')).not.toBeInTheDocument();
    });

    it('renders placeholder when cover_url is missing', () => {
        renderCard({ game: { ...baseGame, cover_url: undefined } });
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('displays formatted release year', () => {
        renderCard();
        // The card displays "Jan 2018" or just "2018"
        expect(screen.getByText(/2018/)).toBeInTheDocument();
    });
});
