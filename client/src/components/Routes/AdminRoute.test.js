import { render, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useAuth } from '../../context/auth';
import AdminRoute from './AdminRoute';

// Mock dependencies
jest.mock('axios');
jest.mock('../../context/auth');

// Mock Outlet to render test content
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet-content">Admin Content</div>,
  };
});

// Mock Spinner component
jest.mock('../Spinner', () => {
  return () => <div data-testid="spinner">Loading...</div>;
});

// Mock Router
const Router = ({ children }) => <div>{children}</div>;

/**
 * Renders the AdminRoute component with mocked useAuth response with a token by default.
 * @param {*} useAuthReturnValue mocked value for useAuth hook.
 */
const renderAdminRoute = (useAuthReturnValue = { token: 'test-token' }) => {
  useAuth.mockReturnValue([useAuthReturnValue]);

  return render(
    <Router>
      <AdminRoute />
    </Router>
  );
};

describe('AdminRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Loading State', () => {
    test('should display Spinner component when result is undefined and token exists', async () => {
      // Arrange
      axios.get.mockImplementation(
        () => new Promise(() => {}) // Never resolves to keep result undefined
      );

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('outlet-content')).not.toBeInTheDocument();
    });

    test('should display Spinner and not call API when token is not present', () => {
      // Arrange & Act
      renderAdminRoute({});

      // Assert
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(axios.get).not.toHaveBeenCalled();
    });

    test('should display Spinner and not call API when token is null', () => {
      // Arrange & Act
      renderAdminRoute({ token: null });

      // Assert
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe('Authorized User', () => {
    test('should call API with correct endpoint when token exists', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: true } });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
    });

    test('should render Outlet when API returns ok: true', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: true } });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });


    test('should call API only once on initial render', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: true } });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unauthorized User', () => {
    test('should display Unauthorized message when API returns ok: false', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: false } });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      expect(screen.queryByTestId('outlet-content')).not.toBeInTheDocument();
    });

    test('should render h1 heading for Unauthorized message', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: false } });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      const heading = screen.getByText('Unauthorized');
      expect(heading.tagName).toBe('H1');
    });

    test('should have text-center class on Unauthorized message', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: false } });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      const heading = screen.getByText('Unauthorized');
      expect(heading).toHaveClass('text-center');
    });
  });

  describe('Error Handling', () => {
    test('should display Unauthorized when API call fails', async () => {
      // Arrange
      axios.get.mockRejectedValue(new Error('Network error'));

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  describe('Token Change and Dependencies', () => {
    test('should call API again when token changes', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: true } });
      useAuth.mockReturnValue([{ token: 'token-1' }]);

      // Act - First render
      const { rerender } = render(
        <Router>
          <AdminRoute />
        </Router>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });

      // Assert that admin content is shown
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();

      // Arrange - Change token
      jest.clearAllMocks();
      axios.get.mockResolvedValue({ data: { ok: false } });
      useAuth.mockReturnValue([{ token: 'token-2' }]);

      // Act - Rerender with new token
      rerender(
        <Router>
          <AdminRoute />
        </Router>
      );

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
      expect(screen.queryByTestId('outlet-content')).not.toBeInTheDocument();
    });

    test('should not call API again when token is unchanged', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { ok: true } });
      useAuth.mockReturnValue([{ token: 'token-1' }]);

      // Act - First render
      const { rerender } = render(
        <Router>
          <AdminRoute />
        </Router>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledTimes(1);
      });
      // Assert that admin content is shown
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();

      // Arrange
      // Note: Mock counter is not reset here to verify no additional calls are made
      axios.get.mockResolvedValue({ data: { ok: true } });
      useAuth.mockReturnValue([{ token: 'token-1' }]);

      // Act - Rerender with same token
      rerender(
        <Router>
          <AdminRoute />
        </Router>
      );

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('outlet-content')).toBeInTheDocument();
      expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

  describe('API Edge Cases', () => {
    test('should handle API response without ok property', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: {} });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    test('should handle null API response data', async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: null });

      // Act
      renderAdminRoute();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });
});
