import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminMenu from './AdminMenu';

const renderAdminMenu = () => {
  return render(
    <MemoryRouter>
      <AdminMenu />
    </MemoryRouter>
  );
};

describe('AdminMenu Component', () => {
  describe('Rendering', () => {
    test('should render component without crashing', () => {
      // Arrange & Act
      const { container } = renderAdminMenu();

      // Assert
      expect(container).toBeInTheDocument();
    });

    test('should render Admin Panel heading with correct level', () => {
      // Arrange & Act
      renderAdminMenu();
      const heading = screen.getByRole('heading', { name: /admin panel/i });

      // Assert
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H4');
    });

    test('should render all navigation links', () => {
      // Arrange
      const expectedLinks = [
        'Create Category',
        'Create Product',
        'Products',
        'Orders',
        'Users'
      ];

      // Act
      renderAdminMenu();

      // Assert
      expectedLinks.forEach(linkText => {
        expect(screen.getByRole('link', { name: linkText })).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Links', () => {
    test('should have correct href for Create Category link', () => {
      // Arrange & Act
      renderAdminMenu();
      const link = screen.getByRole('link', { name: /^create category$/i });

      // Assert
      expect(link).toHaveAttribute('href', '/dashboard/admin/create-category');
    });

    test('should have correct href for Create Product link', () => {
      // Arrange & Act
      renderAdminMenu();
      const link = screen.getByRole('link', { name: /^create product$/i });

      // Assert
      expect(link).toHaveAttribute('href', '/dashboard/admin/create-product');
    });

    test('should have correct href for Products link', () => {
      // Arrange & Act
      renderAdminMenu();
      const link = screen.getByRole('link', { name: /^products$/i });

      // Assert
      expect(link).toHaveAttribute('href', '/dashboard/admin/products');
    });

    test('should have correct href for Orders link', () => {
      // Arrange & Act
      renderAdminMenu();
      const link = screen.getByRole('link', { name: /orders/i });

      // Assert
      expect(link).toHaveAttribute('href', '/dashboard/admin/orders');
    });

    test('should have correct href for Users link', () => {
      // Arrange & Act
      renderAdminMenu();
      const link = screen.getByRole('link', { name: /users/i });

      // Assert
      expect(link).toHaveAttribute('href', '/dashboard/admin/users');
    });
  });

  describe('CSS Classes', () => {
    test('should apply correct CSS classes to navigation links', () => {
      // Arrange & Act
      renderAdminMenu();
      const links = screen.getAllByRole('link');

      // Assert
      links.forEach(link => {
        expect(link).toHaveClass('list-group-item', 'list-group-item-action');
      });
    });

    test('should have text-center class on main container', () => {
      // Arrange & Act
      renderAdminMenu();
      const mainContainer = screen.getByTestId('admin-menu-main');

      // Assert
      expect(mainContainer).toHaveClass('text-center');
    });

    test('should have dashboard-menu class on menu list container', () => {
      // Arrange & Act
      renderAdminMenu();
      const menuDiv = screen.getByTestId('admin-menu-list');

      // Assert
      expect(menuDiv).toHaveClass('dashboard-menu');
    });
  });
});
