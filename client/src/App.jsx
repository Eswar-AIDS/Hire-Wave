import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppNavbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ForgotPassword from './pages/ForgotPassword';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <AppNavbar />
          <div className="container-fluid p-0 flex-grow-1">
            <div className="container mt-4">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route
                  path="/student-dashboard"
                  element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>}
                />
                <Route
                  path="/company-dashboard"
                  element={<PrivateRoute role="company"><CompanyDashboard /></PrivateRoute>}
                />
                <Route
                  path="/admin-dashboard"
                  element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>}
                />

                <Route path="/" element={<Navigate to="/login" />} />
              </Routes>
            </div>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
