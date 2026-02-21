import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ProductDetails from "./ProductDetails";
import axios from "axios";

// ---- mocks ----
jest.mock("axios");

jest.mock("./../components/Layout", () => {
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

describe("ProductDetails page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders product details + similar products after fetching", async () => {
    useParams.mockReturnValue({ slug: "iphone-15" });

    // 1st call: get-product/:slug
    // 2nd call: related-product/:pid/:cid
    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "p1",
            name: "iPhone 15",
            description: "A very cool phone",
            price: 1999,
            slug: "iphone-15",
            category: { _id: "c1", name: "Phones" },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          products: [
            {
              _id: "p2",
              name: "Pixel 9",
              description:
                "Pixel description that is long enough to be truncated and displayed nicely",
              price: 999,
              slug: "pixel-9",
            },
          ],
        },
      });

    render(<ProductDetails />);

    // waits for product name to appear (after state update)
    expect(await screen.findByText(/Name : iPhone 15/i)).toBeInTheDocument();
    expect(screen.getByText(/Description : A very cool phone/i)).toBeInTheDocument();
    expect(screen.getByText(/Category : Phones/i)).toBeInTheDocument();

    // price formatted in USD
    expect(screen.getByText(/Price :\s*\$1,999\.00/)).toBeInTheDocument();

    // product image src
    const mainImg = screen.getByRole("img", { name: "iPhone 15" });
    expect(mainImg).toHaveAttribute("src", "/api/v1/product/product-photo/p1");

    // similar product appears
    expect(screen.getByText("Pixel 9")).toBeInTheDocument();
    const similarImg = screen.getByRole("img", { name: "Pixel 9" });
    expect(similarImg).toHaveAttribute("src", "/api/v1/product/product-photo/p2");

    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/get-product/iphone-15"
    );

    expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/related-product/p1/c1"
    );
  });

  test("shows 'No Similar Products found' when related list is empty", async () => {
    useParams.mockReturnValue({ slug: "iphone-15" });

    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "p1",
            name: "iPhone 15",
            description: "A very cool phone",
            price: 1999,
            slug: "iphone-15",
            category: { _id: "c1", name: "Phones" },
          },
        },
      })
      .mockResolvedValueOnce({
        data: { products: [] },
      });

    render(<ProductDetails />);

    // wait for fetch to finish
    expect(await screen.findByText(/Name : iPhone 15/i)).toBeInTheDocument();

    expect(screen.getByText(/No Similar Products found/i)).toBeInTheDocument();
  });

  test("clicking 'More Details' navigates to the related product page", async () => {
    useParams.mockReturnValue({ slug: "iphone-15" });

    axios.get
      .mockResolvedValueOnce({
        data: {
          product: {
            _id: "p1",
            name: "iPhone 15",
            description: "A very cool phone",
            price: 1999,
            slug: "iphone-15",
            category: { _id: "c1", name: "Phones" },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          products: [
            {
              _id: "p2",
              name: "Pixel 9",
              description: "Pixel description long long long long long long",
              price: 999,
              slug: "pixel-9",
            },
          ],
        },
      });

    render(<ProductDetails />);

    // wait until related product button shows up
    const btn = await screen.findByRole("button", { name: /more details/i });
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/product/pixel-9");
  });
});