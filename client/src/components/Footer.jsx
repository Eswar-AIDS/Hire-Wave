import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
    return (
        <footer className="bg-dark text-white py-4 mt-5">
            <Container>
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <div>
                        <h6 className="fw-bold mb-1">HireWave</h6>
                        <p className="small text-muted mb-0">Built for Academic Year 2025-26</p>
                    </div>
                    <div className="text-md-end mt-3 mt-md-0">
                        <p className="small mb-1">Job data powered by <a href="https://www.adzuna.com" target="_blank" rel="noopener noreferrer" className="text-info text-decoration-none">Adzuna API</a></p>
                        <p className="small mb-0 text-muted">&copy; 2026 Institution Name. All rights reserved.</p>
                    </div>
                </div>
            </Container>
        </footer>
    );
};

export default Footer;
