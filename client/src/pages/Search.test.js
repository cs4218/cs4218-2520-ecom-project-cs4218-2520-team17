import React from 'react';
import { render, screen } from '@testing-library/react';
import Search from '../pages/Search';
import { useSearch } from '../context/search';

jest.mock('../components/Layout', () => {
  return function LayoutMock({ title, children }) {
    return (
      <div data-testid='layout'>
        <div data-testid='layout-title'>{title}</div>
        {children}
      </div>
    );
  };
});

jest.mock('../context/search', () => ({
  useSearch: jest.fn(),
}));

describe('Search Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Tan Shi Yu, A0251681E
    test('should render the search heading and layout title', () => {
      // Arrange
      useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

      // Act
      render(<Search />);

      // Assert
      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(screen.getByTestId('layout-title')).toHaveTextContent('Search results');
    });

    // Tan Shi Yu, A0251681E
    test('should render "No Products Found" when results are empty', () => {
      // Arrange
      useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

      // Act
      render(<Search />);

      // Assert
      expect(screen.getByText('No Products Found')).toBeInTheDocument();
    });

    // Tan Shi Yu, A0251681E
    test('should render "Found N" and product card names when results exist', () => {
      // Arrange
      const mockResults = [
        {
          _id: 'abc123',
          name: 'iPhone',
          description: 'This is a very long iPhone description for testing purposes',
          price: 999,
        },
        {
          _id: 'def456',
          name: 'MacBook',
          description: 'MacBook description that is also long enough to substring',
          price: 1999,
        },
      ];

      useSearch.mockReturnValue([{ results: mockResults }, jest.fn()]);

      // Act
      render(<Search />);

      // Assert
      expect(screen.getByText('Found 2')).toBeInTheDocument();
      expect(screen.getByText('iPhone')).toBeInTheDocument();
      expect(screen.getByText('MacBook')).toBeInTheDocument();
    });

    // Tan Shi Yu, A0251681E
    test('should render product card with image, truncated description, price, and buttons', () => {
      // Arrange
      const product = {
        _id: 'p1',
        name: 'Camera',
        description: '123456789012345678901234567890EXTRA',
        price: 300,
      };

      useSearch.mockReturnValue([{ results: [product] }, jest.fn()]);

      // Act
      render(<Search />);

      // Assert
      const img = screen.getByRole('img', { name: 'Camera' });
      expect(img).toHaveAttribute('src', `/api/v1/product/product-photo/${product._id}`);
      expect(img).toHaveAttribute('alt', 'Camera');

      const expectedDesc = product.description.substring(0, 30) + '...';
      expect(screen.getByText(expectedDesc)).toBeInTheDocument();

      expect(screen.getByText(/\$\s*300/)).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /more details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });
  });

  describe('Behaviour', () => {
    // Tan Shi Yu, A0251681E
    test('should render without crashing when values is undefined', () => {
      // Arrange
      useSearch.mockReturnValue([undefined, jest.fn()]);

      // Act
      render(<Search />);

      // Assert
      expect(screen.getByText('Search Results')).toBeInTheDocument();
      expect(screen.getByText(/Found|No Products Found/)).toBeInTheDocument();
    });
  });
});