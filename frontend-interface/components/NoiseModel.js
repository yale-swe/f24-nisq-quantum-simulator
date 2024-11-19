import React, { useRef } from 'react';
import * as math from 'mathjs';

// Exported utility functions remain the same

export default function NoiseModel() {
    const fileContentRef = useRef('');
    const modelMatrixRef = useRef(null);
    const statusRef = useRef('');

    const setStatus = (message) => {
        statusRef.current = message;
        document.getElementById('status').textContent = message; // Update DOM directly
    };

    const setFileContent = (content) => {
        fileContentRef.current = content;
        document.getElementById('fileContent').textContent = content; // Update DOM directly
    };

    const validateFileType = (file) => {
        return file.type === 'text/plain';
    };

    const readBlob = () => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];

        if (!file) {
            setStatus('No file selected!');
            return;
        }

        if (!validateFileType(file)) {
            setStatus('Invalid File Format (.txt required)');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const fileData = e.target.result;
            setFileContent(fileData);

            const result = processNoiseModel(fileData);
            if (result) {
                setStatus('Noise Model Read Successfully');
                modelMatrixRef.current = result;

                // Save the model
                try {
                    await saveModel(result);
                } catch (error) {
                    console.error('Error posting matrix data:', error);
                    setStatus('Error posting matrix data');
                }
            } else {
                setStatus('Error processing noise model');
            }
        };
        reader.onerror = () => {
            setStatus('Error reading file!');
        };
        reader.readAsText(file);
    };

    const saveModel = async (matrix) => {
        console.log("Posting Matrix Data:", matrix);

        try {
            const response = await fetch('http://localhost:3000/api/saveOutputs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ outputs: matrix }),
            });

            const data = await response.json();
            if (response.ok) {
                console.log(data.message);
                setStatus(data.message);
            } else {
                console.error(data.message);
                setStatus('Failed to save outputs');
            }
        } catch (error) {
            console.error('Error posting matrix data:', error);
            setStatus('Error posting matrix data');
        }
    };

    return (
        <div data-testid="noise-model" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            textAlign: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '10px 15px',
                borderRadius: '5px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                border: '1px solid #ddd',
                display: 'inline-block',
                textAlign: 'center',
                marginBottom: '10px'
            }}>
                <label htmlFor="fileInput" style={{
                    display: 'inline-block',
                    padding: '8px 12px',
                    fontSize: '14px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    marginBottom: '10px'
                }}>
                    Choose File
                </label>
                <input
                    type="file"
                    id="fileInput"
                    style={{
                        display: 'none'
                    }}
                />
                <button
                    onClick={readBlob}
                    style={{
                        padding: '5px 10px',
                        fontSize: '14px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Load Noise Model
                </button>
            </div>
            <p id="status"></p>
            <pre id="fileContent"></pre>
        </div>
    );
}
