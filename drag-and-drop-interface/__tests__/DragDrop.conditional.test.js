// __tests__/DragDrop.conditional.test.js
import { render, screen } from "@testing-library/react";
import DragDrop from "../components/DragDrop";

describe("DragDrop Component - Conditional Rendering", () => {
  it("renders a message when the list is empty", () => {
    render(<DragDrop initialItems={[]} />);

    // Check if the "No items to display" message is rendered when the list is empty
    const message = screen.getByText("No items to display");
    expect(message).toBeInTheDocument();
  });
});
