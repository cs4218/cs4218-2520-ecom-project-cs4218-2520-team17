import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import Orders from './Orders';
import moment from 'moment';

// Mock dependencies
jest.mock('axios');
jest.mock('moment', () => {
  const mMoment = {
    fromNow: jest.fn(() => '2 days ago'),
  };
  return jest.fn(() => mMoment);
});

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock('../../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]),
}));

jest.mock('../../components/UserMenu', () => {
  return function UserMenu() {
    return <div data-testid="user-menu">User Menu Mock</div>;
  };
});

jest.mock('../../components/Layout', () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

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

const { useAuth } = require('../../context/auth');

const renderOrders = () => {
    return render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );
};

describe('Orders Component', () => {
    const mockOrders = [
        {
            _id: '1',
            status: 'Processing',
            buyer: { name: 'John Doe' },
            createAt: '2024-01-01',
            payment: { success: true },
            products: [
                {
                    _id: 'p1',
                    name: 'Product 1',
                    description: 'Description of product 1 with more text',
                    price: 100,
                },
            ],
        },
        {
            _id: '2',
            status: 'Shipped',
            buyer: { name: 'Jane Smith' },
            createAt: '2024-01-05',
            payment: { success: false },
            products: [
                {
                    _id: 'p2',
                    name: 'Product 2',
                    description: 'Description of product 2',
                    price: 200,
                },
                {
                    _id: 'p3',
                    name: 'Product 3',
                    description: 'Description of product 3',
                    price: 150,
                },
            ],
        },
    ];

    const setupAuth = (token) => {
        useAuth.mockReturnValue([{ token }, jest.fn()]);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        setupAuth(null);
    });

    // Sebastian Tay Yong Xun, A0252864X
    it('renders component with correct title and layout', () => {
        renderOrders();

        expect(screen.getByText('All Orders')).toBeInTheDocument();
        expect(screen.getByTestId('user-menu')).toBeInTheDocument();
        expect(screen.getByTestId('layout')).toHaveAttribute('data-title', 'Your Orders');
    });

    describe('Fetching orders', () => {
        // Sebastian Tay Yong Xun, A0252864X
        it('fetches orders when auth token exists', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: mockOrders });
            renderOrders();

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith('/api/v1/order/orders');
                expect(axios.get).toHaveBeenCalledTimes(1);
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('does not fetch orders when no auth token exists', () => {
            setupAuth(null);
            renderOrders();

            expect(axios.get).not.toHaveBeenCalled();
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('re-fetches orders when auth token changes', async () => {
            setupAuth(null);
            const { rerender } = renderOrders();

            expect(axios.get).not.toHaveBeenCalled();

            setupAuth('newToken');
            axios.get.mockResolvedValueOnce({ data: mockOrders });
            
            rerender(
                <MemoryRouter>
                    <Orders />
                </MemoryRouter>
            );

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith('/api/v1/order/orders');
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('handles API error gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            setupAuth('mockToken');
            axios.get.mockRejectedValueOnce(new Error('API Error'));
            renderOrders();

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
            });

            consoleErrorSpy.mockRestore();
        });
    });
    
    describe('Displaying orders', () => {
        // Sebastian Tay Yong Xun, A0252864X
        it('displays multiple orders correctly', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: mockOrders });
            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('Processing')).toBeInTheDocument();
                expect(screen.getByText('Shipped')).toBeInTheDocument();
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('displays payment success status correctly', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('Success')).toBeInTheDocument();
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('displays payment failed status correctly', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[1]]});
            renderOrders();

            await waitFor(() => {
            expect(screen.getByText('Failed')).toBeInTheDocument();
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('displays correct product quantity for single product', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
            renderOrders();

            await waitFor(() => {
                const cells = screen.getAllByText('1');
                expect(cells.length).toBeGreaterThanOrEqual(2); // Order # and Quantity
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('displays correct product quantity for multiple products', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[1]]});
            renderOrders();

            await waitFor(() => {
                const quantityCell = screen.getByText('2');
                expect(quantityCell).toBeInTheDocument();
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('displays all products in an order', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[1]]});
            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('Product 2')).toBeInTheDocument();
                expect(screen.getByText('Product 3')).toBeInTheDocument();
                expect(screen.getByText('Price : 200')).toBeInTheDocument();
                expect(screen.getByText('Price : 150')).toBeInTheDocument();
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('truncates product description to 30 characters', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('Description of product 1 with')).toBeInTheDocument();
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('displays order number starting from 1', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: mockOrders });
            renderOrders();

            await waitFor(() => {
                const orderNumbers = screen.getAllByText(/^[12]$/);
                expect(orderNumbers.length).toBeGreaterThan(0);
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('renders product images with correct src', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
            renderOrders();

            await waitFor(() => {
                const img = screen.getByAltText('Product 1');
                expect(img).toHaveAttribute('src', '/api/v1/product/product-photo/p1');
            });
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('handles empty orders array', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [] });
            renderOrders();

            await waitFor(() => {
                expect(screen.getByText('All Orders')).toBeInTheDocument();
            });
            
            // Verify no order tables are rendered
            const tables = screen.queryAllByRole('table');
            expect(tables.length).toBe(0);
        });

        // Sebastian Tay Yong Xun, A0252864X
        it('calls moment().fromNow() to format dates', async () => {
            setupAuth('mockToken');
            axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
            renderOrders();

            await waitFor(() => {
                expect(moment).toHaveBeenCalledWith(mockOrders[0].createAt);
                expect(screen.getByText('2 days ago')).toBeInTheDocument();
            });
        });
    });
});
