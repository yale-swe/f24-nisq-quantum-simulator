import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import DensityPlot from '../DensityPlot';

// Clean up after each test
afterEach(cleanup);

describe('DensityPlot Component', () => {
    test('renders null when plotImageData is not provided', () => {
        const { container } = render(<DensityPlot />);
        expect(container.firstChild).toBeNull();
    });

    test('renders the image when valid plotImageData is provided', () => {
        const base64Image = btoa('mock image data');
        render(<DensityPlot plotImageData={base64Image} />);

        // Check if the img element is rendered with the mock URL
        const imageElement = screen.getByAltText('Density Matrix Plot');
        expect(imageElement).toBeInTheDocument();
        expect(imageElement.src).toBe('mock-url');
    });

    test('cleans up the URL object on unmount', () => {
        const base64Image = btoa('mock image data');
        const { unmount } = render(<DensityPlot plotImageData={base64Image} />);
        unmount();

        // Ensure revokeObjectURL is called during cleanup
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    });

    test('logs error in console when image load fails', () => {
        const base64Image = btoa('mock image data');
        render(<DensityPlot plotImageData={base64Image} />);
        
        const imageElement = screen.getByAltText('Density Matrix Plot');

        // Mock console.error
        console.error = jest.fn();

        // Trigger onError
        imageElement.dispatchEvent(new Event('error'));
        
        expect(console.error).toHaveBeenCalledWith('Image load error:', expect.any(Event));
    });

    test('logs successful load in console', () => {
        const base64Image = btoa('mock image data');
        render(<DensityPlot plotImageData={base64Image} />);
        
        const imageElement = screen.getByAltText('Density Matrix Plot');

        // Mock console.log
        console.log = jest.fn();

        // Trigger onLoad
        imageElement.dispatchEvent(new Event('load'));

        expect(console.log).toHaveBeenCalledWith('Image loaded successfully');
    });

    test('catches and logs error when processing invalid base64 data', () => {
        const invalidBase64Image = 'invalidBase64Data';
        console.error = jest.fn();
        
        render(<DensityPlot plotImageData={invalidBase64Image} />);

        expect(console.error).toHaveBeenCalledWith('Error processing image data:', expect.any(Error));
    });
});
