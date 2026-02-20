import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import toast from 'react-hot-toast';
import Profile from './Profile';
import { describe } from 'node:test';

jest.mock('axios');
jest.mock('react-hot-toast');

// Mock context hooks
const mockSetAuth = jest.fn();
const mockAuthState = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '1234567890',
    address: '123 Main Street'
  },
  token: 'mockToken'
};

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [mockAuthState, mockSetAuth])
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(() => JSON.stringify(mockAuthState)),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock window.matchMedia
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

/**
 * Sets up axios mock for the initial category fetch
 */
const setupAxiosMocks = () => {
  axios.get.mockResolvedValueOnce({ data: { category: [] } });
};

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/user/profile']}>
      <Routes>
        <Route path="/dashboard/user/profile" element={<Profile />} />
      </Routes>
    </MemoryRouter>
  );

const renderAndWaitForLoad = async () => {
  setupAxiosMocks();
  const view = renderComponent();
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
  return view;
};

describe('Profile Component', () => {
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    describe('Rendering', () => { 
        //  Sebastian Tay Yong Xun, A0252864X
        it('renders profile form', async () => {
            const { getByText, getByPlaceholderText } = await renderAndWaitForLoad();

            expect(getByText('USER PROFILE')).toBeInTheDocument();
            expect(getByPlaceholderText('Enter Your Name')).toBeInTheDocument();
            expect(getByPlaceholderText('Enter Your Email')).toBeInTheDocument();
            expect(getByPlaceholderText('Enter Your New Password')).toBeInTheDocument();
            expect(getByPlaceholderText('Enter Your Phone Number')).toBeInTheDocument();
            expect(getByPlaceholderText('Enter Your Address')).toBeInTheDocument();
            expect(getByText('UPDATE')).toBeInTheDocument();
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it('should populate form fields with user data from context', async () => {
            const { getByPlaceholderText } = await renderAndWaitForLoad();

            expect(getByPlaceholderText('Enter Your Name').value).toBe('John Doe');
            expect(getByPlaceholderText('Enter Your Email').value).toBe('john@example.com');
            expect(getByPlaceholderText('Enter Your Phone Number').value).toBe('1234567890');
            expect(getByPlaceholderText('Enter Your Address').value).toBe('123 Main Street');
            expect(getByPlaceholderText('Enter Your New Password').value).toBe('');
        });
    });

    describe('Form Functionality', () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it('should allow editing of form fields', async () => {
            const { getByPlaceholderText } = await renderAndWaitForLoad();

            // Email field is disabled, so we only test the other fields
            const nameInput = getByPlaceholderText('Enter Your Name');
            const phoneInput = getByPlaceholderText('Enter Your Phone Number');
            const addressInput = getByPlaceholderText('Enter Your Address');
            const passwordInput = getByPlaceholderText('Enter Your New Password');

            fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
            fireEvent.change(phoneInput, { target: { value: '9876543210' } });
            fireEvent.change(addressInput, { target: { value: '456 Oak Avenue' } });
            fireEvent.change(passwordInput, { target: { value: 'newPassword123' } });

            expect(nameInput.value).toBe('Jane Doe');
            expect(phoneInput.value).toBe('9876543210');
            expect(addressInput.value).toBe('456 Oak Avenue');
            expect(passwordInput.value).toBe('newPassword123');
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it('email field should be disabled', async () => {
            const { getByPlaceholderText } = await renderAndWaitForLoad();

            const emailInput = getByPlaceholderText('Enter Your Email');
            expect(emailInput).toBeDisabled();
        });
    });

    describe('handleSubmit', () => {
        //  Sebastian Tay Yong Xun, A0252864X
        it('should update profile successfully', async () => {
            const updatedUser = {
                name: 'Jane Doe',
                email: 'john@example.com',
                phone: '9876543210',
                address: '456 Oak Avenue'
            };

            axios.put.mockResolvedValueOnce({
            data: {
                success: true,
                updatedUser: updatedUser
            }
            });

            const { getByPlaceholderText, getByText } = await renderAndWaitForLoad();

            fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
            fireEvent.change(getByPlaceholderText('Enter Your Phone Number'), { target: { value: '9876543210' } });
            fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '456 Oak Avenue' } });
            fireEvent.change(getByPlaceholderText('Enter Your New Password'), { target: { value: 'newPassword123' } });

            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
                name: 'Jane Doe',
                email: 'john@example.com',
                password: 'newPassword123',
                phone: '9876543210',
                address: '456 Oak Avenue'
            }));

            expect(mockSetAuth).toHaveBeenCalledWith({
                ...mockAuthState,
                user: updatedUser
            });
            expect(window.localStorage.setItem).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith('Profile Updated Successfully');
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it('should display error message when update fails', async () => {
            const mockError = new Error('Network error');
            axios.put.mockRejectedValueOnce(mockError);

            const { getByPlaceholderText, getByText } = await renderAndWaitForLoad();

            fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong'));
            expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it('should handle error response from API', async () => {
            axios.put.mockResolvedValueOnce({
            data: {
                error: 'Update failed'
            }
            });

            const { getByPlaceholderText, getByText } = await renderAndWaitForLoad();

            fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Jane Doe' } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Update failed'));
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it('should update localStorage with new user data on successful update', async () => {
            const updatedUser = {
            name: 'Updated Name',
            email: 'john@example.com',
            phone: '1111111111',
            address: 'New Address'
            };

            axios.put.mockResolvedValueOnce({
            data: {
                success: true,
                updatedUser: updatedUser
            }
            });

            window.localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockAuthState));

            const { getByPlaceholderText, getByText } = await renderAndWaitForLoad();

            fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'Updated Name' } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalled());
            
            expect(window.localStorage.getItem).toHaveBeenCalledWith('auth');
            expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'auth',
            JSON.stringify({
                ...mockAuthState,
                user: updatedUser
            })
            );
        });

        //  Sebastian Tay Yong Xun, A0252864X
        it('should submit form with empty password field', async () => {
            axios.put.mockResolvedValueOnce({
            data: {
                success: true,
                updatedUser: mockAuthState.user
            }
            });

            const { getByPlaceholderText, getByText } = await renderAndWaitForLoad();

            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/v1/auth/profile', {
                name: 'John Doe',
                email: 'john@example.com',
                password: '',
                phone: '1234567890',
                address: '123 Main Street'
            }));
        });
    });
});
