import React, { useEffect, useState } from 'react';

export default function DensityPlot({ plotImageData }) {
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (plotImageData) {
            try {
                // Convert base64 to blob
                const binaryString = window.atob(plotImageData);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/png' });
                const url = URL.createObjectURL(blob);
                setImageUrl(url);

                // Cleanup
                return () => URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Error processing image data:", error);
            }
        }
    }, [plotImageData]);

    if (!plotImageData) return null;

    return (
        <div style={{ margin: '20px', border: '1px solid #ccc' }}>
            <img
                src={imageUrl || `data:image/png;base64,${plotImageData}`}
                alt="Density Matrix Plot"
                style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '600px',
                    height: 'auto'
                }}
                onLoad={() => console.log("Image loaded successfully")}
                onError={(e) => console.error("Image load error:", e)}
            />
        </div>
    );
}