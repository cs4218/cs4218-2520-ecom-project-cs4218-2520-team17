import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const renderFooter = () => {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
};

describe('Footer Component', () => {
  describe('Rendering', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render component without crashing', () => {
      // Arrange & Act
      const { container } = renderFooter();

      // Assert
      expect(container).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render copyright text correctly', () => {
      // Arrange & Act
      renderFooter();
      const copyrightText = screen.getByText(/all rights reserved © testingcomp/i);

      // Assert
      expect(copyrightText).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render copyright text as h4 heading with correct classes', () => {
      // Arrange & Act
      renderFooter();
      const heading = screen.getByRole('heading', { name: /all rights reserved © testingcomp/i });

      // Assert
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H4');
      expect(heading).toHaveClass('text-center');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render footer with correct CSS class', () => {
      // Arrange & Act
      const { container } = renderFooter();
      const footerDiv = container.querySelector('.footer');

      // Assert
      expect(footerDiv).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render all three navigation links', () => {
      // Arrange
      const expectedLinks = ['About', 'Contact', 'Privacy Policy'];

      // Act
      renderFooter();

      // Assert
      expectedLinks.forEach(linkText => {
        const link = screen.getByRole('link', { name: linkText });
        expect(link).toBeInTheDocument();
      });
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render About link with correct route', () => {
      // Arrange & Act
      renderFooter();
      const aboutLink = screen.getByRole('link', { name: /about/i });

      // Assert
      expect(aboutLink).toBeInTheDocument();
      expect(aboutLink).toHaveAttribute('href', '/about');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Contact link with correct route', () => {
      // Arrange & Act
      renderFooter();
      const contactLink = screen.getByRole('link', { name: /contact/i });

      // Assert
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Privacy Policy link with correct route', () => {
      // Arrange & Act
      renderFooter();
      const policyLink = screen.getByRole('link', { name: /privacy policy/i });

      // Assert
      expect(policyLink).toBeInTheDocument();
      expect(policyLink).toHaveAttribute('href', '/policy');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render links as anchor elements', () => {
      // Arrange & Act
      renderFooter();
      const links = screen.getAllByRole('link');

      // Assert
      expect(links).toHaveLength(3);
      links.forEach(link => {
        expect(link.tagName).toBe('A');
      });
    });
  });

  describe('Layout and Styling', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render links container with correct CSS classes', () => {
      // Arrange & Act
      const { container } = renderFooter();
      const linksContainer = container.querySelector('p.text-center.mt-3');

      // Assert
      expect(linksContainer).toBeInTheDocument();
      expect(linksContainer).toHaveClass('text-center');
      expect(linksContainer).toHaveClass('mt-3');
    });
  });
});
