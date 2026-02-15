const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');

// @route   GET api/company/jobs
// @desc    Get all jobs posted by the company with applicant counts
router.get('/jobs', auth, async (req, res) => {
    if (req.user.role !== 'company') return res.status(403).json({ message: 'Access denied' });

    try {
        const [company] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
        if (company.length === 0) return res.status(404).json({ message: 'Company not found' });

        const [jobs] = await db.execute(`
            SELECT j.*, 
            (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count
            FROM jobs j 
            WHERE j.company_id = ?`,
            [company[0].id]
        );
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/company/all-jobs
// @desc    Get all active jobs globally (for company view)
router.get('/all-jobs', auth, async (req, res) => {
    if (req.user.role !== 'company') return res.status(403).json({ message: 'Access denied' });

    try {
        const [jobs] = await db.execute('SELECT j.*, c.company_name FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.status = "open"');
        res.json(jobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/company/jobs
// @desc    Post a new job
router.post('/jobs', auth, async (req, res) => {
    if (req.user.role !== 'company') return res.status(403).json({ message: 'Access denied' });

    const { title, description, eligibility_criteria } = req.body;
    try {
        const [company] = await db.execute('SELECT id FROM companies WHERE user_id = ?', [req.user.id]);
        if (company.length === 0) return res.status(404).json({ message: 'Company not found' });

        await db.execute(
            'INSERT INTO jobs (company_id, title, description, eligibility_criteria) VALUES (?, ?, ?, ?)',
            [company[0].id, title, description, eligibility_criteria]
        );
        res.status(201).json({ message: 'Job posted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/company/applicants/:jobId
// @desc    Get applicants for a job
router.get('/applicants/:jobId', auth, async (req, res) => {
    if (req.user.role !== 'company') return res.status(403).json({ message: 'Access denied' });

    try {
        const [rows] = await db.execute(
            `SELECT a.id as app_id, a.status as app_status, s.*, u.username 
             FROM applications a 
             JOIN students s ON a.student_id = s.id 
             JOIN users u ON s.user_id = u.id 
             WHERE a.job_id = ?`,
            [req.params.jobId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/company/application/:appId
// @desc    Update application status
router.put('/application/:appId', auth, async (req, res) => {
    if (req.user.role !== 'company') return res.status(403).json({ message: 'Access denied' });

    const { status } = req.body;
    try {
        await db.execute('UPDATE applications SET status = ? WHERE id = ?', [status, req.params.appId]);
        res.json({ message: 'Status updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
