const db = require('./config/db');
const bcrypt = require('bcryptjs');

const initDB = async () => {
    try {
        // Users table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT CHECK(role IN ('student', 'company', 'admin')) NOT NULL,
                status TEXT CHECK(status IN ('pending', 'approved')) DEFAULT 'pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Students table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                full_name TEXT,
                cgpa REAL,
                department TEXT,
                skills TEXT,
                resume_path TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Companies table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                company_name TEXT NOT NULL,
                description TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Jobs table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                eligibility_criteria TEXT,
                status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            )
        `);

        // Applications table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS applications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                status TEXT CHECK(status IN ('applied', 'shortlisted', 'interview', 'rejected', 'placed')) DEFAULT 'applied',
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
            )
        `);

        // Admin Logs table
        await db.execute(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                action TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert default admin if not exists
        const [admins] = await db.execute('SELECT * FROM users WHERE username = ?', ['admin']);
        if (admins.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);
            await db.execute(
                'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
                ['admin', 'admin@placement.com', hashedPassword, 'admin', 'approved']
            );
            console.log('Default admin created.');
        }

        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Database initialization failed:', err);
    }
};

module.exports = initDB;
