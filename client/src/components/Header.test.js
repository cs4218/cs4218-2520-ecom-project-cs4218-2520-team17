import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from './Header';

// Mock dependencies
jest.mock('react-hot-toast');
jest.mock('../context/auth');
jest.mock('../context/cart');
jest.mock('../context/search');
jest.mock('../hooks/useCategory');

// Import mocked modules
const { useAuth } = require('../context/auth');
const { useCart } = require('../context/cart');
const { useSearch } = require('../context/search');
const useCategory = require('../hooks/useCategory').default;

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock window.matchMedia for antd Badge component
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

const renderHeader = () => {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
};

describe('Header Component', () => {
  let mockSetAuth;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetAuth = jest.fn();
    
    // Default mocks
    useAuth.mockReturnValue([null, mockSetAuth]);
    useCart.mockReturnValue([[]]);
    useSearch.mockReturnValue([{ keyword: '' }, jest.fn()]);
    useCategory.mockReturnValue([]);
  });

  describe('Rendering', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render component without crashing', () => {
      // Arrange & Act
      const { container } = renderHeader();

      // Assert
      expect(container).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Virtual Vault brand name', () => {
      // Arrange & Act
      renderHeader();
      const brandLink = screen.getByRole('link', { name: /virtual vault/i });

      // Assert
      expect(brandLink).toBeInTheDocument();
      expect(brandLink).toHaveAttribute('href', '/');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Home navigation link', () => {
      // Arrange & Act
      renderHeader();
      const homeLink = screen.getByRole('link', { name: /^home$/i });

      // Assert
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Categories dropdown', () => {
      // Arrange & Act
      renderHeader();
      const categoriesLinks = screen.getAllByRole('link', { name: /categories/i });

      // Assert
      expect(categoriesLinks.length).toBeGreaterThan(0);
      expect(categoriesLinks[0]).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Cart link', () => {
      // Arrange & Act
      renderHeader();
      const cartLink = screen.getByRole('link', { name: /cart/i });

      // Assert
      expect(cartLink).toBeInTheDocument();
      expect(cartLink).toHaveAttribute('href', '/cart');
    });
  });

  describe('Authentication - Not Logged In', () => {
    beforeEach(() => {
      useAuth.mockReturnValue([null, mockSetAuth]);
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show Register link when user is not logged in', () => {
      // Arrange & Act
      renderHeader();
      const registerLink = screen.getByRole('link', { name: /register/i });

      // Assert
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show Login link when user is not logged in', () => {
      // Arrange & Act
      renderHeader();
      const loginLink = screen.getByRole('link', { name: /login/i });

      // Assert
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should not show user dropdown when not logged in', () => {
      // Arrange & Act
      renderHeader();

      // Assert
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should handle auth with missing user properties', () => {
      // Arrange
      const incompleteAuth = {
        user: {},
        token: 'token'
      };
      useAuth.mockReturnValue([incompleteAuth, mockSetAuth]);

      // Act
      const { container } = renderHeader();

      // Assert
      expect(container).toBeInTheDocument();
    });
  });

  describe('Authentication - Logged In as Regular User', () => {
    const mockUser = {
      user: {
        name: 'John Doe',
        role: 0
      },
      token: 'mock-token'
    };

    beforeEach(() => {
      useAuth.mockReturnValue([mockUser, mockSetAuth]);
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show user name when logged in', () => {
      // Arrange & Act
      renderHeader();
      const userName = screen.getByText('John Doe');

      // Assert
      expect(userName).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should not show Register and Login links when logged in', () => {
      // Arrange & Act
      renderHeader();

      // Assert
      expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show Dashboard link for regular user', () => {
      // Arrange & Act
      renderHeader();
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });

      // Assert
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard/user');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show Logout link when logged in', () => {
      // Arrange & Act
      renderHeader();
      const logoutLink = screen.getByRole('link', { name: /logout/i });

      // Assert
      expect(logoutLink).toBeInTheDocument();
      expect(logoutLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Authentication - Logged In as Admin', () => {
    const mockAdmin = {
      user: {
        name: 'Admin User',
        role: 1
      },
      token: 'admin-token'
    };

    beforeEach(() => {
      useAuth.mockReturnValue([mockAdmin, mockSetAuth]);
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show admin name when logged in as admin', () => {
      // Arrange & Act
      renderHeader();
      const userName = screen.getByText('Admin User');

      // Assert
      expect(userName).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show Dashboard link for admin user', () => {
      // Arrange & Act
      renderHeader();
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });

      // Assert
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute('href', '/dashboard/admin');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should not show Register and Login links for admin', () => {
      // Arrange & Act
      renderHeader();

      // Assert
      expect(screen.queryByRole('link', { name: /^register$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    const mockUser = {
      user: {
        name: 'Test User',
        role: 0
      },
      token: 'test-token'
    };

    beforeEach(() => {
      useAuth.mockReturnValue([mockUser, mockSetAuth]);
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should call handleLogout when Logout link is clicked', () => {
      // Arrange
      renderHeader();
      const logoutLink = screen.getByRole('link', { name: /logout/i });

      // Act
      fireEvent.click(logoutLink);

      // Assert
      expect(mockSetAuth).toHaveBeenCalledWith({
        ...mockUser,
        user: null,
        token: ""
      });
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should remove auth from localStorage on logout', () => {
      // Arrange
      renderHeader();
      const logoutLink = screen.getByRole('link', { name: /logout/i });

      // Act
      fireEvent.click(logoutLink);

      // Assert
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should show success toast message on logout', () => {
      // Arrange
      renderHeader();
      const logoutLink = screen.getByRole('link', { name: /logout/i });

      // Act
      fireEvent.click(logoutLink);

      // Assert
      expect(toast.success).toHaveBeenCalledWith('Logout Successfully');
    });
  });

  describe('Cart Badge', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should display cart badge with 0 items when cart is empty', () => {
      // Arrange
      useCart.mockReturnValue([[]]);

      // Act
      const { container } = renderHeader();

      // Assert
      const cartLink = screen.getByRole('link', { name: /cart/i });
      expect(cartLink).toBeInTheDocument();

      const badge = container.querySelector('.ant-badge');
      expect(badge).toBeInTheDocument();
      
      const badgeCount = container.querySelector('.ant-badge-count');
      expect(badgeCount).toHaveTextContent('0');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should display cart badge with correct count when cart has items', () => {
      // Arrange
      const mockCart = [
        { _id: '1', name: 'Product 1' },
        { _id: '2', name: 'Product 2' },
        { _id: '3', name: 'Product 3' }
      ];
      useCart.mockReturnValue([mockCart]);

      // Act
      const { container } = renderHeader();

      // Assert
      const cartLink = screen.getByRole('link', { name: /cart/i });
      expect(cartLink).toBeInTheDocument();

      const badge = container.querySelector('.ant-badge');
      expect(badge).toBeInTheDocument();

      const badgeCount = container.querySelector('.ant-badge-count');
      expect(badgeCount).toHaveTextContent('3');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should handle null cart', () => {
      // Arrange
      useCart.mockReturnValue([null]);

      // Act
      const { container } = renderHeader();
      const cartLink = screen.getByRole('link', { name: /cart/i });

      // Assert
      expect(cartLink).toBeInTheDocument();

      const badge = container.querySelector('.ant-badge');
      expect(badge).toBeInTheDocument();

      const badgeCount = container.querySelector('.ant-badge-count');
      expect(badgeCount).toHaveTextContent('0');
    });
  });

  describe('Categories Dropdown', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render categories from useCategory hook', () => {
      // Arrange
      const mockCategories = [
        { _id: '1', name: 'Electronics', slug: 'electronics' },
        { _id: '2', name: 'Clothing', slug: 'clothing' }
      ];
      useCategory.mockReturnValue(mockCategories);

      // Act
      renderHeader();
      const electronicsLink = screen.getByRole('link', { name: /electronics/i });
      const clothingLink = screen.getByRole('link', { name: /clothing/i });

      // Assert
      expect(electronicsLink).toBeInTheDocument();
      expect(electronicsLink).toHaveAttribute('href', '/category/electronics');

      expect(clothingLink).toBeInTheDocument();
      expect(clothingLink).toHaveAttribute('href', '/category/clothing');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should only render All Categories dropdown when no categories available', () => {
      // Arrange
      useCategory.mockReturnValue([]);

      // Act
      const { container } = renderHeader();

      // Assert
      const dropdownMenu = container.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeInTheDocument();
      expect(dropdownMenu.children).toHaveLength(1);
      const allCategoriesLink = screen.getByRole('link', { name: /all categories/i });
      expect(allCategoriesLink).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should handle undefined categories', () => {
      // Arrange
      useCategory.mockReturnValue(undefined);

      // Act
      const { container } = renderHeader();

      // Assert
      const dropdownMenu = container.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeInTheDocument();
      expect(dropdownMenu.children).toHaveLength(1);
      const allCategoriesLink = screen.getByRole('link', { name: /all categories/i });
      expect(allCategoriesLink).toBeInTheDocument();
    });
  });

  describe('Navigation Structure', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should have navbar with correct class', () => {
      // Arrange & Act
      const { container } = renderHeader();
      const navbar = container.querySelector('.navbar');

      // Assert
      expect(navbar).toBeInTheDocument();
      expect(navbar).toHaveClass('navbar-expand-lg', 'bg-body-tertiary');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should have navbar toggler button', () => {
      // Arrange & Act
      const { container } = renderHeader();
      const toggleButton = container.querySelector('.navbar-toggler');

      // Assert
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('type', 'button');
      expect(toggleButton).toHaveAttribute('data-bs-toggle', 'collapse');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should have collapsible navbar content', () => {
      // Arrange & Act
      const { container } = renderHeader();
      const collapseDiv = container.querySelector('.navbar-collapse');

      // Assert
      expect(collapseDiv).toBeInTheDocument();
      expect(collapseDiv).toHaveAttribute('id', 'navbarTogglerDemo01');
    });
  });
});
