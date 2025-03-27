import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import Register from '../Register';

// Mock axios
jest.mock('axios');

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the api module
jest.mock('../../../config/api', () => ({
  api: {
    client: {
      post: jest.fn()
    },
    endpoints: {
      register: '/api/users/register'
    }
  }
}));

// Import the api after mocking
import { api } from '../../../config/api';

describe('Register Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true
    });
    
    // Mock Event constructor
    window.Event = class Event {
      constructor(event) {
        this.event = event;
      }
    };
    
    // Mock dispatchEvent
    window.dispatchEvent = jest.fn();
  });

  test('renders registration form with all fields', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Check if all form elements are rendered
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  test('shows validation errors when submitting empty form', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Submit the form without filling in any fields
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Check if validation errors appear
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('submits form with user role and redirects on success', async () => {
    // Mock successful registration response
    api.client.post.mockResolvedValueOnce({
      data: {
        _id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        token: 'fake-token'
      }
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Leave the default role (user)
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the registration to complete
    await waitFor(() => {
      expect(api.client.post).toHaveBeenCalledWith('/api/users/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
      
      // Check localStorage was updated
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'fake-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userRole', 'user');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('username', 'testuser');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', 'user123');
      
      // Check navigation happened
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('submits form with organizer role and saves it correctly', async () => {
    // Mock successful registration response with organizer role
    api.client.post.mockResolvedValueOnce({
      data: {
        _id: 'user456',
        username: 'organizer',
        email: 'organizer@example.com',
        role: 'organizer',
        token: 'organizer-token'
      }
    });

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'organizer' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'organizer@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Select organizer role
    fireEvent.mouseDown(screen.getByLabelText(/role/i));
    fireEvent.click(screen.getByText(/organizer/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the registration to complete
    await waitFor(() => {
      expect(api.client.post).toHaveBeenCalledWith('/api/users/register', {
        username: 'organizer',
        email: 'organizer@example.com',
        password: 'password123',
        role: 'organizer'
      });
      
      // Check localStorage was updated with organizer role
      expect(window.localStorage.setItem).toHaveBeenCalledWith('token', 'organizer-token');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userRole', 'organizer');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('username', 'organizer');
      expect(window.localStorage.setItem).toHaveBeenCalledWith('userId', 'user456');
      
      // Check navigation happened
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('shows error message when registration fails', async () => {
    // Mock failed registration
    const errorMessage = 'User already exists';
    api.client.post.mockRejectedValueOnce({
      response: { data: { message: errorMessage } }
    });
    
    // Mock alert function
    global.alert = jest.fn();

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /register/i }));

    // Wait for the error handling
    await waitFor(() => {
      expect(api.client.post).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith(errorMessage);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});