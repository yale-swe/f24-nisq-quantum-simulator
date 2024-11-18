import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NoiseModel, { 
    validateNoiseModelSyntax, 
    validateNoiseModelLinAlg,
    processNoiseModel 
} from '../NoiseModel';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('NoiseModel Component', () => {
    beforeEach(() => {
        fetch.resetMocks();
        jest.clearAllMocks();
    });

    // First 3 tests remain unchanged
    it('should render the file input and load button', () => {
        render(<NoiseModel />);
        expect(screen.getByText('Choose File')).toBeInTheDocument();
        expect(screen.getByText('Load Noise Model')).toBeInTheDocument();
    });

    it('should display status for invalid file format', () => {
        render(<NoiseModel />);
        const fileInput = screen.getByLabelText(/Choose File/i);
        const loadButton = screen.getByText(/Load Noise Model/i);

        Object.defineProperty(fileInput, 'files', {
            value: [new File(['file content'], 'noise.csv', { type: 'text/csv' })],
        });

        fireEvent.click(loadButton);
        expect(screen.getByText('Invalid File Format (.txt required)')).toBeInTheDocument();
    });

    it('should display status for no file selected', () => {
        render(<NoiseModel />);
        const loadButton = screen.getByText(/Load Noise Model/i);
        fireEvent.click(loadButton);
        expect(screen.getByText('No file selected!')).toBeInTheDocument();
    });

    // Modified validation tests
    it('should validate JSON syntax for noise model', () => {
        expect(validateNoiseModelSyntax('invalid json')).toBe(false);
        expect(validateNoiseModelSyntax(JSON.stringify([[1, 0], [0, 1]]))).toBe(true);
        expect(validateNoiseModelSyntax(JSON.stringify([[1, 'a'], [0, 1]]))).toBe(false);
    });

    it('should validate linear algebra noise model', () => {
        const matrices = [
            [[1, 0], [0, 1]],
            [[1, 0], [0, 1]],
        ];
        expect(validateNoiseModelLinAlg(matrices)).toBe(true);
    });

    it('should load matrix and update modelMatrix state', async () => {
        render(<NoiseModel />);
        const loadButton = screen.getByText(/Load Noise Model/i);
        const fileInput = screen.getByLabelText(/Choose File/i);
        const file = new File([JSON.stringify([[[1, 0], [0, 1]]])], 'noise.txt', {
            type: 'text/plain',
        });

        Object.defineProperty(fileInput, 'files', {
            value: [file],
        });

        fireEvent.click(loadButton);
        await screen.findByText('Noise Model Read Successfully');
    });

    it('should handle errors in the noise model syntax', () => {
        const setErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        render(<NoiseModel />);
        const fileInput = screen.getByLabelText(/Choose File/i);
        
        const file = new File(['invalid data'], 'test.txt', { type: 'text/plain' });
        Object.defineProperty(fileInput, 'files', { value: [file] });
        
        fireEvent.click(screen.getByText(/Load Noise Model/i));
        expect(setErrorSpy).toHaveBeenCalledWith('Error in Noise Model Syntax');
        setErrorSpy.mockRestore();
    });

    it('should call saveModel on modelMatrix update', async () => {
        fetch.mockResponseOnce(JSON.stringify({ message: 'Matrix saved' }));
        render(<NoiseModel />);

        const loadButton = screen.getByText(/Load Noise Model/i);
        const fileInput = screen.getByLabelText(/Choose File/i);
        const file = new File([JSON.stringify([[[1, 0], [0, 1]]])], 'noise.txt', {
            type: 'text/plain',
        });

        Object.defineProperty(fileInput, 'files', {
            value: [file],
        });

        fireEvent.click(loadButton);
        await screen.findByText('Matrix saved');
    });
});