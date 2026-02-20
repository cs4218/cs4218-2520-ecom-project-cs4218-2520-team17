import { render, screen } from '@testing-library/react';
import Users from './Users';

jest.mock('../../components/AdminMenu', () => () => <div data-testid="mock-admin-menu">Mocked AdminMenu</div>);

jest.mock('../../components/Layout', () => ({ children, title }) => (
  <div data-testid="mock-layout" data-title={title}>{children}</div>
));

describe('Admin Users Page', () => {
  // Li Jiakai, A0252287Y
  test('should render layout with correct title', () => {
    // Arrange & Act
    render(<Users />);
    const layout = screen.getByTestId('mock-layout');

    // Assert
    expect(layout).toBeInTheDocument();
    expect(layout.getAttribute('data-title')).toBe('Dashboard - All Users');
  });

  // Li Jiakai, A0252287Y
  test('should render AdminMenu mock', () => {
    // Arrange & Act
    render(<Users />);
    const adminMenu = screen.getByTestId('mock-admin-menu');

    // Assert
    expect(adminMenu).toBeInTheDocument();
  });

  // Li Jiakai, A0252287Y
  test('should render container with correct classes', () => {
    // Arrange & Act
    render(<Users />);
    const container = screen.getByTestId('admin-users-container');

    // Assert
    expect(container).toHaveClass('container-fluid', 'm-3', 'p-3');
  });

  // Li Jiakai, A0252287Y
  test('should render row with correct class', () => {
    // Arrange & Act
    render(<Users />);
    const row = screen.getByTestId('admin-users-row');

    // Assert
    expect(row).toHaveClass('row');
  });

  // Li Jiakai, A0252287Y
  test('should render sidebar with correct class', () => {
    // Arrange & Act
    render(<Users />);
    const sidebar = screen.getByTestId('admin-users-sidebar');

    // Assert
    expect(sidebar).toHaveClass('col-md-3');
  });

  // Li Jiakai, A0252287Y
  test('should render main with correct class', () => {
    // Arrange & Act
    render(<Users />);
    const main = screen.getByTestId('admin-users-main');

    // Assert
    expect(main).toHaveClass('col-md-9');
  });

  // Li Jiakai, A0252287Y
  test('should render All Users heading with correct level', () => {
    // Arrange & Act
    render(<Users />);
    const heading = screen.getByRole('heading', { name: 'All Users' });

    // Assert
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');
  });
});
