// Rayyan Ismail, A0259275R
import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "./useCategory";

jest.mock("axios");

describe("useCategory hook", () => {
  let consoleLogSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("should initialise with an empty categories array", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: { category: [] } });

    // Act
    const { result } = renderHook(() => useCategory());

    // Assert - initial value before the effect resolves
    expect(result.current).toEqual([]);

    // Wait for the async useEffect to settle so no state update leaks
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  it("should fetch and return categories on mount", async () => {
    // Arrange
    const mockCategories = [
      { _id: "1", name: "Electronics", slug: "electronics" },
      { _id: "2", name: "Clothing", slug: "clothing" },
    ];
    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    // Act
    const { result } = renderHook(() => useCategory());

    // Assert
    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("should log error when API call fails", async () => {
    // Arrange
    const mockError = new Error("Network error");
    axios.get.mockRejectedValueOnce(mockError);

    // Act
    renderHook(() => useCategory());

    // Assert
    await waitFor(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(mockError);
    });
  });

  it("should set categories to undefined when API response has no category field", async () => {
    // Arrange
    axios.get.mockResolvedValueOnce({ data: {} });

    // Act
    const { result } = renderHook(() => useCategory());

    // Assert
    await waitFor(() => {
      expect(result.current).toBeUndefined();
    });
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });
});
