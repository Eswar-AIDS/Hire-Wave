const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const initDB = require('./dbInit');

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('API Keys Loaded:', {
    Gemini: !!process.env.GEMINI_API_KEY,
    AdzunaID: !!process.env.ADZUNA_APP_ID,
    AdzunaKey: !!process.env.ADZUNA_API_KEY
});

console.log('====================================');
console.log('   SERVER STARTING: VERSION 2.0.0   ');
console.log('====================================');

initDB();

// Global Crash Logging
process.on('uncaughtException', (err) => {
    const fs = require('fs');
    const msg = `[${new Date().toISOString()}] UNCAUGHT EXCEPTION: ${err.stack}\n`;
    fs.appendFileSync(path.join(__dirname, 'crash.log'), msg);
    console.error(msg);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    const fs = require('fs');
    const msg = `[${new Date().toISOString()}] UNHANDLED REJECTION: ${reason}\n`;
    fs.appendFileSync(path.join(__dirname, 'crash.log'), msg);
    console.error(msg);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging
const fs = require('fs');
app.use((req, res, next) => {
    const msg = `[${new Date().toISOString()}] [PRE-AUTH] ${req.method} ${req.url}\n`;
    fs.appendFileSync(path.join(__dirname, 'server_audit.log'), msg);
    next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const auth = require('./middleware/authMiddleware');
app.use('/api/auth', require('./routes/auth'));

// Role-Specific Request Logger (POST-AUTH)
app.use('/api', auth, (req, res, next) => {
    const msg = `[${new Date().toISOString()}] [API-REQUEST] UserID:${req.user?.id} Role:${req.user?.role} Path:${req.url}\n`;
    fs.appendFileSync(path.join(__dirname, 'server_audit.log'), msg);
    next();
});

app.use('/api/student', require('./routes/student'));
app.use('/api/company', require('./routes/company'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('HireWave API is running...');
});

// Error Handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'Multer error: ' + err.message });
    }
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error: ' + err.message });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
