const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function fixUser() {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('ajitha123', salt);

        const [result] = await db.execute(
            "UPDATE users SET status = 'approved', password = ? WHERE username = 'Ajitha'",
            [hashedPassword]
        );

        if (result.changes > 0) {
            console.log('User Ajitha approved and password reset to: ajitha123');
        } else {
            console.log('User Ajitha not found.');
        }
        process.exit(0);
    } catch (err) {
        console.error('Error fixing user:', err);
        process.exit(1);
    }
}

fixUser();
