import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

// Mock fetch
global.fetch = jest.fn();

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    fetch.mockClear();
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('renders login form with all fields', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockResponse = {
      _id: '123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      token: 'mockToken'
    };

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })
    );

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    await act(async () => {
      userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      userEvent.type(screen.getByLabelText(/password/i), 'password123');
      userEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('mockToken');
      expect(localStorage.getItem('userRole')).toBe('user');
      expect(localStorage.getItem('username')).toBe('testuser');
      expect(localStorage.getItem('userId')).toBe('123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('handles login failure', async () => {
    const mockError = { message: 'Invalid credentials' };
    global.alert = jest.fn();

    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve(mockError)
      })
    );

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    await act(async () => {
      userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com');
      userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');
      userEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Invalid credentials');
      expect(localStorage.getItem('token')).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('handles network error', async () => {
    global.alert = jest.fn();
    console.error = jest.fn();

    fetch.mockImplementationOnce(() =>
      Promise.reject(new Error('Network error'))
    );

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    await act(async () => {
      userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      userEvent.type(screen.getByLabelText(/password/i), 'password123');
      userEvent.click(screen.getByRole('button', { name: /login/i }));
    });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Login error:', expect.any(Error));
      expect(localStorage.getItem('token')).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});