import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Policy from './Policy';

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

const renderPolicy = () => {
    return render(
        <MemoryRouter>
            <Policy />
        </MemoryRouter>
    );
};

describe('Policy Component', () => {
    describe('Render', () => {
        // Sebastian Tay Yong Xun, A0252864X
        test('should render component', () => {
            // Arrange & Act
            const { container } = renderPolicy();

            // Assert
            expect(container).toBeInTheDocument();
        });
    });

    describe('Layout Integration', () => {
        // Sebastian Tay Yong Xun, A0252864X
        test('should render Layout with correct title', () => {
            // Arrange & Act
            renderPolicy();

            // Assert
            expect(screen.getByTestId('layout')).toHaveAttribute('data-title', 'Privacy Policy');
        });
    });

    describe('Image Rendering', () => {
        // Sebastian Tay Yong Xun, A0252864X
        test('should render image with correct src and alt', () => {
            // Arrange & Act
            renderPolicy();

            // Assert
            const image = screen.getByAltText('contactus');
            expect(image).toHaveAttribute('src', '/images/contactus.jpeg');
        });

        // Sebastian Tay Yong Xun, A0252864X
        test('should render image with correct inline style', () => {
            // Arrange & Act
            renderPolicy();

            // Assert
            const image = screen.getByAltText('contactus');
            expect(image).toHaveStyle({ width: '100%' });
        });
    });
});
