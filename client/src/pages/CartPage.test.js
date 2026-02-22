import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CartPage from "./CartPage";
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";

// Mock dependencies
jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../context/cart", () => ({
  useCart: jest.fn(),
}));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

// Mock DropIn component
jest.mock("braintree-web-drop-in-react", () => {
  return function MockDropIn({ onInstance }) {
    return (
      <div data-testid="dropin">
        <button
          data-testid="dropin-ready"
          onClick={() =>
            onInstance({ requestPaymentMethod: () => Promise.resolve({ nonce: "test-nonce" }) })
          }
        >
          Mock DropIn
        </button>
      </div>
    );
  };
});

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock matchMedia
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test data
const mockCartItems = [
  {
    _id: "p1",
    name: "Test Product 1",
    description: "A test product description for item one",
    price: 29.99,
  },
  {
    _id: "p2",
    name: "Test Product 2",
    description: "Another test product description for item two",
    price: 49.99,
  },
];

const mockAuthLoggedIn = {
  user: { name: "John Doe", address: "123 Main St" },
  token: "valid-token",
};

const mockAuthGuest = {
  user: null,
  token: "",
};

const mockAuthNoAddress = {
  user: { name: "Jane Doe", address: "" },
  token: "valid-token",
};

const mockSetCart = jest.fn();
const mockSetAuth = jest.fn();

const renderCartPage = (
  auth = mockAuthLoggedIn,
  cart = mockCartItems
) => {
  useAuth.mockReturnValue([auth, mockSetAuth]);
  useCart.mockReturnValue([cart, mockSetCart]);
  axios.get.mockResolvedValue({ data: { clientToken: "mock-client-token" } });

  return render(
    <MemoryRouter initialEntries={["/cart"]}>
      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="*" element={<div>Other Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe("CartPage", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("Guest User Display", () => {
    // Rayyan, A0259275R
    it("should display 'Hello Guest' when user is not logged in", () => {
      // Arrange & Act
      renderCartPage(mockAuthGuest, []);

      // Assert
      expect(screen.getByText("Hello Guest")).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should display empty cart message when guest has no items", () => {
      // Arrange & Act
      renderCartPage(mockAuthGuest, []);

      // Assert
      expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should display 'please login to checkout' when guest has cart items", () => {
      // Arrange & Act
      renderCartPage(mockAuthGuest, mockCartItems);

      // Assert
      expect(
        screen.getByText(/please login to checkout/)
      ).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should show 'Plase Login to checkout' button when guest user", () => {
      // Arrange & Act
      renderCartPage(mockAuthGuest, mockCartItems);

      // Assert
      expect(
        screen.getByText("Plase Login to checkout")
      ).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should navigate to login with state when login button is clicked", () => {
      // Arrange
      renderCartPage(mockAuthGuest, mockCartItems);

      // Act
      fireEvent.click(screen.getByText("Plase Login to checkout"));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: "/cart",
      });
    });
  });

  describe("Logged In User Display", () => {
    // Rayyan, A0259275R
    it("should display user name when logged in", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, []);

      // Assert
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Hello");
      expect(heading).toHaveTextContent("John Doe");
    });

    // Rayyan, A0259275R
    it("should display item count when cart has items", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(
        screen.getByText(/You Have 2 items in your cart/)
      ).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should display empty cart message when logged in with no items", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, []);

      // Assert
      expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
    });
  });

  describe("Cart Items Rendering", () => {
    // Rayyan, A0259275R
    it("should render all cart items", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(screen.getByText("Test Product 1")).toBeInTheDocument();
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should display truncated descriptions (first 30 chars)", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(
        screen.getByText(
          mockCartItems[0].description.substring(0, 30)
        )
      ).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should display item prices", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(screen.getByText("Price : 29.99")).toBeInTheDocument();
      expect(screen.getByText("Price : 49.99")).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should render product images with correct src and alt", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/p1"
      );
      expect(images[0]).toHaveAttribute("alt", "Test Product 1");
      expect(images[1]).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/p2"
      );
      expect(images[1]).toHaveAttribute("alt", "Test Product 2");
    });

    // Rayyan, A0259275R
    it("should render a Remove button for each cart item", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      const removeButtons = screen.getAllByText("Remove");
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe("Remove Cart Item", () => {
    // Rayyan, A0259275R
    it("should remove item from cart when Remove button is clicked", () => {
      // Arrange
      renderCartPage(mockAuthLoggedIn, mockCartItems);
      const removeButtons = screen.getAllByText("Remove");

      // Act
      fireEvent.click(removeButtons[0]);

      // Assert
      expect(mockSetCart).toHaveBeenCalledWith([mockCartItems[1]]);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([mockCartItems[1]])
      );
    });

    // Rayyan, A0259275R
    it("should remove the correct item when second Remove button is clicked", () => {
      // Arrange
      renderCartPage(mockAuthLoggedIn, mockCartItems);
      const removeButtons = screen.getAllByText("Remove");

      // Act
      fireEvent.click(removeButtons[1]);

      // Assert
      expect(mockSetCart).toHaveBeenCalledWith([mockCartItems[0]]);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([mockCartItems[0]])
      );
    });

    // Rayyan, A0259275R
    it("should result in empty cart when removing the only item", () => {
      // Arrange
      const singleItemCart = [mockCartItems[0]];
      renderCartPage(mockAuthLoggedIn, singleItemCart);

      // Act
      fireEvent.click(screen.getByText("Remove"));

      // Assert
      expect(mockSetCart).toHaveBeenCalledWith([]);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([])
      );
    });
  });

  describe("Total Price", () => {
    // Rayyan, A0259275R
    it("should display the correct total price formatted as USD", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      const totalHeading = screen.getByRole("heading", { level: 4, name: /Total :/ });
      expect(totalHeading).toBeInTheDocument();
      expect(totalHeading).toHaveTextContent("$79.98");
    });

    // Rayyan, A0259275R
    it("should display $0.00 when cart is empty", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, []);

      // Assert
      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    });
  });

  describe("Address Section", () => {
    // Rayyan, A0259275R
    it("should display current address when user has one", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(screen.getByText("Current Address")).toBeInTheDocument();
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should show Update Address button when user has address", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(screen.getByText("Update Address")).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should navigate to profile when Update Address is clicked", () => {
      // Arrange
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Act
      fireEvent.click(screen.getByText("Update Address"));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/user/profile"
      );
    });

    // Rayyan, A0259275R
    it("should show Update Address button when logged in user has no address", () => {
      // Arrange & Act
      renderCartPage(mockAuthNoAddress, mockCartItems);

      // Assert
      expect(screen.getByText("Update Address")).toBeInTheDocument();
    });
  });

  describe("Payment Gateway Token", () => {
    // Rayyan, A0259275R
    it("should fetch braintree token on mount", async () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/braintree/token"
        );
      });
    });

    // Rayyan, A0259275R
    it("should handle error when fetching braintree token fails", async () => {
      // Arrange
      const error = new Error("Token fetch failed");
      useAuth.mockReturnValue([mockAuthLoggedIn, mockSetAuth]);
      useCart.mockReturnValue([mockCartItems, mockSetCart]);
      axios.get.mockRejectedValue(error);

      // Act
      render(
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(error);
      });
    });
  });

  describe("DropIn Payment", () => {
    // Rayyan, A0259275R
    it("should not render DropIn when there is no client token", () => {
      // Arrange
      useAuth.mockReturnValue([mockAuthLoggedIn, mockSetAuth]);
      useCart.mockReturnValue([mockCartItems, mockSetCart]);
      axios.get.mockResolvedValue({ data: {} });

      // Act
      render(
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Assert
      expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should not render DropIn when user is not logged in", () => {
      // Arrange & Act
      renderCartPage(mockAuthGuest, mockCartItems);

      // Assert
      expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should not render DropIn when cart is empty", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, []);

      // Assert
      expect(screen.queryByTestId("dropin")).not.toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should render DropIn when clientToken, auth token, and cart items exist", async () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("dropin")).toBeInTheDocument();
      });
    });

    // Rayyan, A0259275R
    it("should render Make Payment button when DropIn is visible", async () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Make Payment")).toBeInTheDocument();
      });
    });
  });

  describe("Handle Payment", () => {
    // Rayyan, A0259275R
    it("should process payment successfully", async () => {
      // Arrange
      axios.post.mockResolvedValue({ data: { success: true } });
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      await waitFor(() => {
        expect(screen.getByTestId("dropin")).toBeInTheDocument();
      });

      // Simulate DropIn instance ready
      fireEvent.click(screen.getByTestId("dropin-ready"));

      // Act
      fireEvent.click(screen.getByText("Make Payment"));

      // Assert
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/braintree/payment",
          { nonce: "test-nonce", cart: mockCartItems }
        );
      });
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("cart");
      expect(mockSetCart).toHaveBeenCalledWith([]);
      expect(mockNavigate).toHaveBeenCalledWith(
        "/dashboard/user/orders"
      );
      expect(toast.success).toHaveBeenCalledWith(
        "Payment Completed Successfully "
      );
    });

    // Rayyan, A0259275R
    it("should handle payment failure gracefully", async () => {
      // Arrange
      const error = new Error("Payment failed");
      axios.post.mockRejectedValue(error);
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      await waitFor(() => {
        expect(screen.getByTestId("dropin")).toBeInTheDocument();
      });

      // Simulate DropIn instance ready
      fireEvent.click(screen.getByTestId("dropin-ready"));

      // Act
      fireEvent.click(screen.getByText("Make Payment"));

      // Assert
      await waitFor(() => {
        expect(consoleLogSpy).toHaveBeenCalledWith(error);
      });
    });

    // Rayyan, A0259275R
    it("should show 'Processing ....' text while payment is loading", async () => {
      // Arrange
      let resolvePayment;
      axios.post.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePayment = resolve;
          })
      );
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      await waitFor(() => {
        expect(screen.getByTestId("dropin")).toBeInTheDocument();
      });

      // Simulate DropIn instance ready
      fireEvent.click(screen.getByTestId("dropin-ready"));

      // Act
      fireEvent.click(screen.getByText("Make Payment"));

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Processing ....")).toBeInTheDocument();
      });

      // Cleanup - resolve the pending promise
      resolvePayment({ data: { success: true } });
    });
  });

  describe("Payment Button Disabled State", () => {
    // Rayyan, A0259275R
    it("should disable payment button when user has no address", async () => {
      // Arrange
      renderCartPage(mockAuthNoAddress, mockCartItems);

      await waitFor(() => {
        expect(screen.getByTestId("dropin")).toBeInTheDocument();
      });

      // Act
      fireEvent.click(screen.getByTestId("dropin-ready"));

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Make Payment")).toBeDisabled();
      });
    });
  });

  describe("Cart Summary Section", () => {
    // Rayyan, A0259275R
    it("should display Cart Summary heading", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(screen.getByText("Cart Summary")).toBeInTheDocument();
    });

    // Rayyan, A0259275R
    it("should display 'Total | Checkout | Payment' text", () => {
      // Arrange & Act
      renderCartPage(mockAuthLoggedIn, mockCartItems);

      // Assert
      expect(
        screen.getByText("Total | Checkout | Payment")
      ).toBeInTheDocument();
    });
  });
});
