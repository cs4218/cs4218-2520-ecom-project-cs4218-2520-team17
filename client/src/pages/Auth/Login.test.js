import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
import Login from './Login';

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

const renderLoginComponent = () => {
  axios.get.mockResolvedValueOnce({ data: { category: [] } });
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<></>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders login form', async () => {
        // Arrange & Act
        renderLoginComponent();
        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        // Assert
        expect(screen.getByText('LOGIN FORM')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter Your Password')).toBeInTheDocument();
      });

      it('inputs should be initially empty', async () => {
        // Arrange & Act
        renderLoginComponent();
        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        // Assert
        expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('');
        expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('');
      });

      it('should allow typing email and password', async () => {
        // Arrange
        renderLoginComponent();
        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        // Act
        fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });

        // Assert
        expect(screen.getByPlaceholderText('Enter Your Email').value).toBe('test@example.com');
        expect(screen.getByPlaceholderText('Enter Your Password').value).toBe('password123');
      });

    it('should login the user successfully', async () => {
        // Arrange
        axios.post.mockResolvedValueOnce({
            data: {
                success: true,
                user: { id: 1, name: 'John Doe', email: 'test@example.com' },
                token: 'mockToken'
            }
        });
        renderLoginComponent();
        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        // Act
        fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByText('LOGIN'));

        // Assert
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith(undefined, {
            duration: 5000,
            icon: '🙏',
            style: {
                background: 'green',
                color: 'white'
            }
        });
    });

    it('should display error message on failed login', async () => {
        // Arrange
        axios.post.mockRejectedValueOnce({ message: 'Invalid credentials' });
        renderLoginComponent();
        await waitFor(() => expect(axios.get).toHaveBeenCalled());

        // Act
        fireEvent.change(screen.getByPlaceholderText('Enter Your Email'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
        fireEvent.click(screen.getByText('LOGIN'));

        // Assert
        await waitFor(() => expect(axios.post).toHaveBeenCalled());
        expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
});
