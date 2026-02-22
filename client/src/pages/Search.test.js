import { render, screen } from "@testing-library/react";
import Search from "../pages/Search"; // adjust path to your Search file
import { useSearch } from "../context/search";

// Mock Layout so we don't depend on its internals
jest.mock("../components/Layout", () => {
  return function LayoutMock({ title, children }) {
    return (
      <div data-testid="layout">
        <div data-testid="layout-title">{title}</div>
        {children}
      </div>
    );
  };
});

// Mock useSearch hook
jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

describe("Search page", () => {
  test("renders heading and 'No Products Found' when results empty", () => {
    // Arrange
    useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

    // Act
    render(<Search />);

    // Assert
    expect(screen.getByText("Search Resuts")).toBeInTheDocument();
    expect(screen.getByText("No Products Found")).toBeInTheDocument();

    // also checks Layout title prop used
    expect(screen.getByTestId("layout-title")).toHaveTextContent("Search results");
  });

  test("renders 'Found N' when results exist", () => {
    // Arrange
    const mockResults = [
      {
        _id: "abc123",
        name: "iPhone",
        description: "This is a very long iPhone description for testing purposes",
        price: 999,
      },
      {
        _id: "def456",
        name: "MacBook",
        description: "MacBook description that is also long enough to substring",
        price: 1999,
      },
    ];

    useSearch.mockReturnValue([{ results: mockResults }, jest.fn()]);

    // Act
    render(<Search />);

    // Assert
    expect(screen.getByText("Found 2")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("MacBook")).toBeInTheDocument();
  });

  test("renders product card details correctly (image, truncated description, price, buttons)", () => {
    // Arrange
    const product = {
      _id: "p1",
      name: "Camera",
      description: "123456789012345678901234567890EXTRA", // 30 chars + extra
      price: 300,
    };

    useSearch.mockReturnValue([{ results: [product] }, jest.fn()]);

    // Act
    render(<Search />);

    // image src + alt
    const img = screen.getByRole("img", { name: "Camera" });
    expect(img).toHaveAttribute("src", `/api/v1/product/product-photo/${product._id}`);
    expect(img).toHaveAttribute("alt", "Camera");

    // description substring(0, 30) + "..."
    const expectedDesc = product.description.substring(0, 30) + "...";

    // Assert
    expect(screen.getByText(expectedDesc)).toBeInTheDocument();

    // price text (note: your component renders: " $ {p.price}")
    expect(screen.getByText(/\$\s*300/)).toBeInTheDocument();

    // buttons
    expect(screen.getByRole("button", { name: /more details/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  test("does not crash if values is undefined (optional chaining)", () => {
    // Arrange
    useSearch.mockReturnValue([undefined, jest.fn()]);

    // Act
    render(<Search />);

    // Assert
    // still shows the heading
    expect(screen.getByText("Search Resuts")).toBeInTheDocument();

    // values?.results.length < 1 becomes undefined < 1 (false),
    // and then it tries `Found ${values?.results.length}` => Found undefined.
    // So we just assert it renders *something* instead of crashing.
    expect(screen.getByText(/Found|No Products Found/)).toBeInTheDocument();
  });
});