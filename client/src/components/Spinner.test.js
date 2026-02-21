import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Spinner from './Spinner';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/current-path' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

const renderSpinner = (path) => {
    return render(
        <MemoryRouter>
        <Spinner path={path} />
        </MemoryRouter>
    );
};

describe('Spinner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Rendering', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should render component without crashing', () => {
        // Arrange & Act
        const { container } = renderSpinner();

        // Assert
        expect(container).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render countdown message with initial count of 3', () => {
        // Arrange & Act
        renderSpinner();

        // Assert
        expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render spinner element with correct role', () => {
        // Arrange & Act
        renderSpinner();

        // Assert
        const spinner = screen.getByRole('status');
        expect(spinner).toBeInTheDocument();
        expect(spinner).toHaveClass('spinner-border');
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should render loading text with visually-hidden class', () => {
        // Arrange & Act
        renderSpinner();

        // Assert
        const loadingText = screen.getByText(/loading.../i);
        expect(loadingText).toBeInTheDocument();
        expect(loadingText).toHaveClass('visually-hidden');
    });
  });

  describe('Countdown Functionality', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should decrement count after 1 second', async () => {
        // Arrange
        renderSpinner();

        // Assert initial state
        expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();

        // Act - advance timer by 1 second
        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        // Assert
        expect(screen.getByText(/redirecting to you in 2 second/i)).toBeInTheDocument();
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should continue counting down to 0', async () => {
        // Arrange
        renderSpinner();

        // Act - advance timer by 3 seconds
        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        // Assert - navigation should be called when count reaches 0
        expect(mockNavigate).toHaveBeenCalled();
    });
  });

  describe('Navigation Functionality', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should navigate to other pages after countdown', async () => {
        // Arrange
        renderSpinner();

        // Act - advance timer to trigger navigation
        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        // Assert
        expect(mockNavigate).toHaveBeenCalledWith('/login', {
            state: '/current-path',
        });
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should pass current location pathname as state', async () => {
        // Arrange
        renderSpinner('home');

        // Act - advance timer to trigger navigation
        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        // Assert
        expect(mockNavigate).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                state: '/current-path',
            })
        );
    });

    // Sebastian Tay Yong Xun, A0252864X
    test('should only navigate once when countdown reaches 0', async () => {
        // Arrange
        renderSpinner();

        // Act
        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        // Assert - count reached 0 and navigation was triggered exactly once
        expect(mockNavigate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should clear interval on unmount', () => {
        // Arrange
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        const { unmount } = renderSpinner();

        // Act
        unmount();

        // Assert
        expect(clearIntervalSpy).toHaveBeenCalled();

        // Cleanup
        clearIntervalSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    // Sebastian Tay Yong Xun, A0252864X
    test('should handle path with leading slash', async () => {
        // Arrange
        renderSpinner('/admin');

        // Act - advance timer to trigger navigation
        await act(async () => {
            jest.advanceTimersByTime(3000);
        });

        // Assert
        expect(mockNavigate).toHaveBeenCalledWith('//admin', {
            state: '/current-path',
        });
    });
  });
});
