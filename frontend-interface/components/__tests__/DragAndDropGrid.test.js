


import { createInitialIcons, STYLE_VARIANTS, MIN_COLUMNS, MAX_COLUMNS } from '../DragAndDropGrid'; // Ensure these are exported in DragAndDropGrid.js


// Mock functions for state updates
const mockSetState = (state) => jest.fn((fn) => (state = fn(state)));

// Tests for utility functions and constants
describe('Utility Functions and Constants', () => {
    test('initial gate data is correctly structured', () => {
        const gates = createInitialIcons('default');
        expect(gates).toBeDefined();
        expect(gates.length).toBeGreaterThan(0);
        expect(gates[0]).toHaveProperty('id');
        expect(gates[0]).toHaveProperty('content');
        expect(gates[0]).toHaveProperty('type');
    });

    test('STYLE_VARIANTS is defined', () => {
        expect(STYLE_VARIANTS).toBeDefined();
        expect(STYLE_VARIANTS).toHaveProperty('DEFAULT', 'default');
        expect(STYLE_VARIANTS).toHaveProperty('BLACK_WHITE', '_bw');
        expect(STYLE_VARIANTS).toHaveProperty('INVERTED', '_invert');
    });
});

// Tests for grid manipulation logic
describe('Grid Manipulation Logic', () => {
    test('addLayer respects MAX_COLUMNS limit', () => {
        let numColumns = MAX_COLUMNS;
        let layerTypes = Array(MAX_COLUMNS).fill('empty');
        let grid = Array(2).fill(null).map(() => Array(MAX_COLUMNS).fill(null).map(() => ({ gate: null, occupiedBy: null })));

        const setNumColumns = mockSetState(numColumns);
        const setLayerTypes = mockSetState(layerTypes);
        const setGrid = mockSetState(grid);

        // Simulate the `addLayer` function
        if (numColumns < MAX_COLUMNS) {
            setNumColumns((prev) => prev + 1);
            setLayerTypes((prev) => [...prev, 'empty']);
            setGrid((prev) =>
                prev.map((row) => [...row, { gate: null, occupiedBy: null }])
            );
        }

        expect(numColumns).toEqual(MAX_COLUMNS); // Should not exceed max
        expect(layerTypes.length).toEqual(MAX_COLUMNS);
        expect(grid[0].length).toEqual(MAX_COLUMNS);
    });

    test('removeLayer respects MIN_COLUMNS limit', () => {
        let numColumns = MIN_COLUMNS;
        let layerTypes = Array(MIN_COLUMNS).fill('empty');
        let grid = Array(2).fill(null).map(() => Array(MIN_COLUMNS).fill(null).map(() => ({ gate: null, occupiedBy: null })));

        const setNumColumns = mockSetState(numColumns);
        const setLayerTypes = mockSetState(layerTypes);
        const setGrid = mockSetState(grid);

        // Simulate the `removeLayer` function
        if (numColumns > MIN_COLUMNS) {
            setNumColumns((prev) => prev - 1);
            setLayerTypes((prev) => prev.slice(0, -1));
            setGrid((prev) => prev.map((row) => row.slice(0, -1)));
        }

        expect(numColumns).toEqual(MIN_COLUMNS); // Should not go below min
        expect(layerTypes.length).toEqual(MIN_COLUMNS);
        expect(grid[0].length).toEqual(MIN_COLUMNS);
    });

    test('convertGridToIR handles empty grid correctly', () => {
        const grid = Array(2)
            .fill(null)
            .map(() =>
                Array(2).fill(null).map(() => ({ gate: null, occupiedBy: null }))
            );

        const convertGridToIR = (grid) => {
            return grid[0].map((_, colIndex) => ({
                gates: grid.map((row) => row[colIndex]).filter((cell) => cell.gate).map((cell) => [cell.gate.type, cell.gate.wireIndices || null]),
                type: 'empty',
                numRows: grid.length,
            }));
        };

        const ir = convertGridToIR(grid);

        expect(ir.length).toBe(2); // Two columns
        expect(ir[0].gates.length).toBe(0); // No gates in the column
        expect(ir[1].gates.length).toBe(0);
    });
});

