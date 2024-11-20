import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NoiseModel from '../NoiseModel'; // Adjust the path as needed
import { act } from 'react';

describe('NoiseModel Component', () => {
 

    it('should validate JSON syntax for noise model', () => {
        expect(() => {
            const { validateNoiseModelSyntax } = require('../NoiseModel');
            expect(validateNoiseModelSyntax('invalid json')).toBe(false);
            expect(validateNoiseModelSyntax(JSON.stringify([[[1, 0], [0, 1]]]))).toBe(true);
            expect(validateNoiseModelSyntax(JSON.stringify([[[1, 'a'], [0, 1]]]))).toBe(false);
        });
    });

});
