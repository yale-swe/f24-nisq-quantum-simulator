// __tests__/DragDrop.interaction.test.js
import { render, fireEvent } from "@testing-library/react";
import DragDrop from "../components/DragDrop";

describe("DragDrop Component - Interactions", () => {
  it("handles drag-and-drop action", () => {
    const { container } = render(<DragDrop />);

    // Get the list of items before drag-and-drop
    const itemsBefore = container.querySelectorAll("li");

    // Simulate drag start on Item 1 and drop on Item 3's position
    fireEvent.dragStart(itemsBefore[0]);
    fireEvent.drop(itemsBefore[2]);

    // Get the list of items after drag-and-drop
    const itemsAfter = container.querySelectorAll("li");
    expect(itemsAfter[0].textContent).toBe("Item 2"); // Expect Item 2 to be at the top
  });
});
