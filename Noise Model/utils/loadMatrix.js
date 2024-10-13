function loadMatrix(fileData) { 
    let data = {
        dimensions: [0, 0, 0],
        matrices: []
    }
    data.matrices = JSON.parse(fileData); 
    data.dimensions[0] = matrices.length

}

module.exports = loadMatrix;