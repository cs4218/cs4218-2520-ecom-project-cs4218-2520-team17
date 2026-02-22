import { renderHook, act } from '@testing-library/react';
import axios from 'axios';
import { AuthProvider, useAuth } from './auth';

// Mock axios
jest.mock('axios');

describe('Auth Context', () => {
  let localStorageMock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock localStorage
    localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Reset axios defaults
    axios.defaults.headers.common = {};
  });

  describe('AuthProvider', () => {
    it('should initialize with empty auth state when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const [auth] = result.current;
      expect(auth).toEqual({
        user: null,
        token: '',
      });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth');
    });

    it('should load auth data from localStorage on mount', () => {
      const mockAuthData = {
        user: { _id: 1, name: 'Test User', email: 'test@example.com' },
        token: 'mock-token-123',
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockAuthData));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const [auth] = result.current;
      expect(auth.user).toEqual(mockAuthData.user);
      expect(auth.token).toBe(mockAuthData.token);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('auth');
      expect(axios.defaults.headers.common['Authorization']).toBe('mock-token-123');
    });
  });

  describe('useAuth Hook', () => {
    it('should allow updating auth state', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      const newAuthState = {
        user: { _id: 3, name: 'Updated User', email: 'updated@example.com' },
        token: 'Bearer updated-token',
      };

      act(() => {
        const [, setAuth] = result.current;
        setAuth(newAuthState);
      });

      const [auth] = result.current;
      expect(auth).toEqual(newAuthState);
    });
  });
});
