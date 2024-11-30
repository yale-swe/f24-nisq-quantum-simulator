import React, { useState } from 'react';

export default function NoiseModel() {
    // State to store the content of the uploaded file
    const [fileContent, setFileContent] = useState('');
    // State to store the validated noise model matrices
    const [modelMatrix, setModelMatrix] = useState(null);
    // State to track status messages for user feedback
    const [status, setStatus] = useState('');

    // Function to update the status message
    const updateStatus = (message, isError = false) => {
        setStatus({ message, isError }); // Set the status with message and error flag
    };

    // Function to read and process the file uploaded by the user
    const readBlob = async () => {
        const fileInput = document.getElementById('fileInput'); // Access the file input element
        const file = fileInput?.files?.[0]; // Get the first file in the file input

        // Handle case when no file is selected
        if (!file) {
            return updateStatus('No file selected!', true);
        }

        // Validate the file type (only text files are accepted)
        if (!validateFileType(file)) {
            return updateStatus('Invalid File Format (.txt required)', true);
        }

        try {
            // Read the file content as a text string
            const fileData = await file.text();
            setFileContent(fileData); // Save the file content in state

            // Process the file content to validate and extract noise model matrices
            const result = processNoiseModel(fileData);

            if (result) {
                setModelMatrix(result); // Save the processed model matrix
                updateStatus('Noise model is valid.', false); // Success message
                await saveModel(result); // Save the model matrix via an API call
            } else {
                updateStatus('Error processing noise model.', true); // Error message if processing fails
            }
        } catch (error) {
            updateStatus('Error reading file!', true); // Error message if file reading fails
        }
    };

    // Function to save the noise model matrix to the server
    const saveModel = async (matrix) => {
        try {
            const response = await fetch('http://localhost:3000/api/saveOutputs', {
                method: 'POST', // HTTP POST method
                headers: {
                    'Content-Type': 'application/json', // JSON content type
                },
                body: JSON.stringify({ outputs: matrix }), // Send the matrix data in the request body
            });

            const data = await response.json(); // Parse the JSON response

            if (response.ok) {
                updateStatus(data.message, false); // Display success message
            } else {
                updateStatus('Failed to save outputs.', true); // Display failure message
            }
        } catch {
            updateStatus('Error posting matrix data.', true); // Display error if POST fails
        }
    };

    return (
        <div data-testid="noise-model" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            {/* File input for selecting a noise model file */}
            <label htmlFor="fileInput" style={{ marginRight: '80px', fontSize: '20px' }}>Upload Existing Noise Model</label>
            <input type="file" id="fileInput" style={{ fontSize: '16px' }} />
            <button onClick={readBlob} style={{ fontSize: '16px' }}>Load Noise Model</button>

            {/* Display status messages */}
            {status && <p>{status.message}</p>}

            {/* Display the content of the uploaded file */}
            {fileContent && <pre>{fileContent}</pre>}
        </div>
    );
}

import * as math from 'mathjs';

// Function to validate the file type (only text files are accepted)
export const validateFileType = (file) => {
    return file?.type === 'text/plain';
};

// Function to validate the syntax of the noise model file data
export const validateNoiseModelSyntax = (fileData) => {
    if (typeof fileData !== 'string') {
        return { isValid: false, matrices: null }; // Input must be a string
    }

    try {
        const matrices = JSON.parse(fileData); // Parse the JSON string

        if (!Array.isArray(matrices)) {
            return { isValid: false, matrices: null }; // Expect an array of matrices
        }

        for (let matrix of matrices) {
            // Validate matrix structure
            if (!Array.isArray(matrix) || matrix.length === 0) {
                return { isValid: false, matrices: null };
            }

            const rowLength = matrix[0].length;

            for (let row of matrix) {
                // Check if all rows have the same length
                if (!Array.isArray(row) || row.length !== rowLength) {
                        return { isValid: false, matrices: null };
                }

                // Check if all elements in the row are numbers
                for (let element of row) {
                    if (typeof element !== 'number') {
                        return { isValid: false, matrices: null };
                    }
                }
            }

            // Check if the matrix is square
            if (matrix.length !== rowLength) {
                return { isValid: false, matrices: null };
            }
        }

        return { isValid: true, matrices }; // Syntax is valid
    } catch {
        return { isValid: false, matrices: null }; // Return invalid if JSON parsing fails
    }
};

// Function to load matrices using math.js
export const loadMatrix = (noiseModelString) => {
    try {
        const parsedMatrices = JSON.parse(noiseModelString); // Parse JSON string
        return parsedMatrices.map((matrix) => math.matrix(matrix)); // Convert each matrix to math.js format
    } catch {
        console.error("Failed to load matrices.");
        return []; // Return empty array on failure
    }
};

// Function to validate the linear algebra properties of the noise model
export const validateNoiseModelLinAlg = (matrices) => {
    if (matrices.length === 0) {
        console.error("No matrices provided for validation.");
        return false; // No matrices to validate
    }

    const dimension = matrices[0].size()[0]; // Get the dimension of the matrices

    for (let matrix of matrices) {
        // Check if each matrix is square and matches the expected dimension
        if (
            matrix.size().length !== 2 ||
            matrix.size()[0] !== matrix.size()[1] ||
            matrix.size()[0] !== dimension
        ) {
            console.error("Matrices are not square or dimensions do not match.");
            return false;
        }
    }

    const identity = math.identity(dimension); // Create an identity matrix
    let sum = math.zeros(dimension, dimension); // Initialize a zero matrix for summation

    matrices.forEach((matrix) => {
        const conjugateTranspose = math.conj(math.transpose(matrix)); // Compute conjugate transpose
        const product = math.multiply(matrix, conjugateTranspose); // Compute E_i * E_i^†
        sum = math.add(sum, product); // Add to the summation
    });

    // Check if the summation equals the identity matrix
    if (!math.deepEqual(sum, identity)) {
        console.error("The sum of E_i * E_i^† does not equal the identity matrix.");
        return false;
    }

    return true; // Valid linear algebra properties
};

// Function to process the noise model file data
export const processNoiseModel = (fileData) => {
    const syntaxCheck = validateNoiseModelSyntax(fileData); // Check file syntax

    if (!syntaxCheck.isValid) {
        console.error("Error in Noise Model Syntax");
        return null;
    }

    const loadedMatrices = loadMatrix(fileData); // Load matrices

    if (loadedMatrices.length === 0) {
        console.error("Failed to load matrices.");
        return null;
    }

    const isValidLinAlg = validateNoiseModelLinAlg(loadedMatrices); // Validate linear algebra

    if (!isValidLinAlg) {
        console.error("Linear Algebra Error in Noise Model.");
        return null;
    }

    return loadedMatrices; // Return validated matrices
};
