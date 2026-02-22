import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProductDetails from './ProductDetails';
import axios from 'axios';

jest.mock('axios');

jest.mock('./../components/Layout', () => {
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

describe('ProductDetails Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Tan Shi Yu, A0251681E
    test('should render product details and similar products after fetching', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'iphone-15' });

      axios.get
        .mockResolvedValueOnce({
          data: {
            product: {
              _id: 'p1',
              name: 'iPhone 15',
              description: 'A very cool phone',
              price: 1999,
              slug: 'iphone-15',
              category: { _id: 'c1', name: 'Phones' },
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            products: [
              {
                _id: 'p2',
                name: 'Pixel 9',
                description:
                  'Pixel description that is long enough to be truncated and displayed nicely',
                price: 999,
                slug: 'pixel-9',
              },
            ],
          },
        });

      // Act
      render(<ProductDetails />);

      // Assert
      expect(await screen.findByText(/Name : iPhone 15/i)).toBeInTheDocument();
      expect(screen.getByText(/Description : A very cool phone/i)).toBeInTheDocument();
      expect(screen.getByText(/Category : Phones/i)).toBeInTheDocument();
      expect(screen.getByText(/Price :\s*\$1,999\.00/)).toBeInTheDocument();

      const mainImg = screen.getByRole('img', { name: 'iPhone 15' });
      expect(mainImg).toHaveAttribute('src', '/api/v1/product/product-photo/p1');

      expect(screen.getByText('Pixel 9')).toBeInTheDocument();
      const similarImg = screen.getByRole('img', { name: 'Pixel 9' });
      expect(similarImg).toHaveAttribute('src', '/api/v1/product/product-photo/p2');

      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/get-product/iphone-15');
      expect(axios.get).toHaveBeenCalledWith('/api/v1/product/related-product/p1/c1');
    });

    // Tan Shi Yu, A0251681E
    test('should render the "ADD TO CART" button on the main product', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'iphone-15' });

      axios.get
        .mockResolvedValueOnce({
          data: {
            product: {
              _id: 'p1',
              name: 'iPhone 15',
              description: 'A very cool phone',
              price: 1999,
              slug: 'iphone-15',
              category: { _id: 'c1', name: 'Phones' },
            },
          },
        })
        .mockResolvedValueOnce({ data: { products: [] } });

      // Act
      render(<ProductDetails />);

      // Assert
      expect(await screen.findByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });

    // Tan Shi Yu, A0251681E
    test('should render "No Similar Products found" when related list is empty', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'iphone-15' });

      axios.get
        .mockResolvedValueOnce({
          data: {
            product: {
              _id: 'p1',
              name: 'iPhone 15',
              description: 'A very cool phone',
              price: 1999,
              slug: 'iphone-15',
              category: { _id: 'c1', name: 'Phones' },
            },
          },
        })
        .mockResolvedValueOnce({
          data: { products: [] },
        });

      // Act
      render(<ProductDetails />);

      // Assert
      expect(await screen.findByText(/Name : iPhone 15/i)).toBeInTheDocument();
      expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
    });
  });

  describe('Behaviour', () => {
    // Tan Shi Yu, A0251681E
    test('should not call the API when slug is missing', () => {
      // Arrange
      useParams.mockReturnValue({});

      // Act
      render(<ProductDetails />);

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
    });

    // Tan Shi Yu, A0251681E
    test('should log error and not crash when getProduct API fails', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'iphone-15' });
      axios.get.mockRejectedValueOnce(new Error('server error'));

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      render(<ProductDetails />);

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalled();
      });

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(1);
      logSpy.mockRestore();
    });

    // Tan Shi Yu, A0251681E
    test('should log error and not crash when getSimilarProduct API fails', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'iphone-15' });

      axios.get
        .mockResolvedValueOnce({
          data: {
            product: {
              _id: 'p1',
              name: 'iPhone 15',
              description: 'A very cool phone',
              price: 1999,
              slug: 'iphone-15',
              category: { _id: 'c1', name: 'Phones' },
            },
          },
        })
        .mockRejectedValueOnce(new Error('related fetch failed'));

      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      render(<ProductDetails />);

      await waitFor(() => {
        expect(logSpy).toHaveBeenCalled();
      });

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(2);
      logSpy.mockRestore();
    });
  });

  describe('Interaction Test', () => {
    // Tan Shi Yu, A0251681E
    test('should navigate to the related product page on clicking "More Details"', async () => {
      // Arrange
      useParams.mockReturnValue({ slug: 'iphone-15' });

      axios.get
        .mockResolvedValueOnce({
          data: {
            product: {
              _id: 'p1',
              name: 'iPhone 15',
              description: 'A very cool phone',
              price: 1999,
              slug: 'iphone-15',
              category: { _id: 'c1', name: 'Phones' },
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            products: [
              {
                _id: 'p2',
                name: 'Pixel 9',
                description: 'Pixel description long long long long long long',
                price: 999,
                slug: 'pixel-9',
              },
            ],
          },
        });

      render(<ProductDetails />);

      // Act
      const btn = await screen.findByRole('button', { name: /more details/i });
      fireEvent.click(btn);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith('/product/pixel-9');
    });
  });
});