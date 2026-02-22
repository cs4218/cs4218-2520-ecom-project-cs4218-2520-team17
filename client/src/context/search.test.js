import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

// A tiny test component to read + update the context
function TestConsumer() {
  const [state, setState] = useSearch();

  return (
    <div>
      <div data-testid="keyword">{state.keyword}</div>
      <div data-testid="results-count">{state.results.length}</div>

      <button
        type="button"
        onClick={() =>
          setState((prev) => ({
            ...prev,
            keyword: "iphone",
          }))
        }
      >
        Set Keyword
      </button>

      <button
        type="button"
        onClick={() =>
          setState((prev) => ({
            ...prev,
            results: [{ _id: "p1" }, { _id: "p2" }],
          }))
        }
      >
        Set Results
      </button>
    </div>
  );
}

describe("SearchContext / SearchProvider", () => {
  // Tan Shi Yu, A0251681E
  test("provides default values", () => {
    // Arrange & Act
    render(
      <SearchProvider>
        <TestConsumer />
      </SearchProvider>
    );

    // Assert
    expect(screen.getByTestId("keyword")).toHaveTextContent("");
    expect(screen.getByTestId("results-count")).toHaveTextContent("0");
  });

  test("allows updating keyword", () => {
    // Arrange & Act
    render(
      <SearchProvider>
        <TestConsumer />
      </SearchProvider>
    );

    // Act
    fireEvent.click(screen.getByRole("button", { name: /set keyword/i }));

    // Assert
    expect(screen.getByTestId("keyword")).toHaveTextContent("iphone");
  });

  // Tan Shi Yu, A0251681E
  test("allows updating results", () => {
    // Arrange & Act
    render(
      <SearchProvider>
        <TestConsumer />
      </SearchProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: /set results/i }));

    // Assert
    expect(screen.getByTestId("results-count")).toHaveTextContent("2");
  });
});