// DensityPlot.test.js
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import DensityPlot from '../DensityPlot';
import { testEnvironment } from '@/jest.config';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

describe('DensityPlot Component', () => {
    // test('renders null when plotImageData is not provided', () => {
    //     const { container } = render(<DensityPlot />);
    //     expect(container.firstChild).toBeNull();
    // });

    // test('renders the image when valid plotImageData is provided', () => {
    //     const base64Image = btoa('mock image data');
    //     render(<DensityPlot plotImageData={base64Image} />);

    //     const imageElement = screen.getByAltText('Density Matrix Plot');
    //     expect(imageElement).toBeInTheDocument();
    //     expect(imageElement.src).toBe('mock-url');
    // });

    // test('cleans up the URL object on unmount', () => {
    //     const base64Image = btoa('mock image data');
    //     const { unmount } = render(<DensityPlot plotImageData={base64Image} />);
    //     unmount();

    //     expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    // });

    // test('logs error in console when image load fails', () => {
    //     const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    //     const base64Image = btoa('mock image data');
    //     render(<DensityPlot plotImageData={base64Image} />);

    //     const imageElement = screen.getByAltText('Density Matrix Plot');
    //     imageElement.dispatchEvent(new Event('error'));

    //     expect(console.error).toHaveBeenCalledWith('Image load error:', expect.any(Event));
    //     consoleSpy.mockRestore();
    // });

    // test('logs successful load in console', () => {
    //     const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    //     const base64Image = btoa('mock image data');
    //     render(<DensityPlot plotImageData={base64Image} />);

    //     const imageElement = screen.getByAltText('Density Matrix Plot');
    //     imageElement.dispatchEvent(new Event('load'));

    //     expect(console.log).toHaveBeenCalledWith('Image loaded successfully');
    //     consoleSpy.mockRestore();
    // });

    // test('catches and logs error when processing invalid base64 data', () => {
    //     const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    //     const invalidBase64Image = 'invalidBase64Data';

    //     render(<DensityPlot plotImageData={invalidBase64Image} />);

    //     expect(console.error).toHaveBeenCalledWith('Error processing image data:', expect.any(Error));
    //     consoleSpy.mockRestore();
    // });
});