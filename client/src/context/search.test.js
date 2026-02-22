import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchProvider, useSearch } from './search';

// helper consumer to read and mutate the context value
function TestConsumer() {
  const [state, setState] = useSearch();

  return (
    <div>
      <div data-testid='keyword'>{state.keyword}</div>
      <div data-testid='results-count'>{state.results.length}</div>
      <button
        type='button'
        onClick={() => setState((prev) => ({ ...prev, keyword: 'iphone' }))}
      >
        Set Keyword
      </button>
      <button
        type='button'
        onClick={() =>
          setState((prev) => ({ ...prev, results: [{ _id: 'p1' }, { _id: 'p2' }] }))
        }
      >
        Set Results
      </button>
    </div>
  );
}

describe('Search Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Tan Shi Yu, A0251681E
    test('should render children inside SearchProvider', () => {
      // Arrange
      // Act
      render(
        <SearchProvider>
          <div data-testid='child'>Hello</div>
        </SearchProvider>
      );

      // Assert
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    // Tan Shi Yu, A0251681E
    test('should provide default keyword as empty string and results count as zero', () => {
      // Arrange
      // Act
      render(
        <SearchProvider>
          <TestConsumer />
        </SearchProvider>
      );

      // Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('');
      expect(screen.getByTestId('results-count')).toHaveTextContent('0');
    });
  });

  describe('Interaction Test', () => {
    // Tan Shi Yu, A0251681E
    test('should update the keyword when the setter is called', () => {
      // Arrange
      render(
        <SearchProvider>
          <TestConsumer />
        </SearchProvider>
      );

      // Act
      fireEvent.click(screen.getByRole('button', { name: /set keyword/i }));

      // Assert
      expect(screen.getByTestId('keyword')).toHaveTextContent('iphone');
    });

    // Tan Shi Yu, A0251681E
    test('should update the results when the setter is called', () => {
      // Arrange
      render(
        <SearchProvider>
          <TestConsumer />
        </SearchProvider>
      );

      // Act
      fireEvent.click(screen.getByRole('button', { name: /set results/i }));

      // Assert
      expect(screen.getByTestId('results-count')).toHaveTextContent('2');
    });
  });
});