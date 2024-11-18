import React from 'react';
import { render, screen, fireEvent, act} from '@testing-library/react';
import '@testing-library/jest-dom';
import NoiseModel, { 
    validateNoiseModelSyntax, 
    validateNoiseModelLinAlg,
    processNoiseModel 
} from '../NoiseModel';
import fetchMock from 'jest-fetch-mock';

beforeEach(() => {
    fetchMock.resetMocks();  // Use this instead of global.fetch.mockClear()
    jest.clearAllMocks();
});

describe('NoiseModel Component', () => {
    it('should render the file input and load button', async () => {
        await act(async () => {
            render(<NoiseModel />);
        });
        expect(screen.getByText('Choose File')).toBeInTheDocument();
        expect(screen.getByText('Load Noise Model')).toBeInTheDocument();
    });

    it('should display status for invalid file format', async () => {
        await act(async () => {
            render(<NoiseModel />);
        });
        const fileInput = screen.getByLabelText(/Choose File/i);
        const loadButton = screen.getByText(/Load Noise Model/i);

        await act(async () => {
            Object.defineProperty(fileInput, 'files', {
                value: [new File(['file content'], 'noise.csv', { type: 'text/csv' })],
            });
            fireEvent.click(loadButton);
        });

        expect(screen.getByText('Invalid File Format (.txt required)')).toBeInTheDocument();
    });

    it('should display status for no file selected', () => {
        render(<NoiseModel />);
        const loadButton = screen.getByText(/Load Noise Model/i);
        fireEvent.click(loadButton);
        expect(screen.getByText('No file selected!')).toBeInTheDocument();
    });

    it('should validate JSON syntax for noise model', () => {
        expect(validateNoiseModelSyntax('invalid json')).toBe(false);
        expect(validateNoiseModelSyntax(JSON.stringify([[[1, 0], [0, 1]]]))).toBe(true);
        expect(validateNoiseModelSyntax(JSON.stringify([[[1, 'a'], [0, 1]]]))).toBe(false);
    });

    it('should validate linear algebra noise model', () => {
        const matrices = [
            [[1, 0], [0, 1]]
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

    it('should handle errors in the noise model syntax', async () => {
	    const consoleSpy = jest.spyOn(console, 'error');
	    
	    render(<NoiseModel />);
	    const loadButton = screen.getByText(/Load Noise Model/i);
	    const fileInput = screen.getByLabelText(/Choose File/i);

	    await act(async () => {
	        Object.defineProperty(fileInput, 'files', {
	            value: [new File(['invalid json'], 'noise.txt', {
	                type: 'text/plain',
	            })],
	        });
	        fireEvent.click(loadButton);
	    });
	    
	    expect(screen.getByText('Invalid Noise Model Syntax')).toBeInTheDocument();
	    consoleSpy.mockRestore();
	});

    it('should call saveModel on modelMatrix update', async () => {
	    // Setup fetch mock for this specific test
	    fetchMock.mockResponseOnce(JSON.stringify({ message: 'Matrix saved' }));
	    
	    await act(async () => {
	        render(<NoiseModel />);
	    });

	    const loadButton = screen.getByText(/Load Noise Model/i);
	    const fileInput = screen.getByLabelText(/Choose File/i);
	    
	    await act(async () => {
	        Object.defineProperty(fileInput, 'files', {
	            value: [new File([JSON.stringify([[[1, 0], [0, 1]]])], 'noise.txt', {
	                type: 'text/plain',
	            })],
	        });
	        fireEvent.click(loadButton);
	    });

	    // Wait for the status update
	    await screen.findByText(/Matrix saved/i);
	});
});