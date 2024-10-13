describe('File Type', () => {
    const validateFileType = require('../utils/validateFileType');

    describe('File Type Validation', () => {
        it('should return true for a .txt file', () => {
            const mockFile = {
                type: 'text/plain', // Mimicking a .txt file MIME type
            };
            expect(validateFileType(mockFile)).toBe(true);
        });

        it('should return false for a non-.txt file', () => {
            const mockFile = {
                type: 'application/json', // Mimicking a .json file MIME type
            };
            expect(validateFileType(mockFile)).toBe(false);
        });

        it('should return false for an unknown file type', () => {
            const mockFile = {
                type: '', // Mimicking a file with no MIME type
            };
            expect(validateFileType(mockFile)).toBe(false);
        });
    });

});