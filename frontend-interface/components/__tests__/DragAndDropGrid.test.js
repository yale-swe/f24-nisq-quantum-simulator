import React from 'react';
import DragAndDropGrid from '../DragAndDropGrid';
import { render, screen, fireEvent } from '@testing-library/react';

test('renders drag and drop grid', () => {
  render(<DragAndDropGrid />);
  const titleElement = screen.getByText(/NISQ Quantum Simulator/i);
  expect(titleElement).toBeInTheDocument();
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

test('renders drag and drop grid', () => {
  render(<DragAndDropGrid />);
  const titleElement = screen.getByText(/NISQ Quantum Simulator/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders available gates', () => {
  render(<DragAndDropGrid />);
  const availableGatesTitle = screen.getByText(/Available Gates/i);
  expect(availableGatesTitle).toBeInTheDocument();
});

test('renders add wire button', () => {
  render(<DragAndDropGrid />);
  const addWireButton = screen.getByText(/Add Wire/i);
  expect(addWireButton).toBeInTheDocument();
});

test('renders quantum circuit title', () => {
  render(<DragAndDropGrid />);
  const quantumCircuitTitle = screen.getByText(/Quantum Circuit/i);
  expect(quantumCircuitTitle).toBeInTheDocument();
});

test('renders generate results button', () => {
  render(<DragAndDropGrid />);
  const generateResultsButton = screen.getByText(/Generate Results/i);
  expect(generateResultsButton).toBeInTheDocument();
});

test('allows adding a wire', () => {
  render(<DragAndDropGrid />);
  const addWireButton = screen.getByText(/Add Wire/i);
  fireEvent.click(addWireButton);
  const wires = screen.getAllByTestId('wire');
  expect(wires.length).toBeGreaterThan(2); // Initial wires + 1
});

test('allows removing a wire', () => {
  render(<DragAndDropGrid />);
  const removeWireButton = screen.getByText(/×/i);
  fireEvent.click(removeWireButton);
  const wires = screen.getAllByTestId('wire');
  expect(wires.length).toBeLessThan(2); // Initial wires - 1
});

test('allows adding a layer', () => {
  render(<DragAndDropGrid />);
  const addLayerButton = screen.getByText(/→/i);
  fireEvent.click(addLayerButton);
  const layers = screen.getAllByTestId('layer');
  expect(layers.length).toBeGreaterThan(10); // Initial layers + 1
});

test('allows removing a layer', () => {
  render(<DragAndDropGrid />);
  const removeLayerButton = screen.getByText(/←/i);
  fireEvent.click(removeLayerButton);
  const layers = screen.getAllByTestId('layer');
  expect(layers.length).toBeLessThan(10); // Initial layers - 1
});

test('shows warning when trying to remove a layer with gates', () => {
  render(<DragAndDropGrid />);
  const removeLayerButton = screen.getByText(/←/i);
  fireEvent.click(removeLayerButton);
  const warningMessage = screen.getByText(/Cannot remove layer containing gates/i);
  expect(warningMessage).toBeInTheDocument();
});
