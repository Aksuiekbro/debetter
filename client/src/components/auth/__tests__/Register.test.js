import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../../../config/api';
import Register from '../Register';

// Mock the api client
jest.mock('../../../config/api', () => ({
  api: {
    client: {
      post: jest.fn()
    }
  }
}));

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Register Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  test('renders registration form', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText('username')).toBeInTheDocument();
    expect(screen.getByLabelText('email')).toBeInTheDocument();
    expect(screen.getByLabelText('password')).toBeInTheDocument();
    expect(screen.getByLabelText('role')).toBeInTheDocument();
  });

  test('handles successful registration', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        role: 'user',
        username: 'testuser',
        _id: '123'
      }
    };

    api.client.post.mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('username'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(api.client.post).toHaveBeenCalledWith('/api/users/register', {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles registration error', async () => {
    const mockError = {
      response: {
        data: {
          message: 'Registration failed'
        }
      }
    };

    api.client.post.mockRejectedValueOnce(mockError);
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText('username'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Registration failed');
    });

    mockAlert.mockRestore();
  });

  test('validates required fields', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Try to submit the form
    fireEvent.click(screen.getByTestId('register-submit'));

    // Check that form validation prevents submission when fields are empty
    await waitFor(() => {
      expect(screen.getByLabelText('username')).toBeInvalid();
      expect(screen.getByLabelText('email')).toBeInvalid();
      expect(screen.getByLabelText('password')).toBeInvalid();
      expect(api.client.post).not.toHaveBeenCalled();
    });
  });

  test('handles role selection', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const roleSelect = screen.getByLabelText('role');
    fireEvent.mouseDown(roleSelect);

    const judgeOption = screen.getByTestId('role-judge');
    fireEvent.click(judgeOption);

    // Check that the role select element has the correct value
    expect(screen.getByRole('combobox', { name: /role/i })).toHaveTextContent('Judge');
  });

  test('validates email format', async () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('email');
    fireEvent.change(emailInput, {
      target: { value: 'invalid-email' }
    });

    // Try to submit the form
    fireEvent.click(screen.getByTestId('register-submit'));
    
    // Email validation is handled by the browser's built-in validation
    expect(emailInput).toBeInvalid();
  });

  test('sets localStorage after successful registration', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        role: 'judge',
        username: 'testjudge',
        _id: '123'
      }
    };
    api.client.post.mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText('username'), {
      target: { value: 'testjudge' }
    });
    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'judge@example.com' }
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: 'password123' }
    });

    // Select judge role
    const roleSelect = screen.getByLabelText('role');
    fireEvent.mouseDown(roleSelect);
    fireEvent.click(screen.getByTestId('role-judge'));

    // Submit the form
    fireEvent.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('userRole')).toBe('judge');
      expect(localStorage.getItem('username')).toBe('testjudge');
      expect(localStorage.getItem('userId')).toBe('123');
    });
  });

  test('login link navigates to login page', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    const loginLink = screen.getByText('Already have an account? Login');
    expect(loginLink).toHaveAttribute('href', '/login');
  });

  test('dispatches auth-change event after successful registration', async () => {
    const mockResponse = {
      data: {
        token: 'test-token',
        role: 'user',
        username: 'testuser',
        _id: '123'
      }
    };
    api.client.post.mockResolvedValueOnce(mockResponse);

    // Create a spy for window.dispatchEvent
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    // Fill and submit the form
    fireEvent.change(screen.getByLabelText('username'), {
      target: { value: 'testuser' }
    });
    fireEvent.change(screen.getByLabelText('email'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('password'), {
      target: { value: 'password123' }
    });
    fireEvent.click(screen.getByTestId('register-submit'));

    await waitFor(() => {
      expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
      expect(dispatchEventSpy.mock.calls[0][0].type).toBe('auth-change');
    });

    dispatchEventSpy.mockRestore();
  });
});