# 🌊 HireWave - Campus Recruitment Platform

> A modern, full-stack web application designed to streamline and automate the college placement process for students, companies, and administrators.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.2-blue.svg)](https://reactjs.org/)

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

HireWave is a comprehensive campus recruitment management system that digitizes the entire placement process. It provides dedicated dashboards for three user roles:

- **👨‍🎓 Students**: Build profiles, browse opportunities, and track applications
- **🏢 Companies**: Post job openings, review applicants, and manage recruitment
- **👨‍💼 Admins**: Oversee the platform, approve users, and generate analytics

## ✨ Features

### For Students
- 📝 **Profile Management**: Create detailed profiles with CGPA, skills, and resume upload
- 🔍 **Job Discovery**: Browse internal campus jobs and external opportunities (via Adzuna API)
- 🤖 **AI Resume Analysis**: Get instant feedback on resume quality using Google Gemini AI
- 📊 **Application Tracking**: Monitor application status in real-time
- 🎯 **Smart Matching**: See eligibility status for each job based on CGPA requirements

### For Companies
- 📢 **Job Posting**: Create and manage job openings with custom eligibility criteria
- 👥 **Applicant Management**: View detailed applicant profiles and resumes
- 🔄 **Recruitment Pipeline**: Update candidate status (Shortlist → Interview → Hired/Rejected)
- 📈 **Real-time Updates**: Refresh applicant lists without page reload
- 🌐 **Global View**: Browse all active campus opportunities

### For Admins
- ✅ **User Approval**: Review and approve student/company registrations
- 📊 **Analytics Dashboard**: Track placement statistics and trends
- 📥 **Data Export**: Download placement reports in CSV/Excel format
- 🔐 **Platform Oversight**: Manage all users and job postings

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19.2 with Vite
- **UI Library**: React Bootstrap 5.3
- **Routing**: React Router DOM 7.13
- **State Management**: Context API
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Charts**: Chart.js with react-chartjs-2

### Backend
- **Runtime**: Node.js with Express 5.2
- **Database**: SQLite 3 (with promise wrapper)
- **Authentication**: JWT + Bcrypt
- **File Upload**: Multer
- **PDF Parsing**: pdf-parse
- **AI Integration**: Google Generative AI (Gemini)
- **External Jobs API**: Adzuna

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Eswar-AIDS/Hire-Wave.git
   cd Hire-Wave
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the `server/` directory:
   ```env
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_here
   GEMINI_API_KEY=your_google_gemini_api_key
   ADZUNA_APP_ID=your_adzuna_app_id
   ADZUNA_API_KEY=your_adzuna_api_key
   ```

   > **Get API Keys:**
   > - [Google Gemini API](https://ai.google.dev/)
   > - [Adzuna API](https://developer.adzuna.com/)

4. **Start the Backend**
   ```bash
   npm start
   ```
   
   The server will run on `http://localhost:5000`
   
   > **Note**: The SQLite database (`database.sqlite`) is automatically created on first run.

5. **Frontend Setup**
   
   Open a new terminal:
   ```bash
   cd client
   npm install
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **Security**: Change the default admin password after first login!

## 📁 Project Structure

```
Hire-Wave/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── CompanyDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/          # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── utils/            # Utilities
│   │   │   └── api.js
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── server/                    # Node.js backend
│   ├── routes/               # API routes
│   │   ├── auth.js          # Authentication
│   │   ├── student.js       # Student operations
│   │   ├── company.js       # Company operations
│   │   └── admin.js         # Admin operations
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── utils/
│   │   ├── aiAnalysis.js    # Gemini AI integration
│   │   └── fileUtils.js     # File handling
│   ├── config/
│   │   └── db.js            # Database configuration
│   ├── uploads/             # Resume storage
│   ├── dbInit.js            # Database initialization
│   ├── index.js             # Server entry point
│   └── package.json
├── .gitignore
└── README.md
```

## 🔌 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Student Routes
- `GET /api/student/profile` - Get student profile
- `PUT /api/student/profile` - Update profile
- `POST /api/student/upload-resume` - Upload resume
- `GET /api/student/jobs` - Get available jobs
- `POST /api/student/apply/:jobId` - Apply for job
- `GET /api/student/external-jobs` - Fetch external jobs (Adzuna)

### Company Routes
- `GET /api/company/jobs` - Get company's posted jobs
- `POST /api/company/jobs` - Create new job posting
- `GET /api/company/all-jobs` - View all campus jobs
- `GET /api/company/applicants/:jobId` - Get job applicants
- `PUT /api/company/application/:appId` - Update application status

### Admin Routes
- `GET /api/admin/pending-users` - Get pending approvals
- `PUT /api/admin/approve-user/:userId` - Approve user
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/export-data` - Export placement data

## 📸 Screenshots

> Add screenshots of your application here

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Eswar** - *Initial work* - [Eswar-AIDS](https://github.com/Eswar-AIDS)

## 🙏 Acknowledgments

- Google Gemini AI for resume analysis
- Adzuna for external job listings
- React Bootstrap for UI components
- All contributors who helped improve this project

---

<p align="center">Made with ❤️ for campus recruitment</p>
