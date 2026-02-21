// client/src/pages/CategoryProduct.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryProduct from "./CategoryProduct";
import axios from "axios";

jest.mock("axios");

// Mock Layout to avoid header/footer deps
jest.mock("../components/Layout", () => {
  return function LayoutMock({ children }) {
    return <div data-testid="layout">{children}</div>;
  };
});

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useParams: jest.fn(),
    useNavigate: () => mockNavigate,
  };
});

const { useParams } = require("react-router-dom");

describe("CategoryProduct page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("fetches products by category slug and renders category name + results + cards", async () => {
    useParams.mockReturnValue({ slug: "phones" });

    axios.get.mockResolvedValueOnce({
      data: {
        category: { name: "Phones" },
        products: [
          {
            _id: "p1",
            name: "iPhone 15",
            price: 1999,
            slug: "iphone-15",
            description:
              "This is a long description for iPhone 15 that should be truncated for display purposes.",
          },
          {
            _id: "p2",
            name: "Pixel 9",
            price: 999,
            slug: "pixel-9",
            description:
              "This is a long description for Pixel 9 that should be truncated for display purposes.",
          },
        ],
      },
    });

    render(<CategoryProduct />);

    // wait for async render (category heading appears after axios resolves)
    expect(await screen.findByText(/Category - Phones/i)).toBeInTheDocument();

    // count
    expect(screen.getByText(/2 result found/i)).toBeInTheDocument();

    // product names
    expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    expect(screen.getByText("Pixel 9")).toBeInTheDocument();

    // images
    expect(screen.getByRole("img", { name: "iPhone 15" })).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/p1"
    );
    expect(screen.getByRole("img", { name: "Pixel 9" })).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/p2"
    );

    // price formatted
    expect(screen.getByText("$1,999.00")).toBeInTheDocument();
    expect(screen.getByText("$999.00")).toBeInTheDocument();

    // axios called correctly
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-category/phones");
  });

  test("clicking 'More Details' navigates to the product page", async () => {
    useParams.mockReturnValue({ slug: "phones" });

    axios.get.mockResolvedValueOnce({
      data: {
        category: { name: "Phones" },
        products: [
          {
            _id: "p1",
            name: "iPhone 15",
            price: 1999,
            slug: "iphone-15",
            description:
              "This is a long description for iPhone 15 that should be truncated for display purposes.",
          },
        ],
      },
    });

    render(<CategoryProduct />);

    // wait for card to appear
    await screen.findByText(/Category - Phones/i);

    const btn = screen.getByRole("button", { name: /more details/i });
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/product/iphone-15");
  });

  test("does not call axios when slug is missing", () => {
    useParams.mockReturnValue({}); // no slug

    render(<CategoryProduct />);

    expect(axios.get).not.toHaveBeenCalled();
  });
});