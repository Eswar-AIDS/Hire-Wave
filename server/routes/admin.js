const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

// Middleware to check admin role
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access denied' });
    next();
};

// @route   GET api/admin/users
// @desc    Get all users (for approval)
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, username, role, status, created_at FROM users');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/admin/approve/:userId
// @desc    Approve a user
router.put('/approve/:userId', auth, isAdmin, async (req, res) => {
    try {
        await db.execute('UPDATE users SET status = "approved" WHERE id = ?', [req.params.userId]);

        const [user] = await db.execute('SELECT username, role FROM users WHERE id = ?', [req.params.userId]);

        // Log the action
        await db.execute('INSERT INTO admin_logs (action) VALUES (?)', [`Approved ${user[0].role}: ${user[0].username}`]);

        if (user[0].role === 'company') {
            const [existing] = await db.execute('SELECT * FROM companies WHERE user_id = ?', [req.params.userId]);
            if (existing.length === 0) {
                await db.execute('INSERT INTO companies (user_id, company_name) VALUES (?, ?)', [req.params.userId, user[0].username]);
            }
        }

        res.json({ message: 'User approved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/admin/reports
// @desc    Get placement reports
router.get('/reports', auth, isAdmin, async (req, res) => {
    try {
        const [totalStudents] = await db.execute('SELECT COUNT(*) as count FROM students');
        const [placedStudents] = await db.execute('SELECT COUNT(DISTINCT student_id) as count FROM applications WHERE status = "placed"');
        const [pendingStudents] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "student" AND status = "pending"');
        const [pendingCompanies] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "company" AND status = "pending"');

        // Stats for chart: Placed vs Unplaced by Department
        const [deptStats] = await db.execute(`
            SELECT 
                department, 
                COUNT(*) as total,
                SUM(CASE WHEN id IN (SELECT student_id FROM applications WHERE status = 'placed') THEN 1 ELSE 0 END) as placed
            FROM students 
            GROUP BY department
        `);

        // Recent Actions
        const [logs] = await db.execute('SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 5');

        res.json({
            total: totalStudents[0].count,
            placed: placedStudents[0].count,
            unplaced: totalStudents[0].count - placedStudents[0].count,
            pendingStudents: pendingStudents[0].count,
            pendingCompanies: pendingCompanies[0].count,
            deptStats,
            recentActions: logs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
