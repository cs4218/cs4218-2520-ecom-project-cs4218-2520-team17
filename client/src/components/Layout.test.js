import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { Helmet } from 'react-helmet';

// Mock child components
jest.mock('./Header', () => {
  return function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  };
});

jest.mock('./Footer', () => {
  return function MockFooter() {
    return <div data-testid="mock-footer">Footer</div>;
  };
});

jest.mock('react-hot-toast', () => ({
  Toaster: function MockToaster() {
    return <div data-testid="mock-toaster">Toaster</div>;
  },
}));

// Helper function to render Layout with Router
const renderLayout = (props = {}) => {
  return render(
    <MemoryRouter>
      <Layout {...props}>
        <div data-testid="test-children">Test Content</div>
      </Layout>
    </MemoryRouter>
  );
};

describe('Layout Component', () => {
  describe('Rendering', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render component without crashing', () => {
        // Arrange & Act
        const { container } = renderLayout();

        // Assert
        expect(container).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Header component', () => {
        // Arrange & Act
        renderLayout();

        // Assert
        const header = screen.getByTestId('mock-header');
        expect(header).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Footer component', () => {
        // Arrange & Act
        renderLayout();

        // Assert
        const footer = screen.getByTestId('mock-footer');
        expect(footer).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Toaster component', () => {
        // Arrange & Act
        renderLayout();

        // Assert
        const toaster = screen.getByTestId('mock-toaster');
        expect(toaster).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render children content', () => {
        // Arrange & Act
        renderLayout();

        // Assert
        const children = screen.getByTestId('test-children');
        expect(children).toBeInTheDocument();
        expect(children).toHaveTextContent('Test Content');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render main element with correct styling', () => {
        // Arrange & Act
        renderLayout();

        // Assert
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
        expect(main).toHaveStyle({ minHeight: '70vh' });
    });
  });

  describe('Helmet Meta Tags', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render Helmet with default props', () => {
        // Arrange & Act
        renderLayout();
        const helmet = Helmet.peek();

        // Assert
        expect(helmet.title).toBe('Ecommerce app - shop now');
        expect(helmet.metaTags).toContainEqual(
            expect.objectContaining({ name: 'description', content: 'mern stack project' })
        );
        expect(helmet.metaTags).toContainEqual(
            expect.objectContaining({ name: 'keywords', content: 'mern,react,node,mongodb' })
        );
        expect(helmet.metaTags).toContainEqual(
            expect.objectContaining({ name: 'author', content: 'Techinfoyt' })
        );
    });
  });

  describe('Multiple Children', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render multiple children elements', () => {
      // Arrange & Act
      render(
        <MemoryRouter>
          <Layout>
            <div data-testid="child-1">Child 1</div>
            <div data-testid="child-2">Child 2</div>
            <div data-testid="child-3">Child 3</div>
          </Layout>
        </MemoryRouter>
      );

      // Assert
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render with no children', () => {
        // Arrange & Act
        render(
            <MemoryRouter>
            <Layout />
            </MemoryRouter>
        );

        // Assert
        const main = screen.getByRole('main');
        expect(main).toBeInTheDocument();
        expect(screen.getByTestId('mock-header')).toBeInTheDocument();
        expect(screen.getByTestId('mock-footer')).toBeInTheDocument();

        expect(screen.queryByTestId('test-children')).not.toBeInTheDocument();
        expect(main.children.length).toBe(1); // Only Toaster
    });
  });
});
