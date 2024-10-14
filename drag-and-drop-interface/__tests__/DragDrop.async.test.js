// __tests__/DragDrop.async.test.js
import { render, screen, waitFor } from "@testing-library/react";
import DragDropWithAsyncData from "../components/DragDropWithAsyncData"; // Assuming this version fetches data

describe("DragDrop Component - Async Behavior", () => {
  it("renders items after data is loaded", async () => {
    render(<DragDropWithAsyncData />);

    // Initially, there should be no items in the list
    expect(screen.queryByText("Loaded Item 1")).not.toBeInTheDocument();

    // Wait for the items to load and check that they are rendered
    await waitFor(() => {
      expect(screen.getByText("Loaded Item 1")).toBeInTheDocument();
      expect(screen.getByText("Loaded Item 2")).toBeInTheDocument();
    });
  });
});

