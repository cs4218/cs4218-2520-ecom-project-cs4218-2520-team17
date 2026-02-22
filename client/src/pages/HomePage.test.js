import React from "react";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import HomePage from "./HomePage";
import "@testing-library/jest-dom";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

const mockCart = [];
const mockSetCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: jest.fn(() => [mockCart, mockSetCart]),
}));

jest.mock("../styles/Homepages.css", () => ({}));

jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => <span data-testid="reload-icon">reload</span>,
}));

jest.mock("antd", () => {
  const React = require("react");
  const RadioContext = React.createContext(null);
  const Checkbox = ({ children, onChange }) => (
    <label>
      <input
        type="checkbox"
        onChange={(e) => onChange({ target: { checked: e.target.checked } })}
      />
      {children}
    </label>
  );
  const RadioGroup = ({ children, onChange }) => (
    <RadioContext.Provider value={onChange}>
      <div data-testid="radio-group">{children}</div>
    </RadioContext.Provider>
  );
  const Radio = ({ children, value }) => {
    const groupOnChange = React.useContext(RadioContext);
    return (
      <label>
        <input
          type="radio"
          name="price-filter"
          onChange={() =>
            groupOnChange && groupOnChange({ target: { value } })
          }
        />
        {children}
      </label>
    );
  };
  Radio.Group = RadioGroup;
  return { Checkbox, Radio };
});

// --- Test Data ---

const mockCategories = [
  { _id: "cat1", name: "Electronics", slug: "electronics" },
  { _id: "cat2", name: "Clothing", slug: "clothing" },
];

const mockProducts = [
  {
    _id: "p1",
    name: "Test Product 1",
    slug: "test-product-1",
    description:
      "This is a test product description that is longer than sixty characters for testing",
    price: 29.99,
    quantity: 10,
  },
  {
    _id: "p2",
    name: "Test Product 2",
    slug: "test-product-2",
    description:
      "Another test product description that is also longer than sixty characters total",
    price: 49.99,
    quantity: 5,
  },
];

const mockProductsPage2 = [
  {
    _id: "p3",
    name: "Test Product 3",
    slug: "test-product-3",
    description:
      "Third test product description that is certainly longer than sixty characters here",
    price: 99.99,
    quantity: 3,
  },
];

// Helper: set up default API mocks for initial render
const setupDefaultMocks = () => {
  // 1st call: getAllCategory
  axios.get.mockResolvedValueOnce({
    data: { success: true, category: mockCategories },
  });
  // 2nd call: getTotal
  axios.get.mockResolvedValueOnce({
    data: { total: 6 },
  });
  // 3rd call: getAllProducts
  axios.get.mockResolvedValueOnce({
    data: { products: mockProducts },
  });
};

const renderHomePage = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

// --- Tests ---

describe("HomePage", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("Initial Rendering", () => {
    // Rayyan Ismail, A0259275
    test("should render without crashing", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      const { container } = renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(container).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should render the Layout component with correct title", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      const layout = screen.getByTestId("layout");
      expect(layout).toBeInTheDocument();
      expect(layout).toHaveAttribute(
        "data-title",
        "ALL Products - Best offers "
      );
    });

    // Rayyan Ismail, A0259275
    test("should render the banner image", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      const banner = screen.getByAltText("bannerimage");
      expect(banner).toBeInTheDocument();
      expect(banner).toHaveAttribute("src", "/images/Virtual.png");
      expect(banner).toHaveClass("banner-img");
    });

    // Rayyan Ismail, A0259275
    test("should render 'All Products' heading", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(
        screen.getByRole("heading", { name: /all products/i })
      ).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should render 'Filter By Category' heading", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(
        screen.getByRole("heading", { name: /filter by category/i })
      ).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should render 'Filter By Price' heading", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(
        screen.getByRole("heading", { name: /filter by price/i })
      ).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should render 'RESET FILTERS' button", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      const resetBtn = screen.getByRole("button", { name: /reset filters/i });
      expect(resetBtn).toBeInTheDocument();
      expect(resetBtn).toHaveClass("btn", "btn-danger");
    });
  });

  describe("API Calls on Mount", () => {
    // Rayyan Ismail, A0259275
    test("should fetch categories on mount", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/category/get-category"
        )
      );
    });

    // Rayyan Ismail, A0259275
    test("should fetch product count on mount", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/product-count"
        )
      );
    });

    // Rayyan Ismail, A0259275
    test("should fetch products for page 1 on mount", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/product-list/1"
        )
      );
    });
  });

  describe("Category Display", () => {
    // Rayyan Ismail, A0259275
    test("should display category checkboxes after fetching categories", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Electronics")).toBeInTheDocument()
      );

      // Assert
      expect(screen.getByText("Clothing")).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should render checkboxes for each category", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Electronics")).toBeInTheDocument()
      );

      // Assert
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(mockCategories.length);
    });
  });

  describe("Price Filter Display", () => {
    // Rayyan Ismail, A0259275
    test("should display price filter radio buttons", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      expect(screen.getByText("$0 to 19")).toBeInTheDocument();
      expect(screen.getByText("$20 to 39")).toBeInTheDocument();
      expect(screen.getByText("$40 to 59")).toBeInTheDocument();
      expect(screen.getByText("$60 to 79")).toBeInTheDocument();
      expect(screen.getByText("$80 to 99")).toBeInTheDocument();
      expect(screen.getByText("$100 or more")).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should render radio inputs for each price range", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());

      // Assert
      const radios = screen.getAllByRole("radio");
      expect(radios.length).toBe(6);
    });
  });

  describe("Product Display", () => {
    // Rayyan Ismail, A0259275
    test("should display product names", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      expect(screen.getByText("Test Product 2")).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should display truncated product descriptions", async () => {
      // Arrange
      setupDefaultMocks();
      const truncated1 = mockProducts[0].description.substring(0, 60) + "...";
      const truncated2 = mockProducts[1].description.substring(0, 60) + "...";

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      expect(screen.getByText(truncated1)).toBeInTheDocument();
      expect(screen.getByText(truncated2)).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should display product prices in USD currency format", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      expect(screen.getByText("$29.99")).toBeInTheDocument();
      expect(screen.getByText("$49.99")).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should render product images with correct src and alt", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      mockProducts.forEach((p) => {
        const img = screen.getByAltText(p.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute(
          "src",
          `/api/v1/product/product-photo/${p._id}`
        );
        expect(img).toHaveClass("card-img-top");
      });
    });

    // Rayyan Ismail, A0259275
    test("should render 'More Details' button for each product", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      const detailButtons = screen.getAllByRole("button", {
        name: /more details/i,
      });
      expect(detailButtons.length).toBe(mockProducts.length);
    });

    // Rayyan Ismail, A0259275
    test("should render 'ADD TO CART' button for each product", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      const cartButtons = screen.getAllByRole("button", {
        name: /add to cart/i,
      });
      expect(cartButtons.length).toBe(mockProducts.length);
    });

    // Rayyan Ismail, A0259275
    test("should render no product cards when products list is empty", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: mockCategories },
      });
      axios.get.mockResolvedValueOnce({ data: { total: 0 } });
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

      // Assert
      expect(
        screen.queryByRole("button", { name: /more details/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    // Rayyan Ismail, A0259275
    test("should navigate to product detail page when 'More Details' is clicked", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );
      const detailButtons = screen.getAllByRole("button", {
        name: /more details/i,
      });
      fireEvent.click(detailButtons[0]);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(
        `/product/${mockProducts[0].slug}`
      );
    });

    // Rayyan Ismail, A0259275
    test("should navigate to the correct slug for each product", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 2")).toBeInTheDocument()
      );
      const detailButtons = screen.getAllByRole("button", {
        name: /more details/i,
      });
      fireEvent.click(detailButtons[1]);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(
        `/product/${mockProducts[1].slug}`
      );
    });
  });

  describe("Add to Cart", () => {
    // Rayyan Ismail, A0259275
    test("should add product to cart when 'ADD TO CART' is clicked", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );
      const cartButtons = screen.getAllByRole("button", {
        name: /add to cart/i,
      });
      fireEvent.click(cartButtons[0]);

      // Assert
      expect(mockSetCart).toHaveBeenCalledWith([...mockCart, mockProducts[0]]);
    });

    // Rayyan Ismail, A0259275
    test("should save cart to localStorage when adding to cart", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );
      const cartButtons = screen.getAllByRole("button", {
        name: /add to cart/i,
      });
      fireEvent.click(cartButtons[0]);

      // Assert
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "cart",
        JSON.stringify([...mockCart, mockProducts[0]])
      );
    });

    // Rayyan Ismail, A0259275
    test("should show success toast when adding to cart", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );
      const cartButtons = screen.getAllByRole("button", {
        name: /add to cart/i,
      });
      fireEvent.click(cartButtons[0]);

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
    });
  });

  describe("Load More", () => {
    // Rayyan Ismail, A0259275
    test("should show 'Loadmore' button when products < total", async () => {
      // Arrange
      setupDefaultMocks();

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      expect(
        screen.getByRole("button", { name: /loadmore/i })
      ).toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should not show 'Loadmore' button when products >= total", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: mockCategories },
      });
      axios.get.mockResolvedValueOnce({ data: { total: 2 } });
      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );

      // Assert
      expect(
        screen.queryByRole("button", { name: /loadmore/i })
      ).not.toBeInTheDocument();
    });

    // Rayyan Ismail, A0259275
    test("should load more products when 'Loadmore' button is clicked", async () => {
      // Arrange
      setupDefaultMocks();
      axios.get.mockResolvedValueOnce({
        data: { products: mockProductsPage2 },
      });

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );
      const loadMoreBtn = screen.getByRole("button", { name: /loadmore/i });
      fireEvent.click(loadMoreBtn);

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/product-list/2"
        )
      );
      await waitFor(() =>
        expect(screen.getByText("Test Product 3")).toBeInTheDocument()
      );
    });
  });

  describe("Category Filter", () => {
    // Rayyan Ismail, A0259275
    test("should call filter API when a category checkbox is checked", async () => {
      // Arrange
      setupDefaultMocks();
      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] },
      });

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Electronics")).toBeInTheDocument()
      );
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      // Assert
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/product-filters",
          { checked: ["cat1"], radio: [] }
        )
      );
    });

    // Rayyan Ismail, A0259275
    test("should display filtered products after category filter", async () => {
      // Arrange
      setupDefaultMocks();
      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] },
      });

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Electronics")).toBeInTheDocument()
      );
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      // Assert
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );
    });

    // Rayyan Ismail, A0259275
    test("should not call getAllProducts again when a category checkbox is checked", async () => {
      // Arrange
      setupDefaultMocks();
      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] },
      });

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Electronics")).toBeInTheDocument()
      );
      const getCallCountBeforeFilter = axios.get.mock.calls.length;
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);
      await waitFor(() => expect(axios.post).toHaveBeenCalled());

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(getCallCountBeforeFilter);
    });

    // Rayyan Ismail, A0259275
    test("should remove category from filter when unchecked", async () => {
      // Arrange
      setupDefaultMocks();
      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] },
      });
      axios.get.mockResolvedValueOnce({
        data: { products: mockProducts },
      });

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Electronics")).toBeInTheDocument()
      );
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);
      await waitFor(() => expect(axios.post).toHaveBeenCalled());
      fireEvent.click(checkboxes[0]);

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/product-list/1"
        )
      );
    });
  });

  describe("Price Filter", () => {
    // Rayyan Ismail, A0259275
    test("should not call getAllProducts again when a price radio is selected", async () => {
      // Arrange
      setupDefaultMocks();
      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] },
      });

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));
      const getCallCountBeforeFilter = axios.get.mock.calls.length;
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);
      await waitFor(() => expect(axios.post).toHaveBeenCalled());

      // Assert
      expect(axios.get).toHaveBeenCalledTimes(getCallCountBeforeFilter);
    });

    // Rayyan Ismail, A0259275
    test("should call filter API when a price radio is selected", async () => {
      // Arrange
      setupDefaultMocks();
      axios.post.mockResolvedValueOnce({
        data: { products: [mockProducts[0]] },
      });

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("$0 to 19")).toBeInTheDocument()
      );
      const radios = screen.getAllByRole("radio");
      fireEvent.click(radios[0]);

      // Assert
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/product-filters",
          { checked: [], radio: [0, 19] }
        )
      );
    });
  });

  describe("Error Handling", () => {
    // Rayyan Ismail, A0259275
    test("should log error when getAllCategory fails", async () => {
      // Arrange
      const error = new Error("Category fetch failed");
      axios.get.mockRejectedValueOnce(error);
      axios.get.mockResolvedValueOnce({ data: { total: 0 } });
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderHomePage();

      // Assert
      await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(error));
    });

    // Rayyan Ismail, A0259275
    test("should log error when getTotal fails", async () => {
      // Arrange
      const error = new Error("Count fetch failed");
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
      axios.get.mockRejectedValueOnce(error);
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderHomePage();

      // Assert
      await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(error));
    });

    // Rayyan Ismail, A0259275
    test("should log error when getAllProducts fails", async () => {
      // Arrange
      const error = new Error("Products fetch failed");
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
      axios.get.mockResolvedValueOnce({ data: { total: 0 } });
      axios.get.mockRejectedValueOnce(error);

      // Act
      renderHomePage();

      // Assert
      await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(error));
    });

    // Rayyan Ismail, A0259275
    test("should log error when filterProduct fails", async () => {
      // Arrange
      setupDefaultMocks();
      const error = new Error("Filter failed");
      axios.post.mockRejectedValueOnce(error);

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Electronics")).toBeInTheDocument()
      );
      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]);

      // Assert
      await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(error));
    });

    // Rayyan Ismail, A0259275
    test("should log error when loadMore fails", async () => {
      // Arrange
      setupDefaultMocks();
      const error = new Error("Load more failed");
      axios.get.mockRejectedValueOnce(error);

      // Act
      renderHomePage();
      await waitFor(() =>
        expect(screen.getByText("Test Product 1")).toBeInTheDocument()
      );
      const loadMoreBtn = screen.getByRole("button", { name: /loadmore/i });
      fireEvent.click(loadMoreBtn);

      // Assert
      await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledWith(error));
    });

    // Rayyan Ismail, A0259275
    test("should set loading to false when getAllProducts fails", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: [] },
      });
      axios.get.mockResolvedValueOnce({ data: { total: 6 } });
      axios.get.mockRejectedValueOnce(new Error("fail"));

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

      // Assert
      expect(screen.queryByText("Loading ...")).not.toBeInTheDocument();
    });
  });

  describe("Reset Filters", () => {
    // Rayyan Ismail, A0259275
    test("should call window.location.reload when reset button is clicked", async () => {
      // Arrange
      setupDefaultMocks();
      const reloadMock = jest.fn();
      Object.defineProperty(window, "location", {
        value: { reload: reloadMock },
        writable: true,
      });

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalled());
      const resetBtn = screen.getByRole("button", { name: /reset filters/i });
      fireEvent.click(resetBtn);

      // Assert
      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe("Categories API edge cases", () => {
    // Rayyan Ismail, A0259275
    test("should not set categories when API returns success: false", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({
        data: { success: false, category: [] },
      });
      axios.get.mockResolvedValueOnce({ data: { total: 0 } });
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderHomePage();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(3));

      // Assert
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });
});
