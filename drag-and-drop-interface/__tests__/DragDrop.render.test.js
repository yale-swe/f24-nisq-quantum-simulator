// __tests__/DragDrop.render.test.js
import { render, screen } from "@testing-library/react";
import DragDrop from "../components/DragDrop";

describe("DragDrop Component - Rendering", () => {
  it("renders a list of items", () => {
    render(<DragDrop />);

    // Check if all list items are rendered
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3); // Since there are 3 items in initialItems
  });

  it("renders a specific item (Item 2) in the list", () => {
    render(<DragDrop />);
    
    // Check if Item 2 is rendered in the list
    const item = screen.getByText("Item 2");
    expect(item).toBeInTheDocument();
  });
});

