const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { appendToDatabaseCSV } = require('../utils/fileUtils');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        console.log('REGISTRATION ATTEMPT:', { username, email, role });

        // Role lookup from Excel removed 🚫
        const assignedRole = role;

        console.log(`ROLE ASSIGNED: ${assignedRole} for ${email}`);

        // Check if user exists
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: 'Username or Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user (Auto-approved)
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, assignedRole, 'approved']
        );

        // Mirror to database.csv
        appendToDatabaseCSV(email, password);

        // Create empty profile based on role
        if (assignedRole === 'student') {
            await db.execute('INSERT INTO students (user_id) VALUES (?)', [result.insertId]);
        } else if (assignedRole === 'company') {
            await db.execute('INSERT INTO companies (user_id, company_name) VALUES (?, ?)', [result.insertId, username]);
        }

        res.status(201).json({ message: 'User registered successfully. You can now login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // 'identifier' can be username or email

    try {
        console.log('LOGIN ATTEMPT:', { identifier, hasPassword: !!password });
        // Check user by username OR email
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? OR email = ?', [identifier, identifier]);
        console.log('DB USER SEARCH RESULT:', { found: rows.length > 0 });
        if (rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];

        // Check if approved
        if (user.status !== 'approved') {
            return res.status(401).json({ message: 'Account status: ' + user.status });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('PASSWORD MATCH RESULT:', { isMatch, status: user.status });
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Sign token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                email: user.email
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '30d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    role: user.role,
                    email: user.email,
                    status: user.status
                });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/auth/verify
// @desc    Verify token and return user data
router.get('/verify', require('../middleware/authMiddleware'), async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, email, role, status FROM users WHERE id = ?', [req.user.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'User no longer exists' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/auth/forgot-password
// @desc    Reset password (simplified)
router.post('/forgot-password', async (req, res) => {
    const { username, email, newPassword } = req.body;

    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ? AND email = ?', [username, email]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Invalid username or email combination' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, rows[0].id]);
        res.json({ message: 'Password reset successful. You can now login.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
