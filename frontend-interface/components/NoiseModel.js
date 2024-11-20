import React, { useState, useEffect } from 'react';
import * as math from 'mathjs';

// Exported utility functions
export const validateNoiseModelLinAlg = (matrices) => {
    const dimension = matrices[0].length;
    const identity = math.identity(dimension);
    let sum = math.zeros(dimension, dimension);

    matrices.forEach(matrix => {
        const conjugateTranspose = math.conj(math.transpose(matrix));
        const product = math.multiply(matrix, conjugateTranspose);
        sum = math.add(sum, product);
    });

    return math.deepEqual(sum, identity);
};

export const validateNoiseModelSyntax = (fileData) => {
    if (typeof fileData !== 'string') return false;

    try {
        const matrices = JSON.parse(fileData);
        if (!Array.isArray(matrices)) return false;

        for (let matrix of matrices) {
            if (!Array.isArray(matrix) || matrix.length === 0) return false;
            for (let row of matrix) {
                if (!Array.isArray(row) || row.length === 0) return false;
                if (!row.every(element => typeof element === 'number')) return false;
            }
        }
        return true;
    } catch (e) {
        return false;
    }
};

export const processNoiseModel = (fileData) => {
    if (!validateNoiseModelSyntax(fileData)) {
        console.error("Error in Noise Model Syntax");
        return null;
    }

    const parsedMatrix = JSON.parse(fileData);
    if (!validateNoiseModelLinAlg(parsedMatrix)) {
        console.error("Linear Algebra Error in Noise Model");
        return null;
    }

    return parsedMatrix;
};

export default function NoiseModel() {
    const [fileContent, setFileContent] = useState('');
    const [modelMatrix, setModelMatrix] = useState(null);
    const [status, setStatus] = useState('');

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
        reader.onload = (e) => {
            const fileData = e.target.result;
            setFileContent(fileData);
            
            const result = processNoiseModel(fileData);
            if (result) {
                setStatus('Noise Model Read Successfully');
                setModelMatrix(result);
            } else {
                setStatus('Error processing noise model');
            }
        };
        reader.onerror = () => {
            setStatus('Error reading file!');
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        if (modelMatrix) {
            saveModel(modelMatrix);
        }
    }, [modelMatrix]);

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
            <p>{status}</p>
            <pre>{fileContent}</pre>
        </div>
    );
}