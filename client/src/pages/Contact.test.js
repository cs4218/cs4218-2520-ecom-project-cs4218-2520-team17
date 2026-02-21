import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Contact from './Contact';

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

// Mock react-icons
jest.mock('react-icons/bi', () => ({
  BiMailSend: () => <span data-testid="mail-icon">Mail Icon</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">Phone Icon</span>,
  BiSupport: () => <span data-testid="support-icon">Support Icon</span>
}));

const renderContact = () => {
  return render(
    <MemoryRouter>
      <Contact />
    </MemoryRouter>
  );
};

describe('Contact Component', () => {
  describe('Rendering', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render component', () => {
      // Arrange & Act
      const { container } = renderContact();

      // Assert
      expect(container).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render Layout with correct title', () => {
      // Arrange & Act
      renderContact();
      const layout = screen.getByTestId('layout');

      // Assert
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute('data-title', 'Contact us');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render contact us image', () => {
      // Arrange & Act
      renderContact();
      const image = screen.getByAltText('contactus');

      // Assert
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/images/contactus.jpeg');
    });
  });
});
