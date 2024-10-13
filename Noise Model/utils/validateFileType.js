function validateFileType(file) {
    const validFileType = 'text/plain'; // MIME type for .txt files
    return file.type === validFileType;
}

module.exports = validateFileType; // Export for testing