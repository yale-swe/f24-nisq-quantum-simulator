//will eventually validate the format of the data

//this should validate based on two criteria
//the first criteria is that the fileData is a string which contains a list of matrices of the format:
// [[[0,0,0,0],[0,0,0,0],[0,0,0,0]], [[0,0,0,0],[0,0,0,0],[0,0,0,0]]] (this is a list of two 3x4 matrices containing 0's, but the matrices can have any dimension)

//ToDo: need to add a check for the dimensions of each matrix
function validateNoiseModelSyntax(fileData) {
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






module.exports = validateNoiseModelSyntax;