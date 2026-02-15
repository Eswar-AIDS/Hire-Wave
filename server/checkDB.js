const db = require('./config/db');

async function checkUsers() {
    try {
        const [rows] = await db.execute('SELECT id, username, email, role, status FROM users');
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error checking users:', err);
        process.exit(1);
    }
}

checkUsers();
