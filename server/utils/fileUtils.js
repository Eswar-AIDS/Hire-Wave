const fs = require('fs');
const path = require('path');

const DATABASE_CSV_PATH = path.join(__dirname, '../../database.csv');

/**
 * Appends a new user registration to the database.csv file.
 */
function appendToDatabaseCSV(email, password) {
    try {
        const row = `${email},${password}\n`;
        // Use synchronous append to ensure it's written before the request finishes
        fs.appendFileSync(DATABASE_CSV_PATH, row);
        console.log(`[CSV-LOG] Appended ${email} to database.csv`);
    } catch (err) {
        console.error('Error writing to database.csv:', err.message);
    }
}

module.exports = {
    appendToDatabaseCSV
};
