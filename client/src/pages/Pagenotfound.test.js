import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Pagenotfound from './Pagenotfound';

// Mock the Layout component
jest.mock('./../components/Layout', () => {
  return function MockLayout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

const renderPagenotfound = () => {
  return render(
    <MemoryRouter>
      <Pagenotfound />
    </MemoryRouter>
  );
};

describe('Pagenotfound Component', () => {
  describe('Rendering', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render component', () => {
      // Arrange & Act
      const { container } = renderPagenotfound();

      // Assert
      expect(container).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Layout with correct title', () => {
      // Arrange & Act
      renderPagenotfound();
      const layout = screen.getByTestId('layout');

      // Assert
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute('data-title', 'Page not found');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render 404 title', () => {
      // Arrange & Act
      renderPagenotfound();

      // Assert
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('404');
      expect(title).toHaveClass('pnf-title');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render error message heading', () => {
      // Arrange & Act
      renderPagenotfound();

      // Assert
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Oops ! Page Not Found');
      expect(heading).toHaveClass('pnf-heading');
    });
  });

  describe('Navigation', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render Go Back link', () => {
      // Arrange & Act
      renderPagenotfound();

      // Assert
      const link = screen.getByRole('link', { name: /go back/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveClass('pnf-btn');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render link with correct href to home page', () => {
      // Arrange & Act
      renderPagenotfound();

      // Assert
      const link = screen.getByRole('link', { name: /go back/i });
      expect(link).toHaveAttribute('href', '/');
    });
  });
});
