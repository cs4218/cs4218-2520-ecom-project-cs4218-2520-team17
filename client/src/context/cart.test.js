import React from "react";
import { render, screen } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Test consumer component that displays cart state
const TestConsumer = () => {
  const [cart, setCart] = useCart();
  return (
    <div>
      <span data-testid="cart-length">{cart.length}</span>
      <span data-testid="cart-data">{JSON.stringify(cart)}</span>
      <button
        data-testid="add-item"
        onClick={() =>
          setCart([...cart, { _id: "1", name: "Test Item", price: 10 }])
        }
      >
        Add
      </button>
      <button data-testid="clear-cart" onClick={() => setCart([])}>
        Clear
      </button>
    </div>
  );
};

describe("CartProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rayyan, A0259275R
  it("should provide an empty cart by default when localStorage is empty", () => {
    // Arrange
    window.localStorage.getItem.mockReturnValue(null);

    // Act
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Assert
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
    expect(screen.getByTestId("cart-data").textContent).toBe("[]");
  });

  // Rayyan, A0259275R
  it("should load cart from localStorage on mount", () => {
    // Arrange
    const savedCart = [
      { _id: "1", name: "Item 1", price: 20 },
      { _id: "2", name: "Item 2", price: 30 },
    ];
    window.localStorage.getItem.mockReturnValue(JSON.stringify(savedCart));

    // Act
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Assert
    expect(window.localStorage.getItem).toHaveBeenCalledWith("cart");
    expect(screen.getByTestId("cart-length").textContent).toBe("2");
    expect(screen.getByTestId("cart-data").textContent).toBe(
      JSON.stringify(savedCart)
    );
  });

  // Rayyan, A0259275R
  it("should not update cart when localStorage has no cart key", () => {
    // Arrange
    window.localStorage.getItem.mockReturnValue(null);

    // Act
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Assert
    expect(window.localStorage.getItem).toHaveBeenCalledWith("cart");
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  // Rayyan, A0259275R
  it("should allow updating cart state via setCart", async () => {
    // Arrange
    window.localStorage.getItem.mockReturnValue(null);
    const { getByTestId } = render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Act
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(getByTestId("add-item"));

    // Assert
    expect(screen.getByTestId("cart-length").textContent).toBe("1");
  });

  // Rayyan, A0259275R
  it("should allow clearing the cart via setCart", async () => {
    // Arrange
    const savedCart = [{ _id: "1", name: "Item 1", price: 20 }];
    window.localStorage.getItem.mockReturnValue(JSON.stringify(savedCart));
    const { getByTestId } = render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Act
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.click(getByTestId("clear-cart"));

    // Assert
    expect(screen.getByTestId("cart-length").textContent).toBe("0");
    expect(screen.getByTestId("cart-data").textContent).toBe("[]");
  });

  // Rayyan, A0259275R
  it("should render children components", () => {
    // Arrange
    window.localStorage.getItem.mockReturnValue(null);

    // Act
    render(
      <CartProvider>
        <div data-testid="child">Child Content</div>
      </CartProvider>
    );

    // Assert
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByTestId("child").textContent).toBe("Child Content");
  });

  // Rayyan, A0259275R
  it("should load a single item cart from localStorage", () => {
    // Arrange
    const savedCart = [{ _id: "99", name: "Solo Item", price: 5 }];
    window.localStorage.getItem.mockReturnValue(JSON.stringify(savedCart));

    // Act
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Assert
    expect(screen.getByTestId("cart-length").textContent).toBe("1");
    expect(screen.getByTestId("cart-data").textContent).toBe(
      JSON.stringify(savedCart)
    );
  });
});

describe("useCart", () => {
  // Rayyan, A0259275R
  it("should throw an error when used outside of CartProvider", () => {
    // Arrange
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const BadComponent = () => {
      const [cart] = useCart();
      return <div>{cart}</div>;
    };

    // Act & Assert
    expect(() => render(<BadComponent />)).toThrow();

    // Cleanup
    consoleErrorSpy.mockRestore();
  });
});
