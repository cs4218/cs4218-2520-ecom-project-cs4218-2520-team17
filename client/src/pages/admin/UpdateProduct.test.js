import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import UpdateProduct from "./UpdateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useParams: () => ({ slug: "test-product" }),
}));

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

jest.mock("antd", () => {
  const Select = ({ children, onChange, value, placeholder, className, variant, showSearch, ...rest }) => (
    // discard variant and showSearch as they are non-standard
    <select
      className={className}
      value={value ?? ""}
      onChange={(e) => onChange && onChange(e.target.value)}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return { Select };
});

const mockProduct = {
  _id: "prod1",
  name: "Test Product",
  description: "Test Description",
  price: 99,
  quantity: 10,
  shipping: true,
  category: { _id: "cat1" },
};

const mockCategories = [
  { _id: "cat1", name: "Electronics", slug: "electronics" },
  { _id: "cat2", name: "Clothing", slug: "clothing" },
];

const mockPhoto = new File(["image content"], "new-photo.jpg", {
  type: "image/jpeg",
});

/**
 * Mocks axios.get for get single product and get all categories endpoints
 */
const setupAxiosMocks = () => {
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/v1/product/get-product/")) {
      return Promise.resolve({ data: { success: true, product: mockProduct } });
    }
    return Promise.resolve({ data: { success: true, category: mockCategories } });
  });
};

const renderComponent = () =>
  render(
    <MemoryRouter>
      <UpdateProduct />
    </MemoryRouter>
  );

const renderAndWaitForLoad = async () => {
  setupAxiosMocks();
  const view = renderComponent();
  // Wait for both product and categories to load
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product/test-product"));
  await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category"));
  return view;
};

describe("UpdateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    test("should render without crashing", async () => {
      // Arrange
      setupAxiosMocks();

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(screen.getByTestId("update-product-container")).toBeInTheDocument();
    });

    test("should render Layout with correct title", async () => {
      // Arrange
      setupAxiosMocks();

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(screen.getByTestId("layout")).toHaveAttribute(
        "data-title",
        "Dashboard - Update Product"
      );
    });

    test("should render AdminMenu component", async () => {
      // Arrange
      setupAxiosMocks();

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    test("should render Update Product heading", async () => {
      // Arrange
      setupAxiosMocks();

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(
        screen.getByRole("heading", { name: /update product/i })
      ).toBeInTheDocument();
    });

    test("should render Update Product and Delete Product buttons", async () => {
      // Arrange
      setupAxiosMocks();

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(
        screen.getByRole("button", { name: /update product/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /delete product/i })
      ).toBeInTheDocument();
    });
  });

  describe("Fetching Product and Categories on Mount", () => {
    test("should call GET /api/v1/product/get-product/:slug on mount", async () => {
      // Arrange
      setupAxiosMocks();

      // Act
      renderComponent();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith(
          "/api/v1/product/get-product/test-product"
        )
      );
    });

    test("should call GET /api/v1/category/get-category on mount", async () => {
      // Arrange
      setupAxiosMocks();

      // Act
      renderComponent();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
    });

    test("should populate form fields with the fetched product data", async () => {
      // Arrange/Act
      await renderAndWaitForLoad();

      // Assert
      expect(screen.getByDisplayValue("Test Product")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Test Description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("99")).toBeInTheDocument();
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });

    test("should populate the category select with the product's category", async () => {
      // Arrange/Act
      await renderAndWaitForLoad();

      // Assert
      const categorySelect = screen.getByTestId("category-select");
      expect(categorySelect).toHaveValue("cat1");
    });

    test("should populate the shipping select with the product's shipping value", async () => {
      // Arrange/Act
      await renderAndWaitForLoad();

      // Assert
      const shippingSelect = screen.getByTestId("shipping-select");
      expect(shippingSelect).toHaveValue("true");
    });

    test("should display fetched categories as options in the category select", async () => {
      // Arrange/Act
      await renderAndWaitForLoad();

      // Assert
      mockCategories.forEach((cat) => {
        expect(
          screen.getByRole("option", { name: new RegExp(cat.name, "i") })
        ).toBeInTheDocument();
      });
    });

    test("should show the existing product photo from API before a new photo is selected", async () => {
      // Arrange/Act
      await renderAndWaitForLoad();

      // Assert
      const img = screen.getByAltText("product_photo");
      expect(img).toHaveAttribute(
        "src",
        "/api/v1/product/product-photo/prod1"
      );
    });

    test("should show error toast when product fetch returns success: false", async () => {
      // Arrange
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({ data: { success: false, message: "Mock Error Message" } });
        }
        return Promise.resolve({ data: { success: true, category: [] } });
      });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Mock Error Message");
    });

    test("should log error and show error toast when product fetch throws an error", async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.reject(new Error("Network error"));
        }
        return Promise.resolve({ data: { success: true, category: [] } });
      });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting product details"
      );
    });

    test("should show error toast when category fetch returns success: false", async () => {
      // Arrange
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({ data: { success: true, product: mockProduct } });
        }
        return Promise.resolve({ data: { success: false, message: "Mock Error Message" } });
      });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Mock Error Message");
    });

    test("should log error and show error toast when category fetch throws an error", async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      axios.get.mockImplementation((url) => {
        if (url.includes("/api/v1/product/get-product/")) {
          return Promise.resolve({ data: { product: mockProduct } });
        }
        return Promise.reject(new Error("Network error"));
      });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category"
      );
    });
  });

  describe("Photo Upload", () => {
    test("should display selected photo file name in the label", async () => {
      // Arrange
      await renderAndWaitForLoad();

      // Act
      const fileInput = screen.getByLabelText(/upload photo/i);
      fireEvent.change(fileInput, { target: { files: [mockPhoto] } });

      // Assert
      expect(screen.getByText("new-photo.jpg")).toBeInTheDocument();
    });

    test("should show a blob preview when a new photo is selected", async () => {
      // Arrange
      await renderAndWaitForLoad();

      // Act
      const fileInput = screen.getByLabelText(/upload photo/i);
      fireEvent.change(fileInput, { target: { files: [mockPhoto] } });

      // Assert
      const img = screen.getByAltText("product_photo");
      expect(img).toHaveAttribute("src", "blob:mock-url");
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockPhoto);
    });
  });

  describe("Updating a Product", () => {
    test("should call PUT /api/v1/product/update-product/:id with FormData on submit", async () => {
      // Arrange
      await renderAndWaitForLoad();
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      // Act
      fireEvent.click(screen.getByRole("button", { name: /update product/i }));

      // Assert
      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/product/update-product/prod1`,
          expect.any(FormData)
        )
      );
    });

    test("should include updated field values in the submitted FormData", async () => {
      // Arrange
      await renderAndWaitForLoad();
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
        target: { value: "Updated Product" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
        target: { value: "Updated description" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
        target: { value: "4218" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
        target: { value: "4218" },
      });
      fireEvent.change(screen.getByTestId("category-select"), {
        target: { value: "cat2" },
      });
      fireEvent.change(screen.getByTestId("shipping-select"), {
        target: { value: "false" },
      });
      const fileInput = screen.getByLabelText(/upload photo/i);
      fireEvent.change(fileInput, { target: { files: [mockPhoto] } });

      // Act
      fireEvent.click(screen.getByRole("button", { name: /update product/i }));
      await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

      // Assert
      const submittedFormData = axios.put.mock.calls[0][1];
      expect(submittedFormData.get("name")).toBe("Updated Product");
      expect(submittedFormData.get("description")).toBe("Updated description");
      expect(submittedFormData.get("price")).toBe("4218");
      expect(submittedFormData.get("quantity")).toBe("4218");
      expect(submittedFormData.get("category")).toBe("cat2");
      expect(submittedFormData.get("shipping")).toBe("false");
      expect(submittedFormData.get("photo")).toBe(mockPhoto);
    });

    test("should show success toast and navigate to products page on successful update", async () => {
      // Arrange
      await renderAndWaitForLoad();
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      // Act
      fireEvent.click(screen.getByRole("button", { name: /update product/i }));
      await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Product Updated Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    test("should show error toast and not navigate when API returns success: false", async () => {
      // Arrange
      await renderAndWaitForLoad();
      axios.put.mockResolvedValueOnce({
        data: { success: false, message: "Update failed" },
      });

      // Act
      fireEvent.click(screen.getByRole("button", { name: /update product/i }));
      await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Update failed");
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("should show error toast when PUT throws a network error", async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await renderAndWaitForLoad();
      axios.put.mockRejectedValueOnce(new Error("Network error"));

      // Act
      fireEvent.click(screen.getByRole("button", { name: /update product/i }));
      await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Deleting a Product", () => {
    test("should show a confirmation prompt when delete button is clicked", async () => {
      // Arrange
      await renderAndWaitForLoad();
      window.confirm = jest.fn().mockReturnValue(false);

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

      // Assert
      expect(window.confirm).toHaveBeenCalledWith(
        "Are you sure you want to delete this product?"
      );
    });

    test("should call DELETE /api/v1/product/delete-product/:id when prompt is confirmed", async () => {
      // Arrange
      await renderAndWaitForLoad();
      window.confirm = jest.fn().mockReturnValue(true);
      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

      // Assert
      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith(
          "/api/v1/product/delete-product/prod1"
        )
      );
    });

    test("should show success toast and navigate after successful delete", async () => {
      // Arrange
      await renderAndWaitForLoad();
      window.confirm = jest.fn().mockReturnValue(true);
      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));
      await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Product Deleted Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    test("should not call DELETE when window.confirm returns false", async () => {
      // Arrange
      await renderAndWaitForLoad();
      window.confirm = jest.fn().mockReturnValue(false);

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

      // Assert
      expect(axios.delete).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("should not call DELETE when window.confirm returns undefined", async () => {
      // Arrange
      await renderAndWaitForLoad();
      window.confirm = jest.fn().mockReturnValue(undefined);

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));

      // Assert
      expect(axios.delete).not.toHaveBeenCalled();
    });

    test("should show error toast when API returns success: false on delete", async () => {
      // Arrange
      await renderAndWaitForLoad();
      window.confirm = jest.fn().mockReturnValue(true);
      axios.delete.mockResolvedValueOnce({
        data: { success: false, message: "Delete failed" },
      });

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));
      await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    });

    test("should log error and show error toast when DELETE throws a network error", async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await renderAndWaitForLoad();
      window.confirm = jest.fn().mockReturnValue(true);
      axios.delete.mockRejectedValueOnce(new Error("Network error"));

      // Act
      fireEvent.click(screen.getByRole("button", { name: /delete product/i }));
      await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    });
  });
});
