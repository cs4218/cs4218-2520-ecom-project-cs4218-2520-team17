// SearchInput.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SearchInput from "./SearchInput";
import axios from "axios";
import { useSearch } from "../../context/search";

// mock axios
jest.mock("axios");

// mock your context hook
jest.mock("../../context/search", () => ({
  useSearch: jest.fn(),
}));

// mock react-router navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));


describe("SearchInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders input and button", () => {
    // Arrange
    const setValues = jest.fn();
    const values = { keyword: "", results: [] };

    useSearch.mockReturnValue([values, setValues]);

    // Act
    render(<SearchInput />);

    // Assert
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
  });

  test("typing updates keyword via setValues", async () => {
    // Arrange
    const setValues = jest.fn();
    const values = { keyword: "", results: [] };

    useSearch.mockReturnValue([values, setValues]);

    // Act
    render(<SearchInput />);

    const input = screen.getByRole("searchbox");
    fireEvent.change(input, {
      target: { value: "iphone" }
    });    

    // Assert
    expect(setValues).toHaveBeenLastCalledWith({
      ...values,
      keyword: "iphone",
    });
  });

  test("submit calls API, stores results, and navigates", async () => {
    const setValues = jest.fn();
    const values = { keyword: "iphone", results: [] };

    useSearch.mockReturnValue([values, setValues]);

    axios.get.mockResolvedValueOnce({ data: ["p1", "p2"] });

    render(<SearchInput />);

    await fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/iphone");
    });

    expect(setValues).toHaveBeenCalledWith({
      ...values,
      results: ["p1", "p2"],
    });

    expect(mockNavigate).toHaveBeenCalledWith("/search");
  });

  test("on API error: logs error and does not navigate", async () => {
    const setValues = jest.fn();
    const values = { keyword: "iphone", results: [] };

    useSearch.mockReturnValue([values, setValues]);

    const err = new Error("network fail");
    axios.get.mockRejectedValueOnce(err);

    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    render(<SearchInput />);

    await fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(logSpy).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});