import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import About from './About';

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

const renderAbout = () => {
    return render(
        <MemoryRouter>
            <About />
        </MemoryRouter>
    );
};

describe('About Component', () => {
    describe('Render', () => {
        // Sebastian Tay Yong Xun, A0252864X
        test('should render component', () => {
            // Arrange & Act
            const { container } = renderAbout();

            // Assert
            expect(container).toBeInTheDocument();
        });
    });

    describe('Layout Integration', () => {
        test('should render Layout with correct title', () => {
            // Arrange & Act
            renderAbout();

            // Assert
            expect(screen.getByTestId('layout')).toHaveAttribute('data-title', 'About us - Ecommerce app');
        });
    });

    describe('Image Rendering', () => {
        // Sebastian Tay Yong Xun, A0252864X
        test('should render image with correct src and alt', () => {
            // Arrange & Act
            renderAbout();

            // Assert
            const image = screen.getByAltText('about us');
            expect(image).toHaveAttribute('src', '/images/about.jpeg');
        });

        // Sebastian Tay Yong Xun, A0252864X
        test('should render image with correct inline style', () => {
            // Arrange & Act
            renderAbout();

            // Assert
            const image = screen.getByAltText('about us');
            expect(image).toHaveStyle({ width: '100%' });
        });
    });
});
