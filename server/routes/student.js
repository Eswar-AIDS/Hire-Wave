const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { analyzeResumeText } = require('../utils/aiAnalysis');

// Multer setup for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user.id}-${Date.now()}.pdf`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// @route   GET api/student/ping
// @desc    Test connectivity
router.get('/ping', (req, res) => res.json({ message: 'Student routes are active', version: '1.0.1' }));

// @route   GET api/student/profile
router.get('/profile', auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT s.*, u.username FROM students s JOIN users u ON s.user_id = u.id WHERE s.user_id = ?',
            [req.user.id]
        );
        if (rows.length === 0) {
            console.error(`PROFILE_NOT_FOUND: User ID ${req.user.id} has no student record. Role: ${req.user.role}`);
            return res.status(404).json({ message: 'Student profile record missing for this account' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/student/profile
router.put('/profile', auth, async (req, res) => {
    const { full_name, cgpa, department, skills } = req.body;
    try {
        await db.execute(
            'UPDATE students SET full_name = ?, cgpa = ?, department = ?, skills = ? WHERE user_id = ?',
            [full_name, cgpa, department, skills, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/student/jobs
// @desc    Get all open jobs with student eligibility and application status
router.get('/jobs', auth, async (req, res) => {
    try {
        console.log(`DEBUG JOBS FETCH: UserID=${req.user.id}`);
        const [student] = await db.execute('SELECT id, cgpa FROM students WHERE user_id = ?', [req.user.id]);

        if (student.length === 0) {
            console.error(`ACCESS_DENIED: User ID ${req.user.id} (Role: ${req.user.role}) attempted to fetch student jobs but has no profile.`);
            return res.status(404).json({
                message: req.user.role === 'company'
                    ? 'Access denied: Company accounts cannot view student job tracking'
                    : 'Student profile record missing for this account'
            });
        }

        const [jobs] = await db.execute('SELECT j.*, c.company_name FROM jobs j JOIN companies c ON j.company_id = c.id WHERE j.status = "open"');

        const [applications] = await db.execute('SELECT job_id, status FROM applications WHERE student_id = ?', [student[0].id]);

        const enrichedJobs = jobs.map(job => {
            const application = applications.find(a => a.job_id === job.id);
            const reqCGPA = Number(job.eligibility_criteria) || 0;
            const studentCGPA = Number(student[0].cgpa) || 0;
            const isEligible = studentCGPA >= reqCGPA;

            return {
                ...job,
                is_eligible: isEligible,
                application_status: application ? application.status : null,
                required_cgpa: reqCGPA
            };
        });

        res.json(enrichedJobs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/upload-resume', [auth, upload.single('resume')], async (req, res) => {
    console.log('--- RESUME UPLOAD START ---');
    console.log('DEBUG: pdfParse type is:', typeof pdfParse);
    if (!req.file) {
        console.log('No file received');
        return res.status(400).json({ message: 'No file uploaded' });
    }
    console.log('File info:', { filename: req.file.filename, path: req.file.path, size: req.file.size });

    try {
        console.log('Reading file...');
        const dataBuffer = fs.readFileSync(req.file.path);

        console.log('PDF-parse library type:', typeof pdfParse);

        let data;
        try {
            if (typeof pdfParse === 'function') {
                data = await pdfParse(dataBuffer);
            } else if (pdfParse.default && typeof pdfParse.default === 'function') {
                data = await pdfParse.default(dataBuffer);
            } else {
                console.error('Library details [FP-99]:', { type: typeof pdfParse, keys: Object.keys(pdfParse || {}) });
                throw new Error('PDF tool failed to load [FP-99]. Keys: ' + Object.keys(pdfParse || {}).join(','));
            }

            console.log('PDF Text extracted successfully. Length:', data.text?.length);
        } catch (parseErr) {
            console.error('Inner parsing error:', parseErr);
            throw parseErr;
        }

        console.log('Starting AI Analysis...');
        const analysis = await analyzeResumeText(data.text);
        console.log('AI Analysis result received');

        const skillsStr = Array.isArray(analysis.skills) ? analysis.skills.join(', ') : 'No skills detected';

        console.log('Updating Database for User ID:', req.user.id);
        const [result] = await db.execute(
            'UPDATE students SET resume_path = ?, skills = ? WHERE user_id = ?',
            [req.file.path, skillsStr, req.user.id]
        );
        console.log('Database Result:', result);

        console.log('--- RESUME UPLOAD SUCCESS ---');
        res.json({ message: 'Resume uploaded and analyzed', analysis });
    } catch (err) {
        console.error('CRITICAL ERROR IN UPLOAD-RESUME:', err);
        res.status(500).json({ message: 'Error processing resume: ' + err.message });
    }
});

// @route   GET api/student/external-jobs
router.get('/external-jobs', auth, async (req, res) => {
    try {
        const { search = 'software engineer' } = req.query;
        console.log(`Searching Adzuna for: ${search}`);
        const response = await axios.get(
            `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${process.env.ADZUNA_APP_ID}&app_key=${process.env.ADZUNA_API_KEY}&results_per_page=10&what=${search}&content-type=application/json`
        );
        res.json(response.data.results);
    } catch (err) {
        console.error("Adzuna API Error:", err.response?.data || err.message);
        res.status(500).json({ message: 'Error fetching external jobs' });
    }
});

// @route   POST api/student/apply/:jobId
router.post('/apply/:jobId', auth, async (req, res) => {
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
        if (student.length === 0) return res.status(404).json({ message: 'Student not found' });
        const [existing] = await db.execute('SELECT * FROM applications WHERE student_id = ? AND job_id = ?', [student[0].id, req.params.jobId]);
        if (existing.length > 0) return res.status(400).json({ message: 'Already applied' });
        await db.execute('INSERT INTO applications (student_id, job_id) VALUES (?, ?)', [student[0].id, req.params.jobId]);
        res.json({ message: 'Applied successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
