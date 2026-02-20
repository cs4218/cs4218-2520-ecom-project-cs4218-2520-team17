import { render, screen, fireEvent } from '@testing-library/react';
import CategoryForm from './CategoryForm';

describe('CategoryForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    // Li Jiakai, A0252287Y
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

    // Li Jiakai, A0252287Y
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

    // Li Jiakai, A0252287Y
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

    // Li Jiakai, A0252287Y
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
    // Li Jiakai, A0252287Y
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

    // Li Jiakai, A0252287Y
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
