import React from 'react';
import { render, screen, fireEvent, act} from '@testing-library/react';
import '@testing-library/jest-dom';
import NoiseModel, { 
	validateNoiseModelSyntax, 
	validateNoiseModelLinAlg,
	processNoiseModel 
} from '../NoiseModel';
import fetchMock from 'jest-fetch-mock';


describe('NoiseModel Component', () => {
    beforeEach(() => {
        fetch.resetMocks();
        jest.clearAllMocks();
    });

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

	// Modified validation tests
	it('should validate JSON syntax for noise model', () => {
		expect(validateNoiseModelSyntax('invalid json')).toBe(false);
		// Wrap matrix in an additional array since we expect array of matrices
		expect(validateNoiseModelSyntax(JSON.stringify([[[1, 0], [0, 1]]]))).toBe(true);
		expect(validateNoiseModelSyntax(JSON.stringify([[[1, 'a'], [0, 1]]]))).toBe(false);
	});

	it('should validate linear algebra noise model', () => {
		const matrices = [
			[[1, 0], [0, 1]]  // Single matrix is sufficient for identity
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
        const setErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        
        await act(async () => {
            render(<NoiseModel />);
        });
        
        const loadButton = screen.getByText(/Load Noise Model/i);
        
        await act(async () => {
            fireEvent.click(loadButton);
        });
        
        expect(setErrorSpy).toHaveBeenCalledWith('Error in Noise Model Syntax');
        setErrorSpy.mockRestore();
    });

    it('should call saveModel on modelMatrix update', async () => {
        fetch.mockResponseOnce(JSON.stringify({ message: 'Matrix saved' }));
        
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

        expect(await screen.findByText('Matrix saved')).toBeInTheDocument();
    });
});