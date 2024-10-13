//will eventually validate the format of the data
const math = require('mathjs'); // You can use Math.js for matrix operations

function validateNoiseModelLinAlg(matrices) {
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

module.exports = validateNoiseModelLinAlg;

