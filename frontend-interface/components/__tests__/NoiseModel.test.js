// NoiseModel.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import NoiseModel, {
    validateNoiseModelSyntax,
    validateNoiseModelLinAlg,
    processNoiseModel
} from '../NoiseModel';
import fetchMock from 'jest-fetch-mock';
import { configure } from '@testing-library/react';

configure({ testIdAttribute: 'data-testid' });

jest.mock('react', () => ({
    ...jest.requireActual('react'),
    useState: jest.fn()
}));

beforeEach(() => {
    fetchMock.resetMocks();
    jest.clearAllMocks();
    jest.spyOn(React, 'useState').mockImplementation(init => [init, jest.fn()]);
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
        const setStatus = jest.fn();
        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['', jest.fn()]) // fileContent
            .mockImplementationOnce(() => [null, jest.fn()]) // modelMatrix
            .mockImplementationOnce(() => ['', setStatus]); // status

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

    it('should display status for no file selected', async () => {
        const setStatus = jest.fn();
        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['', jest.fn()]) // fileContent
            .mockImplementationOnce(() => [null, jest.fn()]) // modelMatrix
            .mockImplementationOnce(() => ['', setStatus]); // status

        await act(async () => {
            render(<NoiseModel />);
        });

        const loadButton = screen.getByText(/Load Noise Model/i);

        await act(async () => {
            fireEvent.click(loadButton);
        });

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
        const setModelMatrix = jest.fn();
        const setStatus = jest.fn();

        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['', jest.fn()]) // fileContent
            .mockImplementationOnce(() => [null, setModelMatrix]) // modelMatrix
            .mockImplementationOnce(() => ['', setStatus]); // status

        await act(async () => {
            render(<NoiseModel />);
        });

        const loadButton = screen.getByText(/Load Noise Model/i);
        const fileInput = screen.getByLabelText(/Choose File/i);
        const file = new File([JSON.stringify([[[1, 0], [0, 1]]])], 'noise.txt', {
            type: 'text/plain',
        });

        await act(async () => {
            Object.defineProperty(fileInput, 'files', {
                value: [file],
            });
            fireEvent.click(loadButton);
        });

        await screen.findByText('Noise Model Read Successfully');
    });

    it('should handle errors in the noise model syntax', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        const setStatus = jest.fn();

        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['', jest.fn()]) // fileContent
            .mockImplementationOnce(() => [null, jest.fn()]) // modelMatrix
            .mockImplementationOnce(() => ['', setStatus]); // status

        await act(async () => {
            render(<NoiseModel />);
        });

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

        expect(screen.getByText('Error in Noise Model Syntax')).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    it('should call saveModel on modelMatrix update', async () => {
        fetchMock.mockResponseOnce(JSON.stringify({ message: 'Matrix saved' }), {
            status: 200,
            headers: { 'content-type': 'application/json' }
        });

        const setModelMatrix = jest.fn();
        const setStatus = jest.fn();

        jest.spyOn(React, 'useState').mockImplementationOnce(() => ['', jest.fn()]) // fileContent
            .mockImplementationOnce(() => [null, setModelMatrix]) // modelMatrix
            .mockImplementationOnce(() => ['', setStatus]); // status

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

        await screen.findByText(/Matrix saved/i);
    });
});