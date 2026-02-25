/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';

// framer-motion is auto-mocked via src/__mocks__/framer-motion.tsx

// Must define mock implementation INSIDE the factory to avoid
// "Cannot access before initialization" with CRA's jest-hoist.
const mockIsAuthenticated = jest.fn();
const mockLogin = jest.fn();
const mockRegisterFn = jest.fn();
const mockLogout = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockGetToken = jest.fn();

jest.mock('../services/authService', () => ({
    authService: {
        isAuthenticated: (...args: any[]) => mockIsAuthenticated(...args),
        login: (...args: any[]) => mockLogin(...args),
        register: (...args: any[]) => mockRegisterFn(...args),
        logout: (...args: any[]) => mockLogout(...args),
        getCurrentUser: (...args: any[]) => mockGetCurrentUser(...args),
        getToken: (...args: any[]) => mockGetToken(...args),
    },
}));

import { AuthProvider, AuthContext } from '../contexts/AuthContext';

const AuthConsumer: React.FC = () => {
    const ctx = React.useContext(AuthContext);
    if (!ctx) return <div>no context</div>;
    return (
        <div>
            <span data-testid="isAuthenticated">{String(ctx.isAuthenticated)}</span>
            <span data-testid="isAdmin">{String(ctx.isAdmin)}</span>
            <span data-testid="loading">{String(ctx.loading)}</span>
            <span data-testid="userName">{ctx.user?.name ?? 'none'}</span>
            <button onClick={() => ctx.login({ email: 'a@b.com', password: 'p' })}>login</button>
            <button onClick={() => ctx.logout()}>logout</button>
        </div>
    );
};

const renderWithAuth = () =>
    render(
        <AuthProvider>
            <AuthConsumer />
        </AuthProvider>,
    );

describe('AuthContext', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsAuthenticated.mockReturnValue(false);
    });

    it('starts loading, then resolves to unauthenticated', async () => {
        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
        expect(screen.getByTestId('userName').textContent).toBe('none');
    });

    it('loads the user when a token exists', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetCurrentUser.mockResolvedValueOnce({
            id: 1, name: 'Alice', email: 'alice@e.com', type: 'regular',
            created_at: '', updated_at: '',
        });

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
        expect(screen.getByTestId('userName').textContent).toBe('Alice');
        expect(screen.getByTestId('isAdmin').textContent).toBe('false');
    });

    it('exposes isAdmin = true for admin users', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetCurrentUser.mockResolvedValueOnce({
            id: 2, name: 'Admin', email: 'admin@e.com', type: 'admin',
            created_at: '', updated_at: '',
        });

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('isAdmin').textContent).toBe('true');
        });
    });

    it('login sets the user', async () => {
        mockLogin.mockResolvedValueOnce({
            data: {
                user: { id: 3, name: 'Bob', email: 'bob@e.com', type: 'regular', created_at: '', updated_at: '' },
                token: 'tok',
            },
        });

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });

        await act(async () => {
            screen.getByText('login').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
            expect(screen.getByTestId('userName').textContent).toBe('Bob');
        });
    });

    it('logout clears the user', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetCurrentUser.mockResolvedValueOnce({
            id: 1, name: 'Alice', email: 'alice@e.com', type: 'regular',
            created_at: '', updated_at: '',
        });
        mockLogout.mockResolvedValueOnce(undefined);

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('userName').textContent).toBe('Alice');
        });

        await act(async () => {
            screen.getByText('logout').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
            expect(screen.getByTestId('userName').textContent).toBe('none');
        });
    });

    it('handles getCurrentUser failure gracefully', async () => {
        mockIsAuthenticated.mockReturnValue(true);
        mockGetCurrentUser.mockRejectedValueOnce(new Error('401'));

        renderWithAuth();

        await waitFor(() => {
            expect(screen.getByTestId('loading').textContent).toBe('false');
        });
        expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    });
});
