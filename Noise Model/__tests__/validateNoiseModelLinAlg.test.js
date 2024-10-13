const math = require('mathjs');

describe('Linear Algebra Validation for Noise Model', () => {
    const validateNoiseModelLinAlg = require('../utils/validateNoiseModelLinAlg')
    it('should return true for valid matrices', () => {
        const E1 = math.matrix([[1, 0], [0, 0]]);
        const E2 = math.matrix([[0, 0], [0, 1]]);

        expect(validateNoiseModelLinAlg([E1, E2])).toBe(true);
    });

    it('should return false for invalid matrices', () => {
        const E1 = math.matrix([[1, 0], [0, 0]]);
        const E2 = math.matrix([[0, 0.5], [0, 1]]); // Not fitting the identity matrix criteria

        expect(validateNoiseModelLinAlg([E1, E2])).toBe(false);
    });
});