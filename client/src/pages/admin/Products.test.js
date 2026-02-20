import { render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import Products from "./Products";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu Component</div>
));

jest.mock("../../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

const mockProducts = [
  {
    _id: "prod_001",
    name: "Laptop",
    slug: "laptop",
    description: "A powerful laptop",
    price: 1200,
    quantity: 10,
    category: "cat_001",
    shipping: true,
  },
  {
    _id: "prod_002",
    name: "Headphones",
    slug: "headphones",
    description: "Noise-cancelling headphones",
    price: 250,
    quantity: 25,
    category: "cat_001",
    shipping: false,
  },
  {
    _id: "prod_003",
    name: "Mechanical Keyboard",
    slug: "mechanical-keyboard",
    description: "Tactile switches for comfortable typing",
    price: 180,
    quantity: 15,
    category: "cat_002",
    shipping: true,
  },
];

/**
 * Renders the Products component inside a MemoryRouter.
 * The MemoryRouter is required because Products uses <Link> from react-router-dom.
 */
const renderProducts = () =>
  render(
    <MemoryRouter>
      <Products />
    </MemoryRouter>
  );


describe("Products (Admin View) Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("Rendering", () => {
    // Li Jiakai, A0252287Y
    test("should render without crashing", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      const { container } = renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(container).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render the Layout wrapper component", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render the AdminMenu component", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test('should render the "All Products List" h1 heading', async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const heading = screen.getByRole("heading", { name: /all products list/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });
  });

  describe("API Integration", () => {
    // Li Jiakai, A0252287Y
    test("should call axios.get with the correct endpoint on mount", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product")
      );
    });

    // Li Jiakai, A0252287Y
    test("should call the products API exactly once on mount", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();

      // Assert
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    });

    // Li Jiakai, A0252287Y
    test("should display products after a successful API response", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Headphones")).toBeInTheDocument();
      expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should call toast.error when the API request fails", async () => {
      // Arrange
      axios.get.mockRejectedValueOnce(new Error("Network Error"));
      jest.spyOn(console, "error").mockImplementation(() => {});

      // Act
      renderProducts();

      // Assert
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Something Went Wrong")
      );
    });

    // Li Jiakai, A0252287Y
    test("should not render any product cards when the API returns an empty list", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.queryAllByRole("link")).toHaveLength(0);
    });
  });

  describe("Product Card Rendering", () => {
    // Li Jiakai, A0252287Y
    test("should render the correct number of product cards", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getAllByRole("link")).toHaveLength(mockProducts.length)
    });

    // Li Jiakai, A0252287Y
    test("should render each product's name as a card title", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
      });
    });

    // Li Jiakai, A0252287Y
    test("should render each product's description as card text", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockProducts.forEach((product) => {
        expect(screen.getByText(product.description)).toBeInTheDocument();
      });
    });

    // Li Jiakai, A0252287Y
    test("should render each product image with a src pointing to the correct photo API endpoint", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockProducts.forEach((product) => {
        const img = screen.getByAltText(product.name);
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute(
          "src",
          `/api/v1/product/product-photo/${product._id}`
        );
      });
    });

    // Li Jiakai, A0252287Y
    test("should render each product image with an alt attribute equal to the product name", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockProducts.forEach((product) => {
        expect(screen.getByAltText(product.name)).toBeInTheDocument();
      });
    });

    // Li Jiakai, A0252287Y
    test("should apply the 'card-img-top' class to each product image", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockProducts.forEach((product) => {
        expect(screen.getByAltText(product.name)).toHaveClass("card-img-top");
      });
    });

    // Li Jiakai, A0252287Y
    test("should apply 'card-title' class (h5) to each product name", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockProducts.forEach((product) => {
        const heading = screen.getByRole("heading", { name: product.name });
        expect(heading).toHaveClass("card-title");
        expect(heading.tagName).toBe("H5");
      });
    });
  });

  describe("Navigation Links", () => {
    // Li Jiakai, A0252287Y
    test("should wrap each product card in a Link pointing to the correct admin edit route", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockProducts.forEach((product) => {
        const link = screen.getByRole("link", { name: new RegExp(product.name, "i") });
        expect(link).toHaveAttribute(
          "href",
          `/dashboard/admin/product/${product.slug}`
        );
      });
    });

    // Li Jiakai, A0252287Y
    test("should apply the 'product-link' class to every product link", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveClass("product-link");
      });
    });
  });

  describe("Layout Structure", () => {
    // Li Jiakai, A0252287Y
    test("should render outer container with the 'row' class", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("admin-products-container")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render a 'col-md-3' sidebar column containing AdminMenu", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const sidebar = screen.getByTestId("admin-products-menu-col");
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveClass("col-md-3");
      expect(within(sidebar).getByTestId("admin-menu")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render a 'col-md-9' main column containing the product list", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const mainCol = screen.getByTestId("admin-products-main-col");
      expect(mainCol).toBeInTheDocument();
      expect(mainCol).toHaveClass("col-md-9");
      expect(mainCol).toContainElement(
        screen.getByRole("heading", { name: /all products list/i })
      );
    });

    // Li Jiakai, A0252287Y
    test("should apply 'text-center' class to the heading", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const heading = screen.getByRole("heading", { name: /all products list/i });
      expect(heading).toHaveClass("text-center");
    });

    // Li Jiakai, A0252287Y
    test("should wrap product cards in a flex container with class 'd-flex'", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const listContainer = screen.getByTestId("admin-products-list-container");
      expect(listContainer).toBeInTheDocument();
      expect(listContainer).toHaveClass("d-flex");
    });

    // Li Jiakai, A0252287Y
    test("should apply 'card' and 'm-2' classes to each product card", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const cards = screen.getAllByTestId("admin-product-card");
      cards.forEach((card) => {
        expect(card).toHaveClass("card", "m-2");
      });
    });
  });

  describe("Edge Cases", () => {
    // Li Jiakai, A0252287Y
    test("should render correctly with a single product", async () => {
      // Arrange
      const singleProduct = [mockProducts[0]];
      axios.get.mockResolvedValueOnce({ data: { products: singleProduct } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getAllByRole("link")).toHaveLength(1);
      expect(screen.getByText(singleProduct[0].name)).toBeInTheDocument();
      expect(
        screen.getByText(singleProduct[0].description)
      ).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render correctly with no products", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: [] } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.queryAllByRole("link")).toHaveLength(0);
      expect(screen.queryAllByTestId("admin-product-card")).toHaveLength(0);
    });

    // Li Jiakai, A0252287Y
    test("should log the error to the console when the API call fails", async () => {
      // Arrange
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const networkError = new Error("Network Error");
      axios.get.mockRejectedValueOnce(networkError);

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(networkError)
    });

    // Li Jiakai, A0252287Y
    test("should not call toast.error on a successful API response", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { products: mockProducts } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).not.toHaveBeenCalled();
    });

    // Li Jiakai, A0252287Y
    test("should render a product whose name and description contain special characters", async () => {
      // Arrange
      const specialProduct = [
        {
          _id: "prod_special",
          name: '<Special> Product !@#$%^&*()_+-=`~[]{}|;:\'".,<>/?',
          slug: "special-product",
          description: "Super Special Product !@#$%^&*()_+-=`~[]{}|;:'\".,<>/?",
          price: 99,
          quantity: 5,
          category: "cat_001",
          shipping: false,
        },
      ];
      axios.get.mockResolvedValueOnce({ data: { products: specialProduct } });

      // Act
      renderProducts();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(
        screen.getByText(specialProduct[0].name)
      ).toBeInTheDocument();
      expect(
        screen.getByText(specialProduct[0].description)
      ).toBeInTheDocument();
    });
  });
});
