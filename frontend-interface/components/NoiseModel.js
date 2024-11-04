'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const math = require('mathjs'); // You can use Math.js for matrix operations

import { useState } from 'react';


export default function NoiseModel() {
    const validateFileType = (file) => {
        const validFileType = 'text/plain'; // MIME type for .txt files
        return file.type === validFileType;
    }

    const loadMatrix = (fileData) => {
        let data = {
            dimensions: [0, 0, 0],
            matrices: []
        }
        data.matrices = JSON.parse(fileData);
        data.dimensions[0] = matrices.length

    }


    const  validateNoiseModelLinAlg =(matrices)  => {
        // Get the dimension of the matrices to construct the identity matrix
        const dimension = matrices[0].size()[0]; // Assuming square matrices
        const identity = math.identity(dimension);

        // Sum up E_i * E_i^† for all matrices
        let sum = math.zeros(dimension, dimension); // Initialize zero matrix

        matrices.forEach(matrix => {
            const conjugateTranspose = math.conj(math.transpose(matrix)); // E_i^†
            const product = math.multiply(matrix, conjugateTranspose); // E_i * E_i^†
            sum = math.add(sum, product); // Add to sum
        });

        // Check if sum equals the identity matrix
        return math.deepEqual(sum, identity);
    }


    //ToDo: need to add a check for the dimensions of each matrix
    const validateNoiseModelSyntax = (fileData) =>  {
        // Check if fileData is a string
        if (typeof fileData !== 'string') {
            return false;
        }

        try {
            // Try parsing the string as JSON
            const matrices = JSON.parse(fileData);

            // Check if the parsed data is an array
            if (!Array.isArray(matrices)) {
                return false;
            }

            // Check each matrix in the array
            for (let matrix of matrices) {
                // Ensure that each matrix is a 2D array (array of arrays)
                if (!Array.isArray(matrix) || matrix.length == 0) {
                    return false;
                }

                // Check that each row has exactly 4 elements
                for (let row of matrix) {
                    if (!Array.isArray(row) || row.length == 0) {
                        return false;
                    }

                    // Ensure all elements in the row are numbers
                    for (let element of row) {
                        if (typeof element !== 'number') {
                            return false;
                        }
                    }
                }
            }

            // If all checks pass, return true
            return true;
        } catch (e) {
            // If parsing fails, the file data is not valid JSON
            return false;
        }
    }




    let noiseModelString = "";
    //function for flexible reading of files of any type
    const readBlob = () =>{
        const fileInput = document.getElementById('fileInput');
        const file = fileInput.files[0];
        const status = document.getElementById('status');
        const fileContent = document.getElementById('fileContent');

        if (file) {

            // Create a Blob from the selected file
            const blob = new Blob([file], { type: file.type });

            if (file.type != ".txt") {
                //in case we want to only except .npy files for noise models
                status.textContent = 'Invalid File Format (.txt required)';
            }


            else {
                // Use FileReader to read the Blob as text
                const reader = new FileReader();
                reader.onload = function (e) {
                    //file processing protocol: Store data, validate noise model, setNoiseModel 
                    const fileData = e.target.result;
                    validateNoiseModel(fileData);
                    status.textContent = 'Noise Model Read Succesfully';
                    processNoiseModel(fileData); // Pass the file data to setNoiseModel function
                };
                reader.onerror = function (e) {
                    status.textContent = 'Error reading file!';
                };

                // Read the Blob's contents as text
                reader.readAsText(blob);
            }
        } else {
            status.textContent = 'No file selected!';
        }
    }


    //stores noise model data in a string (for now) and displays it to the webpage. 
    const processNoiseModel = (fileData) => {
        noiseModelString = fileData;
        fileContent.textContent = fileData;
        console.log('Noise model string read:', noiseModelString); // Just to verify it's working

        if (!validateNoiseModelSyntax(fileData)) {
            console.log("Error in Noise Model Syntax")
        }

        modelMatrix = loadMatrix(noieModelString);

        if (!validateNoiseModelLinAlg(modelMatrix)) {
            console.log("Linear Algebra Error in Noise Model")
        }
    }


}