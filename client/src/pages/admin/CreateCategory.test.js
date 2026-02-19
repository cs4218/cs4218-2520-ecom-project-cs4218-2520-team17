import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import CreateCategory from "./CreateCategory";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/AdminMenu", () => () => (
  <div data-testid="admin-menu">Admin Menu</div>
));

jest.mock("../../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout" data-title={title}>
    {children}
  </div>
));

// Mock antd Modal
jest.mock("antd", () => ({
  Modal: ({ children, open, onCancel }) =>
    open ? (
      <div data-testid="edit-modal">
        <button data-testid="modal-cancel-btn" onClick={onCancel}>
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

const mockCategories = [
  { _id: "cat1", name: "Electronics", slug: "electronics" },
  { _id: "cat2", name: "Clothing", slug: "clothing" },
];

const renderComponent = () => render(<CreateCategory />);

const renderWithMockCategories = async () => {
  axios.get.mockResolvedValue({
    data: { success: true, category: mockCategories },
  });
  renderComponent();
  await screen.findByText("Electronics");
};

describe("CreateCategory Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("Initial Rendering", () => {
    test("should render without crashing", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("create-category-container")).toBeInTheDocument();
    });

    test("should render Layout with correct title", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const layout = screen.getByTestId("layout");
      expect(layout).toHaveAttribute("data-title", "Dashboard - Create Category");
    });

    test("should render AdminMenu component", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("admin-menu")).toBeInTheDocument()
    });

    test("should render Manage Category heading", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(
        screen.getByRole("heading", { name: /manage category/i })
      ).toBeInTheDocument()
    });

    test("should render category table headers", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: /actions/i })).toBeInTheDocument();
    });

    test("should render the create category form", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(screen.getByTestId("category-form")).toBeInTheDocument()
    });
  });

  describe("Fetching Categories on Mount", () => {
    test("should call GET to correct API endpoint on mount", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: true, category: [] } });

      // Act
      renderComponent();

      // Assert
      await waitFor(() =>
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category")
      );
    });

    test("should display fetched categories in the table", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: mockCategories },
      });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      mockCategories.forEach((cat) => {
        expect(screen.getByText(cat.name)).toBeInTheDocument();
      });
    });

    test("should render one table row per category", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({
        data: { success: true, category: mockCategories },
      });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      const rows = screen.getAllByTestId("category-row");
      expect(rows).toHaveLength(mockCategories.length);
    });

    test("should show error toast when fetching categories returns success: false", async () => {
      // Arrange
      axios.get.mockResolvedValueOnce({ data: { success: false, message: "Failed to fetch categories" } });

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch categories");
    });

    test("should show error toast when fetching categories throws an error", async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error("Network error"));

      // Act
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong in getting category");
    });
  });


  describe("Creating a Category", () => {
    test("should call POST endpoint with the entered name on submit", async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { success: true, category: [] } });
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
        target: { value: "Books" },
      });
      fireEvent.submit(screen.getByTestId("category-form"));

      // Assert
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/category/create-category",
          { name: "Books" }
        )
      );
    });

    test("should show success toast and refresh categories on successful create", async () => {
      // Arrange
      axios.get.mockResolvedValue({
        data: { success: true, category: mockCategories },
      });
      axios.post.mockResolvedValueOnce({ data: { success: true } });
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
        target: { value: "Books" },
      });
      fireEvent.submit(screen.getByTestId("category-form"));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/category/create-category",
          { name: "Books" }
        )
      );

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Category Books created");
      expect(axios.get).toHaveBeenCalledTimes(2);
    });

    test("should show error toast when API returns success: false on create", async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: { success: true, category: [] } });
      axios.post.mockResolvedValueOnce({
        data: { success: false, message: "Category already exists" },
      });
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
        target: { value: "Electronics" },
      });
      fireEvent.submit(screen.getByTestId("category-form"));
      await waitFor(() =>
        expect(axios.post).toHaveBeenCalledWith(
          "/api/v1/category/create-category",
          { name: "Electronics" }
        )
      );

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Category already exists")
    });

    test("should show error toast when POST throws a network error", async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      axios.get.mockResolvedValue({ data: { success: true, category: [] } });
      axios.post.mockRejectedValueOnce(new Error("Network error"));
      renderComponent();
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter new category/i), {
        target: { value: "Books" },
      });
      fireEvent.submit(screen.getByTestId("category-form"));
      await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong in input form");
    });
  });

  describe("Editing a Category", () => {
    test("should open the edit modal when Edit button is clicked", async () => {
      // Arrange
      await renderWithMockCategories();

      // Act
      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Assert
      expect(screen.getByTestId("edit-modal")).toBeInTheDocument();
    });

    test("should pre-fill the modal form with the selected category name", async () => {
      // Arrange
      await renderWithMockCategories();

      // Act
      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]); // Electronics

      // Assert
      const modal = screen.getByTestId("edit-modal")
      const modalInput = within(modal).getByRole("textbox");
      expect(modalInput).toHaveValue("Electronics");
    });

    test("should close the modal when cancel button is clicked", async () => {
      // Arrange
      await renderWithMockCategories();
      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]);
      await screen.findByTestId("edit-modal");

      // Act
      fireEvent.click(screen.getByTestId("modal-cancel-btn"));

      // Assert
      expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();
    });

    test("should call PUT endpoint with updated name on update submit", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Act
      const modal = screen.getByTestId("edit-modal");
      const modalInput = within(modal).getByRole("textbox");
      fireEvent.change(modalInput, { target: { value: "New Category" } });
      fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));

      // Assert
      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/category/update-category/${mockCategories[0]._id}`,
          { name: "New Category" }
        )
      );
    });

    test("should show success toast and close modal on successful update", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.put.mockResolvedValueOnce({ data: { success: true } });

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]);

      const modal = screen.getByTestId("edit-modal");
      const modalInput = within(modal).getByRole("textbox");
      fireEvent.change(modalInput, { target: { value: "New Category" } });

      // Act
      fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));
      await waitFor(() =>
        expect(axios.put).toHaveBeenCalledWith(
          `/api/v1/category/update-category/${mockCategories[0]._id}`,
          { name: "New Category" }
        )
      );

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Category New Category is updated");
      expect(screen.queryByTestId("edit-modal")).not.toBeInTheDocument();
    });

    test("should refresh category list after successful update", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.put.mockResolvedValueOnce({ data: { success: true } });
      const callsBefore = axios.get.mock.calls.length;

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Act
      const modal = screen.getByTestId("edit-modal");
      fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));
      await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

      // Assert
      expect(axios.get.mock.calls.length).toBeGreaterThan(callsBefore)
    });

    test("should show error toast when API returns success: false on update", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.put.mockResolvedValueOnce({
        data: { success: false, message: "Update failed" },
      });

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Act
      const modal = screen.getByTestId("edit-modal");
      fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));
      await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Update failed")
    });

    test("should show error toast when PUT throws a network error", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.put.mockRejectedValueOnce(new Error("Network error"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const editButtons = screen.getAllByRole("button", { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Act
      const modal = screen.getByTestId("edit-modal");
      fireEvent.click(within(modal).getByRole("button", { name: /submit/i }));
      await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong")
    });
  });

  describe("Deleting a Category", () => {
    test("should call DELETE endpoint with correct id on delete", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.delete.mockResolvedValueOnce({ data: { success: true } });

      // Act
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      fireEvent.click(deleteButtons[0]);

      // Assert
      await waitFor(() =>
        expect(axios.delete).toHaveBeenCalledWith(
          `/api/v1/category/delete-category/${mockCategories[0]._id}`
        )
      );
    });

    test("should show success toast and refresh categories on successful delete", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.delete.mockResolvedValueOnce({ data: { success: true } });
      const callsBefore = axios.get.mock.calls.length;

      // Act
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
      await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.success).toHaveBeenCalledWith("Category is deleted");
      expect(axios.get.mock.calls.length).toBeGreaterThan(callsBefore);
    });

    test("should show error toast when API returns success: false on delete", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.delete.mockResolvedValueOnce({
        data: { success: false, message: "Delete failed" },
      });

      // Act
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
      await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Delete failed")
    });

    test("should show error toast when DELETE throws a network error", async () => {
      // Arrange
      await renderWithMockCategories();
      axios.delete.mockRejectedValueOnce(new Error("Network error"));
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      // Act
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
      await waitFor(() => expect(axios.delete).toHaveBeenCalledTimes(1));

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith("Something went wrong")
    });
  });
});
