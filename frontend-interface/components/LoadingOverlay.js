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

const LoadingOverlay = ({ isLoading }) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        if (!isLoading) return;

        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isLoading]);

    if (!isLoading) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}
        >
            <div className="animate-pulse text-3xl font-bold mb-4 text-gray-800">
                Generating your circuit...
            </div>

            {/* Quantum Gate Loading Animation */}
            <div className="relative w-24 h-24">
                <div className="absolute w-full h-full border-8 border-gray-300 rounded-full" />
                <div className="absolute w-full h-full border-8 border-blue-500 rounded-full 
                            animate-spin [border-top-color:transparent] [border-left-color:transparent]" />
                <div className="absolute w-full h-full border-8 border-green-500 rounded-full opacity-40 
                            animate-spin [animation-duration:3s] [border-bottom-color:transparent] [border-right-color:transparent]" />
                <div className="absolute w-full h-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                </div>
            </div>

            {/* Loading Messages */}
            <div className="mt-6 text-gray-600 text-lg animate-pulse">
                {loadingMessages[messageIndex]}
            </div>
        </div>
    );
};

export default LoadingOverlay;