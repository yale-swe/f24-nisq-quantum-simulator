import React from 'react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { render, screen } from '@testing-library/react';
import DragAndDropGrid from '../DragAndDropGrid';

test('renders drag and drop grid', () => {
  render(<DragAndDropGrid />);
  const dragAndDropGridElement = screen.getByText(/drag and drop grid/i);
  expect(dragAndDropGridElement).toBeInTheDocument();
});

test('renders grid items', () => {
  render(<DragAndDropGrid />);
  const gridItemElements = screen.getAllByTestId('grid-item');
  expect(gridItemElements.length).toBeGreaterThan(0);
});

test('allows dragging of grid items', () => {
  render(<DragAndDropGrid />);
  const gridItemElement = screen.getByTestId('grid-item-1');
  expect(gridItemElement).toHaveAttribute('draggable', 'true');
});

test('allows dropping of grid items', () => {
  render(<DragAndDropGrid />);
  const dropZoneElement = screen.getByTestId('drop-zone');
  expect(dropZoneElement).toBeInTheDocument();
});
});