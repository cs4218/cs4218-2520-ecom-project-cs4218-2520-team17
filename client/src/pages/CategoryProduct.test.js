import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryProduct from './CategoryProduct';
import axios from 'axios';

jest.mock('axios');

jest.mock('../components/Layout', () => {
  return function LayoutMock({ children }) {
    return <div data-testid='layout'>{children}</div>;
  };
});

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useParams: jest.fn(),
    useNavigate: () => mockNavigate,
  };
});

const { useParams } = require('react-router-dom');

describe('CategoryProduct Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Tan Shi Yu, A0251681E
    test('should render category name, results count, and product cards after fetching', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'phones' });

      axios.get.mockResolvedValueOnce({
        data: {
          category: { name: 'Phones' },
          products: [
            {
              _id: 'p1',
              name: 'iPhone 15',
              price: 1999,
              slug: 'iphone-15',
              description:
                'This is a long description for iPhone 15 that should be truncated for display purposes.',
            },
            {
              _id: 'p2',
              name: 'Pixel 9',
              price: 999,
              slug: 'pixel-9',
              description:
                'This is a long description for Pixel 9 that should be truncated for display purposes.',
            },
          ],
        },
      });

      // Act
      render(<CategoryProduct />);

      // Assert
      expect(await screen.findByText(/Category - Phones/i)).toBeInTheDocument();
      expect(screen.getByText(/2 result found/i)).toBeInTheDocument();

      expect(screen.getByText('iPhone 15')).toBeInTheDocument();
      expect(screen.getByText('Pixel 9')).toBeInTheDocument();

      expect(screen.getByRole('img', { name: 'iPhone 15' })).toHaveAttribute(
        'src',
        '/api/v1/product/product-photo/p1'
      );
      expect(screen.getByRole('img', { name: 'Pixel 9' })).toHaveAttribute(
        'src',
        '/api/v1/product/product-photo/p2'
      );

      expect(screen.getByText('$1,999.00')).toBeInTheDocument();
      expect(screen.getByText('$999.00')).toBeInTheDocument();

      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-category/phones');
    });

    // Tan Shi Yu, A0251681E
    test('should not call axios when slug is missing', () => {
      // Arrange
      useParams.mockReturnValue({});

      // Act
      render(<CategoryProduct />);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
    });

    // Tan Shi Yu, A0251681E
    test('should render "0 result found" when API returns an empty products list', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'empty-cat' });

      axios.get.mockResolvedValueOnce({
        data: {
          category: { name: 'Empty Category' },
          products: [],
        },
      });

      // Act
      render(<CategoryProduct />);

      // Assert
      expect(await screen.findByText(/Category - Empty Category/i)).toBeInTheDocument();
      expect(screen.getByText(/0 result found/i)).toBeInTheDocument();
    });
  });

  describe('Behaviour', () => {
    // Tan Shi Yu, A0251681E
    test('should log error and not crash when the API call fails', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'phones' });
      axios.get.mockRejectedValueOnce(new Error('network error'));

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      render(<CategoryProduct />);

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalled();
      });

      // Assert
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/product-category/phones');
      logSpy.mockRestore();
    });
  });

  describe('Interaction Test', () => {
    // Tan Shi Yu, A0251681E
    test('should navigate to the product page on clicking "More Details"', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'phones' });

      axios.get.mockResolvedValueOnce({
        data: {
          category: { name: 'Phones' },
          products: [
            {
              _id: 'p1',
              name: 'iPhone 15',
              price: 1999,
              slug: 'iphone-15',
              description:
                'This is a long description for iPhone 15 that should be truncated for display purposes.',
            },
          ],
        },
      });

      render(<CategoryProduct />);

      await screen.findByText(/Category - Phones/i);

      // Act
      const btn = screen.getByRole('button', { name: /more details/i });
      fireEvent.click(btn);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/product/iphone-15');
    });
  });
});