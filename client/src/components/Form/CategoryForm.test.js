import { render, screen, fireEvent } from '@testing-library/react';
import CategoryForm from './CategoryForm';
import { beforeEach, describe } from 'node:test';

describe('CategoryForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render input and button', () => {
      // Arrange
      const handleSubmit = jest.fn();
      const setValue = jest.fn();
      const value = '';

      // Act
      render(<CategoryForm handleSubmit={handleSubmit} value={value} setValue={setValue} />);

      // Assert
      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button', { name: /submit/i });
      expect(input).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });

    test('should render input container with mb-3 class', () => {
      // Arrange
      const handleSubmit = jest.fn();
      const setValue = jest.fn();
      const value = '';

      // Act
      render(<CategoryForm handleSubmit={handleSubmit} value={value} setValue={setValue} />);

      // Assert
      const inputContainer = screen.getByTestId('category-form-input-container');
      expect(inputContainer).toBeInTheDocument();
      expect(inputContainer).toHaveClass('mb-3');
    });

    test('should render submit button with btn-primary class', () => {
      // Arrange
      const handleSubmit = jest.fn();
      const setValue = jest.fn();
      const value = '';

      // Act
      render(<CategoryForm handleSubmit={handleSubmit} value={value} setValue={setValue} />);

      // Assert
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveClass('btn btn-primary');
    });

    test('should render value in input field', () => {
      // Arrange
      const handleSubmit = jest.fn();
      const setValue = jest.fn();
      const value = 'Test Category';

      // Act
      render(<CategoryForm handleSubmit={handleSubmit} value={value} setValue={setValue} />);

      // Assert
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue(value);
    });
  });

  describe('Interaction Test', () => {
    test('should call setValue on input change', () => {
      // Arrange
      const handleSubmit = jest.fn();
      const setValue = jest.fn();
      const value = '';

      render(<CategoryForm handleSubmit={handleSubmit} value={value} setValue={setValue} />);
      const input = screen.getByRole('textbox');

      // Act
      fireEvent.change(input, { target: { value: 'Books' } });

      // Assert
      expect(setValue).toHaveBeenCalledWith('Books');
    });

    test('should call handleSubmit when submit button is clicked', () => {
      // Arrange
      const handleSubmit = jest.fn((e) => e.preventDefault());
      const setValue = jest.fn();
      const value = 'Books';

      render(<CategoryForm handleSubmit={handleSubmit} value={value} setValue={setValue} />);
      const button = screen.getByRole('button', { name: /submit/i });

      // Act
      fireEvent.click(button);

      // Assert
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
