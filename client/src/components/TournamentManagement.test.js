import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TournamentManagement from './TournamentManagement';

// Mock the api module
jest.mock('../config/api', () => ({
  api: {
    baseUrl: 'http://localhost:5001'
  }
}));

// Mock the react-router-dom components
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'mock-tournament-id' }),
  useNavigate: () => jest.fn(),
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

// Mock auth util
jest.mock('../utils/auth', () => ({
  getAuthHeaders: () => ({
    'Authorization': 'Bearer mock-token'
  })
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock API response data
const mockTournament = {
  _id: 'mock-tournament-id',
  title: 'Mock Tournament',
  description: 'A mock tournament for testing',
  format: 'tournament',
  status: 'upcoming',
  participants: [
    { _id: 'user1', username: 'Organizer', role: 'organizer' },
  ],
  creator: { _id: 'user1', username: 'Organizer' }
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn((key) => {
      if (key === 'token') return 'mock-token';
      if (key === 'userId') return 'user1';
      if (key === 'username') return 'Organizer';
      if (key === 'userRole') return 'organizer';
      return null;
    }),
    setItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

describe('TournamentManagement Generate Test Data', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Mock console methods to prevent cluttered test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders the Generate Test Data button', async () => {
    // Mock the tournament fetch
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTournament)
      })
    );

    render(<TournamentManagement />);
    
    // Should show a loading spinner initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for the component to load and display the Generate Test Data button
    await waitFor(() => {
      expect(screen.getByText('Generate Test Data')).toBeInTheDocument();
    });
  });

  test('clicking Generate Test Data button triggers API calls', async () => {
    // Mock the tournament fetch
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTournament)
      })
    );

    render(<TournamentManagement />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Generate Test Data')).toBeInTheDocument();
    });
    
    // Setup mocks for test data generation API calls
    fetch
      // Test judges fetch
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            users: [{ _id: 'judge1', username: 'Judge1', email: 'judge1@test.com', role: 'judge', judgeRole: 'Head Judge' }] 
          })
        })
      )
      // Test debaters fetch
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            users: [{ _id: 'debater1', username: 'Debater1', email: 'debater1@test.com', role: 'user' }] 
          })
        })
      )
      // Register participants call
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            ...mockTournament,
            participants: [
              ...mockTournament.participants,
              { _id: 'judge1', username: 'Judge1', role: 'judge', judgeRole: 'Head Judge' },
              { _id: 'debater1', username: 'Debater1', role: 'user' }
            ]
          })
        })
      );
    
    // Click the Generate Test Data button
    fireEvent.click(screen.getByText('Generate Test Data'));
    
    // Verify API calls
    await waitFor(() => {
      // Should have made 4 fetch calls total (1 initial + 3 from button click)
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/test/judges',
        expect.anything()
      );
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/users/test/debaters',
        expect.anything()
      );
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/debates/mock-tournament-id/register-participants',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
    
    // Check for success notification
    await waitFor(() => {
      expect(screen.getByText(/Test data generated and registered successfully/)).toBeInTheDocument();
    });
  });

  test('handles API error when fetching test users', async () => {
    // Mock the tournament fetch
    fetch.mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTournament)
      })
    );

    render(<TournamentManagement />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Generate Test Data')).toBeInTheDocument();
    });
    
    // Setup mock for failed API call
    fetch
      // Test judges fetch fails
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error')
        })
      );
    
    // Click the Generate Test Data button
    fireEvent.click(screen.getByText('Generate Test Data'));
    
    // Check for error notification
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate test data/)).toBeInTheDocument();
    });
    
    expect(console.error).toHaveBeenCalled();
  });
});