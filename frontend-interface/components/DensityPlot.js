import React, { useEffect, useState } from 'react';

// Component to render a density plot from base64 image data
export default function DensityPlot({ plotImageData }) {
    // State to store the URL of the generated image
    const [imageUrl, setImageUrl] = useState('');

    // Effect to process the `plotImageData` when it changes
    useEffect(() => {
        if (plotImageData) {
            try {
                // Convert the base64 string to a binary string
                const binaryString = window.atob(plotImageData); // Decode base64
                const bytes = new Uint8Array(binaryString.length); // Create a byte array

                // Populate the byte array with character codes from the binary string
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Create a Blob from the byte array with a PNG MIME type
                const blob = new Blob([bytes], { type: 'image/png' });

                // Generate a temporary object URL for the Blob
                const url = URL.createObjectURL(blob);
                setImageUrl(url); // Save the URL in state for rendering

                // Cleanup the generated object URL when the component unmounts or `plotImageData` changes
                return () => URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error processing image data:", error); // Log any errors that occur
            }
        }
    }, [plotImageData]); // Effect depends on `plotImageData`

    // If no `plotImageData` is provided, render nothing
    if (!plotImageData) return null;

    return (
        <div style={{ margin: '20px', border: '1px solid #ccc' }}>
            {/* Render the image, using the processed URL or fallback to base64 */}
            <img
                src={imageUrl || `data:image/png;base64,${plotImageData}`} // Use processed URL or base64 directly
                alt="Density Matrix Plot" // Alt text for accessibility
                style={{
                    display: 'block', // Ensure the image is block-level for proper spacing
                    width: '100%', // Make the image responsive
                    maxWidth: '600px', // Limit maximum width
                    height: 'auto' // Maintain aspect ratio
                }}
                onLoad={() => console.log("Image loaded successfully")} // Log success message when image loads
                onError={(e) => console.error("Image load error:", e)} // Log an error if the image fails to load
            />
        </div>
    );
}
