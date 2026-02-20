import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import AdminDashboard from './AdminDashboard';

// Mock dependencies
jest.mock('../../context/auth');
jest.mock('../../components/AdminMenu', () => {
  return () => <div data-testid="admin-menu">Admin Menu Component</div>;
});
jest.mock('../../components/Layout', () => {
  return ({ children }) => <div data-testid="layout">{children}</div>;
});

/**
 * Helper function to render AdminDashboard component with required providers.
 * Sets up MemoryRouter for navigation context.
 *
 * @param {Object} authValue - Authentication value to mock useAuth hook
 */
const renderAdminDashboard = (authValue = { user: null }) => {
  useAuth.mockReturnValue([authValue]);
  return render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  );
};

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    // Li Jiakai, A0252287Y
    test('should render component without crashing', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      const { container } = renderAdminDashboard(authValue);

      // Assert
      expect(container).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test('should render Layout wrapper component', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      renderAdminDashboard(authValue);
      const layout = screen.getByTestId('layout');

      // Assert
      expect(layout).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test('should render AdminMenu component', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      renderAdminDashboard(authValue);
      const adminMenu = screen.getByTestId('admin-menu');

      // Assert
      expect(adminMenu).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    // Li Jiakai, A0252287Y
    test('should render container with correct CSS classes', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      renderAdminDashboard(authValue);
      const containerDiv = screen.getByTestId('admin-dashboard-main');

      // Assert
      expect(containerDiv).toHaveClass('container-fluid', 'm-3', 'p-3');
    });

    // Li Jiakai, A0252287Y
    test('should render row layout with two columns', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      renderAdminDashboard(authValue);
      const row = screen.getByTestId('admin-dashboard-row');
      const columns = screen.getAllByTestId('admin-dashboard-col', {exact: false});

      // Assert
      expect(row).toBeInTheDocument();
      expect(columns.length).toBe(2);
    });

    // Li Jiakai, A0252287Y
    test('should render AdminMenu in col-md-3 sidebar', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      renderAdminDashboard(authValue);
      const sidebarCol = screen.getByTestId('admin-dashboard-col-3');
      const adminMenu = within(sidebarCol).getByTestId('admin-menu');

      // Assert
      expect(sidebarCol).toBeInTheDocument();
      expect(adminMenu).toBeInTheDocument();
      expect(sidebarCol).toHaveClass('col-md-3');
    });

    // Li Jiakai, A0252287Y
    test('should render card content in col-md-9 main area', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      renderAdminDashboard(authValue);
      const mainCol = screen.getByTestId('admin-dashboard-col-9');
      const card = within(mainCol).getByTestId('admin-dashboard-card');

      // Assert
      expect(mainCol).toBeInTheDocument();
      expect(card).toBeInTheDocument();
      expect(mainCol).toHaveClass('col-md-9');
    });

    // Li Jiakai, A0252287Y
    test('should render info card with correct classes', () => {
      // Arrange
      const authValue = { user: null };

      // Act
      renderAdminDashboard(authValue);
      const card = screen.getByTestId('admin-dashboard-card');

      // Assert
      expect(card).toHaveClass('card', 'w-75', 'p-3');
    });
  });

  describe('User Information Display', () => {
    const defaultAuthValue = {
      user: {
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '1234567890'
      }
    };

    // Li Jiakai, A0252287Y
    test('should display admin name when user is available', () => {
      // Arrange + Act
      renderAdminDashboard(defaultAuthValue);
      const nameHeading = screen.getByTestId('admin-dashboard-name');

      // Assert
      expect(nameHeading).toBeInTheDocument();
      expect(nameHeading).toHaveTextContent('Admin Name : Admin User');
    });

    // Li Jiakai, A0252287Y
    test('should display admin email when user is available', () => {
      // Arrange + Act
      renderAdminDashboard(defaultAuthValue);
      const emailHeading = screen.getByTestId('admin-dashboard-email');

      // Assert
      expect(emailHeading).toHaveTextContent('Admin Email : admin@example.com');
    });

    // Li Jiakai, A0252287Y
    test('should display admin contact phone when user is available', () => {
      // Arrange + Act
      renderAdminDashboard(defaultAuthValue);
      const phoneHeading = screen.getByTestId('admin-dashboard-phone');

      // Assert
      expect(phoneHeading).toHaveTextContent('Admin Contact : 1234567890');
    });

    // Li Jiakai, A0252287Y
    test('should render all three heading elements with h3 tag', () => {
      // Arrange + Act
      renderAdminDashboard(defaultAuthValue);
      const headings = screen.getAllByRole('heading');

      // Assert
      expect(headings).toHaveLength(3);
      headings.forEach(heading => {
        expect(heading.tagName).toBe('H3');
      });
    });
  });

  describe('User Data Edge Cases', () => {
    describe('Null, Undefined, and Empty User', () => {
      // Li Jiakai, A0252287Y
      test('should handle null user', () => {
        // Arrange
        const authValue = { user: null };

        // Act
        const { container } = renderAdminDashboard(authValue);

        // Assert
        expect(container).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name :');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email :');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact :');
      });

      // Li Jiakai, A0252287Y
      test('should handle undefined user', () => {
        // Arrange
        const authValue = { user: undefined };

        // Act
        const { container } = renderAdminDashboard(authValue);

        // Assert
        expect(container).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name :');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email :');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact :');
      });

      // Li Jiakai, A0252287Y
      test('should handle empty user', () => {
        // Arrange
        const authValue = { user: {} };

        // Act
        const { container } = renderAdminDashboard(authValue);

        // Assert
        expect(container).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name :');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email :');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact :');
      });

      // Li Jiakai, A0252287Y
      test('should handle null auth value', () => {
        // Arrange
        const authValue = null;

        // Act
        const { container } = renderAdminDashboard(authValue);

        // Assert
        expect(container).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name :');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email :');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact :');
      });

      // Li Jiakai, A0252287Y
      test('should handle undefined auth value', () => {
        // Arrange
        const authValue = undefined;

        // Act
        const { container } = renderAdminDashboard(authValue);

        // Assert
        expect(container).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name :');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email :');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact :');
      });

      // Li Jiakai, A0252287Y
      test('should handle empty auth value', () => {
        // Arrange
        const authValue = {};

        // Act
        const { container } = renderAdminDashboard(authValue);

        // Assert
        expect(container).toBeInTheDocument();
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name :');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email :');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact :');
      });
    });

    describe('Missing User Fields', () => {
      // Li Jiakai, A0252287Y
      test('should display empty string when user name is missing', () => {
        // Arrange
        const authValue = {
          user: {
            email: 'admin@example.com',
            phone: '1234567890'
          }
        };

        // Act
        renderAdminDashboard(authValue);

        // Assert
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name :');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email : admin@example.com');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact : 1234567890');
      });


      // Li Jiakai, A0252287Y
      test('should display empty string when user email is missing', () => {
        // Arrange
        const authValue = {
          user: {
            name: 'Admin User',
            phone: '1234567890'
          }
        };

        // Act
        renderAdminDashboard(authValue);

        // Assert
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name : Admin User');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email :');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact : 1234567890');
      });

      // Li Jiakai, A0252287Y
      test('should display empty string when user phone is missing', () => {
        // Arrange
        const authValue = {
          user: {
            name: 'Admin User',
            email: 'admin@example.com'
          }
        };

        // Act
        renderAdminDashboard(authValue);

        // Assert
        expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name : Admin User');
        expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email : admin@example.com');
        expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact :');
      });
    });
  });

  describe('Auth Context Integration', () => {
    // Li Jiakai, A0252287Y
    test('should call useAuth hook to retrieve auth state', () => {
      // Arrange
      const authValue = { user: null };
      useAuth.mockReturnValue([authValue]);

      // Act
      renderAdminDashboard(authValue);

      // Assert
      expect(useAuth).toHaveBeenCalled();
    });

    // Li Jiakai, A0252287Y
    test('should retrieve user data from auth context array', () => {
      // Arrange
      const authValue = {
        user: {
          name: 'Admin User 1',
          email: 'admin1@example.com',
          phone: '9999999999'
        }
      };

      // Act
      renderAdminDashboard(authValue);

      // Assert
      expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name : Admin User 1');
      expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email : admin1@example.com');
      expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact : 9999999999');
    });

    // Li Jiakai, A0252287Y
    test('should handle multiple renders with different auth states', () => {
      // Arrange
      const authValue1 = {
        user: {
          name: 'First Admin',
          email: 'first@example.com',
          phone: '1111111111'
        }
      };

      // Act
      useAuth.mockReturnValue([authValue1]);
      const { rerender } = render(
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      );
      // Assert initial render
      expect(useAuth).toHaveBeenCalled();
      expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name : First Admin');
      expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email : first@example.com');
      expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact : 1111111111');

      jest.clearAllMocks();

      // Act
      const authValue2 = {
        user: {
          name: 'Second Admin',
          email: 'second@example.com',
          phone: '2222222222'
        }
      };
      useAuth.mockReturnValue([authValue2]);
      rerender(
        <MemoryRouter>
          <AdminDashboard />
        </MemoryRouter>
      );

      // Assert
      expect(useAuth).toHaveBeenCalled();
      expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name : Second Admin');
      expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email : second@example.com');
      expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact : 2222222222');
    });
  });

  describe('Special Characters and Long Text', () => {
    // Li Jiakai, A0252287Y
    test('should handle user name with special characters', () => {
      // Arrange
      const authValue = {
        user: {
          name: "Admin !@#$%^&*()_+-=`~[]{}|;:'\".,<>/?",
          email: 'test@example.com',
          phone: '1234567890'
        }
      };

      // Act
      renderAdminDashboard(authValue);

      // Assert
      expect(screen.getByTestId('admin-dashboard-name')).toHaveTextContent('Admin Name : Admin !@#$%^&*()_+-=`~[]{}|;:\'".,<>/?');

    });

    // Li Jiakai, A0252287Y
    test('should handle email with plus and dot addressing', () => {
      // Arrange
      const authValue = {
        user: {
          name: 'John Admin',
          email: 'john.admin+123@example.com',
          phone: '1234567890'
        }
      };

      // Act
      renderAdminDashboard(authValue);

      // Assert
      expect(screen.getByTestId('admin-dashboard-email')).toHaveTextContent('Admin Email : john.admin+123@example.com');
    });

    // Li Jiakai, A0252287Y
    test('should handle phone numbers with plus and dashes', () => {
      // Arrange
      const authValue = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+65-1800-555-123-4567'
        }
      };

      // Act
      renderAdminDashboard(authValue);

      // Assert
      expect(screen.getByTestId('admin-dashboard-phone')).toHaveTextContent('Admin Contact : +65-1800-555-123-4567');
    });
  });
});
