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

const mockRegister = jest.fn();
jest.mock('../hooks/useAuth', () => ({
    useAuth: () => ({
        register: mockRegister,
        isAuthenticated: false,
        loading: false,
    }),
}));

import { Register } from '../pages/Register';

const renderRegister = () =>
    render(
        <MemoryRouter initialEntries={['/register']}>
            <Register />
        </MemoryRouter>,
    );

const getPasswordFields = () => {
    const pwFields = screen.getAllByPlaceholderText('••••••••');
    return { password: pwFields[0], confirmPassword: pwFields[1] };
};

describe('Register page', () => {
    beforeEach(() => jest.clearAllMocks());

    it('renders all registration fields and heading', () => {
        renderRegister();
        expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
        const { password, confirmPassword } = getPasswordFields();
        expect(password).toBeInTheDocument();
        expect(confirmPassword).toBeInTheDocument();
        // "Create Account" appears as both heading and button
        expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows link to login page', () => {
        renderRegister();
        expect(screen.getByRole('link', { name: /login/i })).toHaveAttribute('href', '/login');
    });

    it('shows error when passwords do not match', async () => {
        renderRegister();
        const user = userEvent.setup();
        const { password, confirmPassword } = getPasswordFields();

        await user.type(screen.getByPlaceholderText('Your name'), 'John');
        await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com');
        await user.type(password, 'password1');
        await user.type(confirmPassword, 'different');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
        });
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('shows error when password is too short', async () => {
        renderRegister();
        const user = userEvent.setup();
        const { password, confirmPassword } = getPasswordFields();

        await user.type(screen.getByPlaceholderText('Your name'), 'John');
        await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com');
        await user.type(password, '123');
        await user.type(confirmPassword, '123');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
        });
        expect(mockRegister).not.toHaveBeenCalled();
    });

    it('calls register and navigates on success', async () => {
        mockRegister.mockResolvedValueOnce(undefined);
        renderRegister();
        const user = userEvent.setup();
        const { password, confirmPassword } = getPasswordFields();

        await user.type(screen.getByPlaceholderText('Your name'), 'John Doe');
        await user.type(screen.getByPlaceholderText('your@email.com'), 'john@example.com');
        await user.type(password, 'securePass1');
        await user.type(confirmPassword, 'securePass1');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(mockRegister).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'securePass1',
            });
        });
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });

    it('shows server error on register failure', async () => {
        mockRegister.mockRejectedValueOnce({
            response: { data: { message: 'Email already exists' } },
        });
        renderRegister();
        const user = userEvent.setup();
        const { password, confirmPassword } = getPasswordFields();

        await user.type(screen.getByPlaceholderText('Your name'), 'John');
        await user.type(screen.getByPlaceholderText('your@email.com'), 'dup@e.com');
        await user.type(password, 'password1');
        await user.type(confirmPassword, 'password1');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText('Email already exists')).toBeInTheDocument();
        });
    });
});
