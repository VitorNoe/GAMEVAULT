/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// framer-motion is auto-mocked via src/__mocks__/framer-motion.tsx

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

const mockLogin = jest.fn();
jest.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        login: mockLogin,
        isAuthenticated: false,
        loading: false,
    }),
}));

import { Login } from '../pages/Login';

const renderLogin = () =>
    render(
        <MemoryRouter initialEntries={['/login']}>
            <Login />
        </MemoryRouter>,
    );

describe('Login page', () => {
    beforeEach(() => jest.clearAllMocks());

    it('renders login form with email and password fields', () => {
        renderLogin();
        expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows heading text', () => {
        renderLogin();
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('shows a link to registration page', () => {
        renderLogin();
        expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/register');
    });

    it('calls login and navigates on successful submit', async () => {
        mockLogin.mockResolvedValueOnce(undefined);
        renderLogin();

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText('your@email.com'), 'test@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('displays error when login fails', async () => {
        mockLogin.mockRejectedValueOnce({
            response: { data: { message: 'Invalid credentials' } },
        });
        renderLogin();

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText('your@email.com'), 'bad@example.com');
        await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('displays generic error when no message in response', async () => {
        mockLogin.mockRejectedValueOnce(new Error('network'));
        renderLogin();

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText('your@email.com'), 'a@b.com');
        await user.type(screen.getByPlaceholderText('••••••••'), '123456');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(screen.getByText(/login failed/i)).toBeInTheDocument();
        });
    });

    it('disables button while loading', async () => {
        mockLogin.mockImplementation(() => new Promise(() => { }));
        renderLogin();

        const user = userEvent.setup();
        await user.type(screen.getByPlaceholderText('your@email.com'), 'a@b.com');
        await user.type(screen.getByPlaceholderText('••••••••'), '123456');
        const btn = screen.getByRole('button', { name: /sign in/i });
        await user.click(btn);

        await waitFor(() => expect(btn).toBeDisabled());
    });
});
