const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');

async function test() {
    try {
        const uploadDir = path.join(__dirname, 'uploads');
        const files = fs.readdirSync(uploadDir);
        if (files.length === 0) {
            console.log('No files found in uploads');
            return;
        }

        const filePath = path.join(uploadDir, files[0]);
        console.log('Testing with file:', filePath);
        const dataBuffer = fs.readFileSync(filePath);

        console.log('Calling PDFParse...');
        const data = await pdf.PDFParse(dataBuffer);
        console.log('Extraction Success!');
        console.log('Text length:', data.text?.length);
        console.log('First 100 chars:', data.text?.substring(0, 100));
    } catch (err) {
        console.error('TEST FAILED:', err);
    }
}

test();
