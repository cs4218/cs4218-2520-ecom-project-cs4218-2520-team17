import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SearchInput from './SearchInput';
import axios from 'axios';
import { useSearch } from '../../context/search';

jest.mock('axios');

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SearchInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Tan Shi Yu, A0251681E
    test('should render the search input and search button', () => {
      // Arrange
      const setValues = jest.fn();
      const values = { keyword: '', results: [] };

      useSearch.mockReturnValue([values, setValues]);

      // Act
      render(<SearchInput />);

      // Assert
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    });

    // Tan Shi Yu, A0251681E
    test('should display the current keyword value in the input field', () => {
      // Arrange
      const setValues = jest.fn();
      const values = { keyword: 'laptop', results: [] };

      useSearch.mockReturnValue([values, setValues]);

      // Act
      render(<SearchInput />);

      // Assert
      expect(screen.getByRole('searchbox')).toHaveValue('laptop');
    });

    // Tan Shi Yu, A0251681E
    test('should render the input with the correct placeholder text', () => {
      // Arrange
      const setValues = jest.fn();
      const values = { keyword: '', results: [] };

      useSearch.mockReturnValue([values, setValues]);

      // Act
      render(<SearchInput />);

      // Assert
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });
  });

  describe('Interaction Test', () => {
    // Tan Shi Yu, A0251681E
    test('should update keyword in context on input change', () => {
      // Arrange
      const setValues = jest.fn();
      const values = { keyword: '', results: [] };

      useSearch.mockReturnValue([values, setValues]);

      render(<SearchInput />);

      // Act
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'iphone' },
      });

      // Assert
      expect(setValues).toHaveBeenLastCalledWith({ ...values, keyword: 'iphone' });
    });

    // Tan Shi Yu, A0251681E
    test('should call API, store results, and navigate to /search on form submit', async () => {
      // Arrange
      const setValues = jest.fn();
      const values = { keyword: 'iphone', results: [] };

      useSearch.mockReturnValue([values, setValues]);
      axios.get.mockResolvedValueOnce({ data: ['p1', 'p2'] });

      render(<SearchInput />);

      // Act
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/iphone');
      });

      // Assert
      expect(setValues).toHaveBeenCalledWith({ ...values, results: ['p1', 'p2'] });
      expect(mockNavigate).toHaveBeenCalledWith('/search');
    });

    // Tan Shi Yu, A0251681E
    test('should log error and not navigate on API failure', async () => {
      // Arrange
      const setValues = jest.fn();
      const values = { keyword: 'iphone', results: [] };

      useSearch.mockReturnValue([values, setValues]);
      axios.get.mockRejectedValueOnce(new Error('network fail'));

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      render(<SearchInput />);

      // Act
      fireEvent.click(screen.getByRole('button', { name: /search/i }));

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalled();
      });

      // Assert
      expect(mockNavigate).not.toHaveBeenCalled();
      logSpy.mockRestore();
    });
  });
});