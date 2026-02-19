import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import toast from "react-hot-toast";
import AdminOrders from "./AdminOrders";
import { describe } from "node:test";
const { useAuth } = require("../../context/auth");


jest.mock("axios");

jest.mock("../../context/auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

jest.mock("moment", () => {
  const actualMoment = jest.requireActual("moment");
  const mockMoment = (date) => ({
    fromNow: () => "a few seconds ago",
  });
  Object.assign(mockMoment, actualMoment);
  return mockMoment;
});

jest.mock("react-hot-toast");

// Ant Design Select does not render well in jsdom; replace with a simple native
// <select> so we can assert values and fire change events.
jest.mock("antd", () => {
  const MockSelect = ({ children, onChange, defaultValue}) => (
    <select
      data-testid={"order-status-select"}
      defaultValue={defaultValue}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
  MockSelect.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Select: MockSelect };
});

const mockProducts = [
  {
    _id: "prod_001",
    name: "Laptop",
    description: "A powerful laptop for professionals",
    price: 1200,
  },
  {
    _id: "prod_002",
    name: "Headphones",
    description: "Noise-cancelling headphones for immersive audio. This description is intentionally long to test truncation in the UI.",
    price: 250,
  },
];

const mockOrders = [
  {
    _id: "order_001",
    status: "Not Process",
    buyer: { name: "Alice" },
    createdAt: new Date().toISOString(),
    payment: { success: true },
    products: [mockProducts[0]],
  },
  {
    _id: "order_002",
    status: "Shipped",
    buyer: { name: "Bob" },
    createdAt: new Date().toISOString(),
    payment: { success: false },
    products: [mockProducts[0], mockProducts[1]],
  },
];

/**
 * Renders AdminOrders inside a MemoryRouter.
 * Defaults to an authenticated state (token present).
 */
const renderAdminOrders = () =>
  render(
    <MemoryRouter>
      <AdminOrders />
    </MemoryRouter>
  );


describe("AdminOrders Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
  });

  describe("Layout and structure", () => {
    test("should render Layout wrapper with correct title", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("layout")).toBeInTheDocument();
      expect(screen.getByTestId("layout")).toHaveAttribute(
        "data-title",
        "All Orders Data"
      );
    });

    test("should render AdminMenu component", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    test("should render 'All Orders' heading", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const heading = screen.getByRole("heading", { name: /all orders/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });

    test("should render menu column with correct class", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const menuCol = screen.getByTestId("admin-orders-menu-col");
      expect(menuCol).toBeInTheDocument();
      expect(menuCol).toHaveClass("col-md-3");
    });

    test("should render content column with correct class", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const contentCol = screen.getByTestId("admin-orders-content-col");
      expect(contentCol).toBeInTheDocument();
      expect(contentCol).toHaveClass("col-md-9");
    });
  });

  describe("API integration", () => {
    test("should call the all-orders endpoint on mount when token is present", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/order/all-orders")
      );
    });

    test("should call the all-orders endpoint exactly once on mount", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();

      // Assert
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    });

    test("should not call the all-orders endpoint when there is no auth token", async () => {
      // Arrange
      useAuth.mockReturnValue([{ token: "" }, jest.fn()]);

      // Act
      renderAdminOrders();

      // Assert
      await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
    });

    test("should log error to console and show error toast when the API request fails", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const toastSpy = jest.spyOn(toast, "error").mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error("Network Error"));

      // Act
      renderAdminOrders();

      // Assert
      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
      await waitFor(() => expect(toastSpy).toHaveBeenCalledWith("Failed to fetch orders"));
    });
  });

  describe("Order list rendering", () => {
    test("should render no order tables when API returns an empty array", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.queryAllByRole("table")).toHaveLength(0);
    });

    test("should render one table per order", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getAllByRole("table")).toHaveLength(mockOrders.length);
    });

    test("should render order id for each order", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockOrders.forEach((o) => {
        expect(screen.getByText(o._id)).toBeInTheDocument();
      });
    });

    test("should render the buyer name for each order", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockOrders.forEach((o) => {
        expect(screen.getByText(o.buyer.name)).toBeInTheDocument();
      });
    });

    test("should render 'Success' for a successful payment", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const paymentStatus = screen.getByTestId("order-payment-status");
      expect(paymentStatus).toBeInTheDocument();
      expect(within(paymentStatus).getByText("Success")).toBeInTheDocument();
    });

    test("should render 'Failed' for an unsuccessful payment", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[1]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const paymentStatus = screen.getByTestId("order-payment-status");
      expect(paymentStatus).toBeInTheDocument();
      expect(within(paymentStatus).getByText("Failed")).toBeInTheDocument();
    });

    test("should render the product quantity for each order", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockOrders.forEach((o) => {
        const row = screen.getByRole("row", { name: new RegExp(o._id) });
        const quantityCell = within(row).getByTestId("order-product-count");
        expect(quantityCell).toBeInTheDocument();
        expect(within(quantityCell).getByText(o.products.length.toString())).toBeInTheDocument();
      });
    });

    test("should render a relative date for each order", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getAllByText("a few seconds ago")).toHaveLength(
        mockOrders.length
      );
    });
  });

  describe("Status dropdown", () => {
    test("should render a status select for each order", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getAllByTestId("order-status-select")).toHaveLength(
        mockOrders.length
      );
    });

    test("should display all valid status options in the dropdown", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const select = screen.getByTestId("order-status-select");
      const options = within(select).getAllByRole("option");
      const optionValues = options.map((o) => o.value);
      expect(optionValues).toEqual([
        "Not Process",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ]);
    });

    test("should set the default value of the select to the order's current status", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[1]] }); // status: "Shipped"

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("order-status-select")).toHaveValue("Shipped");
    });

    test("should call PUT endpoint with correct orderId and new status on change", async () => {
      // Arrange
      // Fetching initial data
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
      // Mock response for status update
      axios.put.mockResolvedValueOnce({ data: {} });
      // Fetching updated data
      axios.get.mockResolvedValueOnce({ data: [{ ...mockOrders[0], status: "Processing" }] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
      await userEvent.selectOptions(
        screen.getByTestId("order-status-select"),
        "Processing"
      );

      // Assert
      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/order/order-status/${mockOrders[0]._id}`,
          { status: "Processing" }
        )
      );
    });

    test("should refresh the orders list after a successful status update", async () => {
      // Arrange
      // Fetching initial data
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
      // Mock response for status update
      axios.put.mockResolvedValueOnce({ data: {} });
      // Fetching updated data
      axios.get.mockResolvedValueOnce({ data: [{ ...mockOrders[0], status: "Processing" }] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
      await userEvent.selectOptions(
        screen.getByTestId("order-status-select"),
        "Processing"
      );

      // Assert
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
      expect(screen.getByTestId("order-status-select")).toHaveValue("Processing");
    });

    test("should log error to console and show error toast when the status update fails", async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const toastSpy = jest.spyOn(toast, "error").mockImplementation(() => {});
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });
      axios.put.mockRejectedValueOnce(new Error("Update failed"));

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
      await userEvent.selectOptions(
        screen.getByTestId("order-status-select"),
        "Processing"
      );

      // Assert
      await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
      await waitFor(() => expect(toastSpy).toHaveBeenCalledWith("Failed to update order status"));
    });
  });

  describe("Product cards rendering within orders", () => {
    test("should render a product card for every product in every order", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: mockOrders });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert — mockOrders has 1 + 2 = 3 products total
      const totalProducts = mockOrders.reduce(
        (sum, o) => sum + o.products.length,
        0
      );
      expect(screen.getAllByRole("img")).toHaveLength(totalProducts);
    });

    test("should render the product name inside each product card", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByText("Laptop")).toBeInTheDocument();
    });

    test("should render a truncated description (first 30 chars) in each product card", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(
        screen.getByText(mockProducts[0].description.substring(0, 30))
      ).toBeInTheDocument();
    });

    test("should render the product price in each product card", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByText(`Price : ${mockProducts[0].price}`)).toBeInTheDocument();
    });

    test("should render a product image with the correct photo API src", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[0]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const img = screen.getByAltText("Laptop");
      expect(img).toHaveAttribute(
        "src",
        `/api/v1/product/product-photo/${mockProducts[0]._id}`
      );
    });

    test("should render the product image with correct alt text", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: [mockOrders[1]] });

      // Act
      renderAdminOrders();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByAltText("Laptop")).toBeInTheDocument();
      expect(screen.getByAltText("Headphones")).toBeInTheDocument();
    });
  });
});
