import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            const role = localStorage.getItem('role');

            if (token && role) {
                const email = localStorage.getItem('email');
                console.log('AUTH_CONTEXT: Validating session...', { role, email });
                try {
                    // Role-agnostic token verification
                    const res = await api.get('/auth/verify');
                    setUser({
                        token,
                        role: res.data.role,
                        email: res.data.email,
                        status: res.data.status
                    });
                } catch (err) {
                    console.error('AUTH_CONTEXT: Session invalid', err.response?.status);
                    logout(); // Any error on verify (401, 404) should clear the session
                }
            } else {
                console.log('AUTH_CONTEXT: No session found');
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = (token, role, email, status) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('email', email);
        localStorage.setItem('status', status);
        setUser({ token, role, email, status });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('status');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
