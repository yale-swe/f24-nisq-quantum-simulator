import React, { useState } from 'react';


export default function NoiseModel() {
    const [fileContent, setFileContent] = useState('');
    const [modelMatrix, setModelMatrix] = useState(null);
    const [status, setStatus] = useState('');

    const updateStatus = (message, isError = false) => {
        setStatus({ message, isError });
    };

    const readBlob = async () => {
        const fileInput = document.getElementById('fileInput');
        const file = fileInput?.files?.[0];

        if (!file) {
            return updateStatus('No file selected!', true);
        }

        if (!validateFileType(file)) {
            return updateStatus('Invalid File Format (.txt required)', true);
        }

        try {
            const fileData = await file.text();
            setFileContent(fileData);

            const result = processNoiseModel(fileData);

            if (result) {
                setModelMatrix(result);
                updateStatus('Noise model is valid.', false);
                await saveModel(result);
            } else {
                updateStatus('Error processing noise model.', true);
            }
        } catch (error) {
            updateStatus('Error reading file!', true);
        }
    };

    const saveModel = async (matrix) => {
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
                updateStatus(data.message, false);
            } else {
                updateStatus('Failed to save outputs.', true);
            }
        } catch {
            updateStatus('Error posting matrix data.', true);
        }
    };

    return (
        <div data-testid="noise-model">
            <label htmlFor="fileInput">Choose File</label>
            <input type="file" id="fileInput" />
            <button onClick={readBlob}>Load Noise Model</button>
            {status && <p>{status.message}</p>}
            {fileContent && <pre>{fileContent}</pre>}
        </div>
    );
}

import * as math from 'mathjs';

// Function to validate the file type
export const validateFileType = (file) => {
    return file?.type === 'text/plain';
};

// Function to validate the syntax of the noise model file data
export const validateNoiseModelSyntax = (fileData) => {
    if (typeof fileData !== 'string') {
        return { isValid: false, matrices: null };
    }

    try {
        const matrices = JSON.parse(fileData);

        if (!Array.isArray(matrices)) {
            return { isValid: false, matrices: null };
        }

        for (let matrix of matrices) {
            if (!Array.isArray(matrix) || matrix.length === 0) {
                return { isValid: false, matrices: null };
            }

            const rowLength = matrix[0].length;

            for (let row of matrix) {
                if (!Array.isArray(row) || row.length !== rowLength) {
                    return { isValid: false, matrices: null };
                }

                for (let element of row) {
                    if (typeof element !== 'number') {
                        return { isValid: false, matrices: null };
                    }
                }
            }

            if (matrix.length !== rowLength) {
                return { isValid: false, matrices: null };
            }
        }

        return { isValid: true, matrices };
    } catch {
        return { isValid: false, matrices: null };
    }
};

// Function to load matrices using math.js
export const loadMatrix = (noiseModelString) => {
    try {
        const parsedMatrices = JSON.parse(noiseModelString);
        return parsedMatrices.map((matrix) => math.matrix(matrix));
    } catch {
        console.error("Failed to load matrices.");
        return [];
    }
};

// Function to validate the linear algebra of the noise model
export const validateNoiseModelLinAlg = (matrices) => {
    if (matrices.length === 0) {
        console.error("No matrices provided for validation.");
        return false;
    }

    const dimension = matrices[0].size()[0];

    for (let matrix of matrices) {
        if (
            matrix.size().length !== 2 ||
            matrix.size()[0] !== matrix.size()[1] ||
            matrix.size()[0] !== dimension
        ) {
            console.error("Matrices are not square or dimensions do not match.");
            return false;
        }
    }

    const identity = math.identity(dimension);
    let sum = math.zeros(dimension, dimension);

    matrices.forEach((matrix) => {
        const conjugateTranspose = math.conj(math.transpose(matrix));
        const product = math.multiply(matrix, conjugateTranspose);
        sum = math.add(sum, product);
    });

    if (!math.deepEqual(sum, identity)) {
        console.error("The sum of E_i * E_i^† does not equal the identity matrix.");
        return false;
    }

    return true;
};

// Function to process the noise model
export const processNoiseModel = (fileData) => {
    const syntaxCheck = validateNoiseModelSyntax(fileData);

    if (!syntaxCheck.isValid) {
        console.error("Error in Noise Model Syntax");
        return null;
    }

    const loadedMatrices = loadMatrix(fileData);

    if (loadedMatrices.length === 0) {
        console.error("Failed to load matrices.");
        return null;
    }

    const isValidLinAlg = validateNoiseModelLinAlg(loadedMatrices);

    if (!isValidLinAlg) {
        console.error("Linear Algebra Error in Noise Model.");
        return null;
    }

    return loadedMatrices;
};
