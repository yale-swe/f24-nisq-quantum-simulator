import * as math from 'mathjs';
import {
    validateFileType,
    validateNoiseModelSyntax,
    loadMatrix,
    validateNoiseModelLinAlg,
} from '../NoiseModel'; // Ensure these functions are exported from NoiseModel.js

jest.mock('mathjs', () => ({
    matrix: jest.fn((data) => ({
        data, // Store the raw data
        size: jest.fn(() => [data.length, data[0].length]), // Return dimensions
    })),
    identity: jest.fn((size) =>
        Array.from({ length: size }, (_, i) =>
            Array.from({ length: size }, (_, j) => (i === j ? 1 : 0))
        )
    ),
    zeros: jest.fn((rows, cols) =>
        Array.from({ length: rows }, () =>
            Array.from({ length: cols }, () => 0)
        )
    ),
    deepEqual: jest.fn((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    add: jest.fn((a, b) =>
        a.map((row, i) => row.map((val, j) => val + b[i][j]))
    ),
    multiply: jest.fn((a, b) => {
        const aData = a.data || a; // Handle mock objects or raw arrays
        const bData = b.data || b;
        return aData.map((row, i) =>
            bData[0].map((_, j) =>
                row.reduce((sum, val, k) => sum + val * bData[k][j], 0)
            )
        );
    }),
    transpose: jest.fn((matrix) => {
        const data = matrix.data || matrix; // Handle mock objects or raw arrays
        return data[0].map((_, colIndex) => data.map((row) => row[colIndex]));
    }),
    conj: jest.fn((matrix) => ({
        data: matrix.data || matrix, // For simplicity, return the same data
    })),
}));


beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    console.error.mockRestore();
});


describe('NoiseModel Logic Tests', () => {
    describe('validateFileType', () => {
        test('accepts valid text file type', () => {
            const file = { type: 'text/plain' };
            expect(validateFileType(file)).toBe(true);
        });

        test('rejects invalid file type', () => {
            const file = { type: 'application/json' };
            expect(validateFileType(file)).toBe(false);
        });

        test('rejects undefined or null file', () => {
            expect(validateFileType(null)).toBe(false);
            expect(validateFileType(undefined)).toBe(false);
        });
    });

    describe('validateNoiseModelSyntax', () => {
        test('validates correct JSON string with square matrices', () => {
            const validJson = JSON.stringify([
                [[1, 0], [0, 1]],
                [[0, 1], [1, 0]],
            ]);
            const result = validateNoiseModelSyntax(validJson);
            expect(result.isValid).toBe(true);
            expect(result.matrices).toEqual([
                [[1, 0], [0, 1]],
                [[0, 1], [1, 0]],
            ]);
        });

        test('rejects non-square matrices', () => {
            const invalidJson = JSON.stringify([
                [[1, 0], [0, 1, 2]],
            ]);
            const result = validateNoiseModelSyntax(invalidJson);
            expect(result.isValid).toBe(false);
        });

        test('rejects invalid JSON', () => {
            const invalidJson = 'invalid json string';
            const result = validateNoiseModelSyntax(invalidJson);
            expect(result.isValid).toBe(false);
        });

        test('rejects non-array top-level JSON', () => {
            const invalidJson = JSON.stringify({ key: 'value' });
            const result = validateNoiseModelSyntax(invalidJson);
            expect(result.isValid).toBe(false);
        });
    });

    describe('loadMatrix', () => {
        test('parses valid JSON matrices into math.js matrices', () => {
            const validJson = JSON.stringify([
                [[1, 0], [0, 1]],
                [[0, 1], [1, 0]],
            ]);
            const matrices = loadMatrix(validJson);
            expect(matrices.length).toBe(2);
            expect(math.matrix).toHaveBeenCalledTimes(2);
        });

        test('returns an empty array for invalid JSON', () => {
            const invalidJson = 'invalid json';
            const matrices = loadMatrix(invalidJson);
            expect(matrices).toEqual([]);
        });
    });

    describe('validateNoiseModelLinAlg', () => {
        test('validates correct matrices where sum equals identity', () => {
            const matrices = [
                math.matrix([[1, 0], [0, 1]]),
                math.matrix([[0, 1], [1, 0]]),
            ];
            math.deepEqual.mockReturnValueOnce(true); // Mock identity check
            const result = validateNoiseModelLinAlg(matrices);
            expect(result).toBe(true);
            expect(math.deepEqual).toHaveBeenCalled();
        });

        test('rejects matrices that do not sum to identity', () => {
            const matrices = [
                math.matrix([[2, 0], [0, 2]]),
                math.matrix([[1, 1], [1, 1]]),
            ];
            math.deepEqual.mockReturnValueOnce(false); // Mock identity check
            const result = validateNoiseModelLinAlg(matrices);
            expect(result).toBe(false);
        });

        test('rejects non-square matrices', () => {
            const matrices = [
                math.matrix([[1, 0], [0, 1]]),
                math.matrix([[1, 1, 1], [1, 1, 1]]),
            ];
            const result = validateNoiseModelLinAlg(matrices);
            expect(result).toBe(false);
        });

        test('rejects matrices with inconsistent dimensions', () => {
            const matrices = [
                math.matrix([[1, 0], [0, 1]]),
                math.matrix([[1, 0, 0], [0, 1, 0], [0, 0, 1]]),
            ];
            const result = validateNoiseModelLinAlg(matrices);
            expect(result).toBe(false);
        });

        test('rejects empty matrix list', () => {
            const result = validateNoiseModelLinAlg([]);
            expect(result).toBe(false);
        });
    });
});
