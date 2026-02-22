// Rayyan Ismail, A0259275R
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

jest.mock("../hooks/useCategory");

jest.mock("../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

describe("Categories page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the Layout with correct title", () => {
    // Arrange
    useCategory.mockReturnValue([]);

    // Act
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Assert
    const layout = screen.getByTestId("layout");
    expect(layout).toBeInTheDocument();
    expect(layout).toHaveAttribute("data-title", "All Categories");
  });

  it("should render a list of category links", () => {
    // Arrange
    const mockCategories = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Clothing", slug: "clothing" },
      { _id: "3", name: "Books", slug: "books" },
    ];
    useCategory.mockReturnValue(mockCategories);

    // Act
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Assert
    mockCategories.forEach((category) => {
      const link = screen.getByText(category.name);
      expect(link).toBeInTheDocument();
      expect(link.closest("a")).toHaveAttribute(
        "href",
        `/category/${category.slug}`
      );
      expect(link).toHaveClass("btn btn-primary");
    });
  });

  it("should render no links when there are no categories", () => {
    // Arrange
    useCategory.mockReturnValue([]);

    // Act
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Assert
    const links = screen.queryAllByRole("link");
    expect(links).toHaveLength(0);
  });

  it("should render a single category correctly", () => {
    // Arrange
    const mockCategories = [
      { _id: "42", name: "Sports", slug: "sports" },
    ];
    useCategory.mockReturnValue(mockCategories);

    // Act
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    // Assert
    const link = screen.getByText("Sports");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/category/sports");
  });
});
