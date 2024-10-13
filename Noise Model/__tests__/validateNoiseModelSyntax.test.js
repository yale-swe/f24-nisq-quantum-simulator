
describe('validateNoiseModelSyntax', () => {
    const validateNoiseModelSyntax = require('../utils/validateNoiseModelSyntax');

    // Test 1: Valid input - string containing valid JSON with matrices
    it('should return true for valid string containing list of matrices', () => {
        const validData = JSON.stringify([
            [[1, 0], [0, 1]],
            [[0, 0], [0, 0]]
        ]);  // This is a valid 2x2 matrix array

        expect(validateNoiseModelSyntax(validData)).toBe(true);
    });

    // Test 2: Invalid input - not a string
    it('should return false for non-string input', () => {
        const invalidData = [[1, 2], [3, 4]];  // This is not a string

        expect(validateNoiseModelSyntax(invalidData)).toBe(false);
    });

    // Test 3: Invalid JSON string
    it('should return false for invalid JSON string', () => {
        const invalidData = "[[1, 2], [3, 4]";  // Missing closing bracket

        expect(validateNoiseModelSyntax(invalidData)).toBe(false);
    });

    // Test 4: Valid string, but not an array of matrices
    it('should return false for valid JSON string but not an array', () => {
        const invalidData = JSON.stringify({ matrix: [[1, 0], [0, 1]] });  // Object, not array

        expect(validateNoiseModelSyntax(invalidData)).toBe(false);
    });

    // Test 5: Valid JSON but inner arrays are malformed
    it('should return false for non-2D array', () => {
        const invalidData = JSON.stringify([
            [1, 0, 1],  // This is a 1D array, not a 2D array
            [0, 1, 0]
        ]);

        expect(validateNoiseModelSyntax(invalidData)).toBe(false);
    });

    // Test 6: Matrices contain non-number elements
    it('should return false for matrices containing non-number elements', () => {
        const invalidData = JSON.stringify([
            [[1, 'a'], [0, 1]],  // Contains a string 'a' instead of a number
            [[0, 0], [0, 0]]
        ]);

        expect(validateNoiseModelSyntax(invalidData)).toBe(false);
    });

    // Test 7: Empty string
    it('should return false for empty string', () => {
        const invalidData = "";

        expect(validateNoiseModelSyntax(invalidData)).toBe(false);
    });

    // Test 8: Valid input with different dimensions
    it('should return true for matrices with different dimensions', () => {
        const validData = JSON.stringify([
            [[1, 2, 3], [4, 5, 6]],  // 2x3 matrix
            [[1, 0], [0, 1]]  // 2x2 matrix
        ]);

        expect(validateNoiseModelSyntax(validData)).toBe(true);
    });

});
