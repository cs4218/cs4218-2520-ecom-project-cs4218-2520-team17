import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import CreateProduct from "./CreateProduct";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
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
    // discard variant and showSearch props as they are non-standard
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

const mockCategories = [
  { _id: "cat1", name: "Electronics", slug: "electronics" },
  { _id: "cat2", name: "Clothing", slug: "clothing" },
];

const mockFile = new File(["dummy photo content"], "photo.jpg", { type: "image/jpeg" });

const renderComponent = () =>
  render(
    <MemoryRouter>
      <CreateProduct />
    </MemoryRouter>
  );

const renderWithMockCategories = async () => {
  axios.get.mockResolvedValue({ data: { success: true, category: mockCategories } });
  const view = renderComponent();
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
  return view;
};

describe("CreateProduct Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    // Li Jiakai, A0252287Y
    test("should render without crashing", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("create-product-container")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render Layout with correct title", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("layout")).toHaveAttribute(
        "data-title",
        "Dashboard - Create Product"
      );
    });

    // Li Jiakai, A0252287Y
    test("should render AdminMenu component", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render Create Product h1 heading", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const heading = screen.getByRole("heading", { name: /create product/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe("H1");
    });

    // Li Jiakai, A0252287Y
    test("should render all product form fields", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByPlaceholderText(/write a name/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/write a description/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/write a price/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/write a quantity/i)).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render Upload Photo label with default text", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByText(/upload photo/i)).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should render Create Product button", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(
        screen.getByRole("button", { name: /create product/i })
      ).toBeInTheDocument();
    });
  });

  describe("Fetching Categories on Mount", () => {
    // Li Jiakai, A0252287Y
    test("should call GET /api/v1/category/get-category on mount", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
    });

    // Li Jiakai, A0252287Y
    test("should display fetched categories in the select dropdown", async () => {
      // Arrange/Act
      await renderWithMockCategories();

      // Assert
      mockCategories.forEach((c) => {
        expect(screen.getByRole("option", { name: c.name })).toBeInTheDocument();
      });
    });

    // Li Jiakai, A0252287Y
    test("should show error toast when category fetch returns success: false", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: false, message: "Failed to fetch categories" } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch categories");
    });

    // Li Jiakai, A0252287Y
    test("should show error toast when category fetch throws an error", async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting category"
      );
    });
  });

  describe("Creating a Product", () => {
    const fillAndSubmitForm = async () => {
      await renderWithMockCategories();

      fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
        target: { value: "Test Product" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
        target: { value: "A test description" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
        target: { value: "99" },
      });
      fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
        target: { value: "10" },
      });
      fireEvent.change(screen.getByTestId("category-select"),
        { target: { value: "cat1" } }
      );
      fireEvent.change(screen.getByTestId("shipping-select"),
        { target: { value: "true" } }
      );
      fireEvent.change(screen.getByLabelText(/upload photo/i), {
        target: { files: [mockFile] },
      });

      fireEvent.click(screen.getByRole("button", { name: /create product/i }));
    };

    // Li Jiakai, A0252287Y
    test("should call POST /api/v1/product/create-product with FormData on submit", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      // Act
      await fillAndSubmitForm();

      // Assert
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/product/create-product",
          expect.any(FormData)
        )
      );
    });

    // Li Jiakai, A0252287Y
    test("should include all form field values in the submitted FormData", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      // Act
      await fillAndSubmitForm();
      await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

      // Assert
      const submittedFormData = axios.post.mock.calls[0][1];
      expect(submittedFormData.get("name")).toBe("Test Product");
      expect(submittedFormData.get("description")).toBe("A test description");
      expect(submittedFormData.get("price")).toBe("99");
      expect(submittedFormData.get("quantity")).toBe("10");
      expect(submittedFormData.get("category")).toBe("cat1");
      expect(submittedFormData.get("shipping")).toBe("true");

      const photoFile = submittedFormData.get("photo");
      expect(photoFile).toBeInstanceOf(File);
      expect(photoFile.name).toBe("photo.jpg");
      expect(photoFile.type).toBe("image/jpeg");

      const reader = new FileReader();
      const photoContent = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(photoFile);
      });
      expect(photoContent).toBe("dummy photo content");
    });

    // Li Jiakai, A0252287Y
    test("should show success toast and navigate to products page on successful create", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({ data: { success: true } });

      // Act
      await fillAndSubmitForm();
      await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    // Li Jiakai, A0252287Y
    test("should show error toast and not navigate when API returns success: false", async () => {
      // Arrange
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Mock Error Message" },
      });

      // Act
      await fillAndSubmitForm();
      await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Mock Error Message");
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    // Li Jiakai, A0252287Y
    test("should show error toast when POST throws a network error", async () => {
      // Arrange
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      axios.post.mockRejectedValueOnce(new Error("Network error"));

      // Act
      await fillAndSubmitForm();
      await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Photo Upload", () => {
    // Li Jiakai, A0252287Y
    test("should display the selected file name in the label", async () => {
      // Arrange
      await renderWithMockCategories();

      // Act
      const fileInput = screen.getByLabelText(/upload photo/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Assert
      expect(screen.getByText("photo.jpg")).toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should display a photo preview image after selecting a file", async () => {
      // Arrange
      await renderWithMockCategories();

      // Act
      const fileInput = screen.getByLabelText(/upload photo/i);
      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Assert
      const img = screen.getByAltText("product_photo");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", "blob:mock-url");
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
    });

    // Li Jiakai, A0252287Y
    test("should not display a photo preview before any file is selected", async () => {
      // Arrange/Act
      await renderWithMockCategories();

      // Assert
      expect(screen.queryByAltText("product_photo")).not.toBeInTheDocument();
    });

    // Li Jiakai, A0252287Y
    test("should reject non-image files", async () => {
      // Arrange
      await renderWithMockCategories();

      // Act
      const fileInput = screen.getByLabelText(/upload photo/i);
      const nonImageFile = new File(["dummy text file"], "file.txt", { type: "text/plain" });
      userEvent.upload(fileInput, nonImageFile);

      // Assert
      expect(screen.queryByText("file.txt")).not.toBeInTheDocument();
      const img = screen.queryByAltText("product_photo");
      expect(img).not.toBeInTheDocument();
    });
  });
});
