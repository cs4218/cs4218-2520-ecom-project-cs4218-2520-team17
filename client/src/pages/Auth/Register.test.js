import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
import Register from './Register';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));

jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };


const renderRegisterComponent = () => {
  axios.get.mockResolvedValueOnce({ data: { category: [] } });
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<></>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Register Component', () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should register the user successfully', async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    renderRegisterComponent();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    // Act
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));

    // Assert
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
  });

  it('should display error message when API call throws error', async () => {
    // Arrange
    const error = new Error('Network Error');
    axios.post.mockRejectedValueOnce(error);
    renderRegisterComponent();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());

    // Act
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));

    // Assert
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    expect(consoleLogSpy).toHaveBeenCalledWith(error);
  });

  // Tan Zhi Heng, A0252037M
  it('should display error message when API call returns success: false', async () => {
    // Arrange
    axios.post.mockResolvedValueOnce({ data: { success: false, message: 'User already exists' } });
    renderRegisterComponent();
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    
    // Act
    fireEvent.change(screen.getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Phone'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(screen.getByPlaceholderText('Enter Your DOB'), { target: { value: '2000-01-01' } });
    fireEvent.change(screen.getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });
    fireEvent.click(screen.getByText('REGISTER'));
    
    // Assert
    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('User already exists');
  });
});
