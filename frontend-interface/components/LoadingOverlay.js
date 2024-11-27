import React, { useState, useEffect } from 'react';

const loadingMessages = [
    "Collapsing those wavefunctions...",
    "Entangling qubits...",
    "Applying quantum gates...",
    "Computing density matrices...",
    "Fighting decoherence...",
    "Measuring superpositions...",
    "Calculating phase shifts...",
    "Optimizing your VQE...",
    "Adding depolarizing noise...",
    "Generating arXiv citations..."
];

// Functional component for displaying a loading overlay
const LoadingOverlay = ({ isLoading }) => {
    // State to manage the index of the current loading message
    const [messageIndex, setMessageIndex] = useState(0);

    // Effect to cycle through loading messages when `isLoading` is true
    useEffect(() => {
        if (!isLoading) return; // Exit early if not in the loading state

        // Set up an interval to change the loading message every 2 seconds
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length); // Loop through messages
        }, 2000);

        // Cleanup function to clear the interval when component unmounts or `isLoading` changes
        return () => clearInterval(interval);
    }, [isLoading]);

    // If not loading, render nothing
    if (!isLoading) return null;

    // Render the loading overlay
    return (
        <div
            style={{
                position: 'fixed', // Fixed positioning to cover the whole screen
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white background
                display: 'flex', // Flexbox for centering content
                flexDirection: 'column', // Stack items vertically
                alignItems: 'center', // Center items horizontally
                justifyContent: 'center', // Center items vertically
                zIndex: 1000 // Ensure it appears above other elements
            }}
        >
            {/* Main title for loading */}
            <div className="animate-pulse text-3xl font-bold mb-4 text-gray-800">
                Generating your circuit...
            </div>

            {/* Quantum gate-inspired animated loading indicator */}
            <div className="relative w-24 h-24">
                {/* Static outer ring */}
                <div className="absolute w-full h-full border-8 border-gray-300 rounded-full" />
                {/* Fast spinning ring with a transparent top and left border */}
                <div className="absolute w-full h-full border-8 border-blue-500 rounded-full 
                            animate-spin [border-top-color:transparent] [border-left-color:transparent]" />
                {/* Slower, partially transparent spinning ring with a transparent bottom and right border */}
                <div className="absolute w-full h-full border-8 border-green-500 rounded-full opacity-40 
                            animate-spin [animation-duration:3s] [border-bottom-color:transparent] [border-right-color:transparent]" />
                {/* Pulsating center dot */}
                <div className="absolute w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                </div>
            </div>

            {/* Rotating loading messages */}
            <div className="mt-6 text-gray-600 text-lg animate-pulse">
                {loadingMessages[messageIndex]} {/* Display the current message */}
            </div>
        </div>
    );
};

export default LoadingOverlay; // Export the component for use in other parts of the application