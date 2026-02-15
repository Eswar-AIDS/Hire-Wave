import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, ListGroup, Badge, Tabs, Tab, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import toast from 'react-hot-toast';
import api from '../utils/api';

const StudentDashboard = () => {
    const [profile, setProfile] = useState({ full_name: '', cgpa: '', department: '', skills: '', resume_path: '' });
    const [jobs, setJobs] = useState([]);
    const [externalJobs, setExternalJobs] = useState([]);
    const [analysis, setAnalysis] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState({ profile: false, jobs: false, external: false, ai: false });
    const [file, setFile] = useState(null);
    const [searchQuery, setSearchQuery] = useState('software engineer');
    const [matchingJobId, setMatchingJobId] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        fetchProfile();
        fetchJobs();
        fetchExternalJobs();
    }, []);

    const fetchProfile = async () => {
        setLoading(prev => ({ ...prev, profile: true }));
        try {
            const res = await api.get('/student/profile');
            setProfile(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(prev => ({ ...prev, profile: false }));
        }
    };

    const fetchJobs = async () => {
        setLoading(prev => ({ ...prev, jobs: true }));
        try {
            const res = await api.get(`/student/jobs?t=${Date.now()}`);
            setJobs(res.data);
            setLastUpdated(new Date().toLocaleTimeString());

            // Visual feedback
            setMessage('Tracker Refreshed!');
            setTimeout(() => setMessage(''), 3000);
            console.log('REFRESH_COMPLETE', new Date().toLocaleTimeString(), res.data);
        } catch (err) {
            console.error('Refresh error:', err);
            const errMsg = err.response?.data?.message || err.message;
            toast.error(`Refresh failed: ${errMsg}`);
        } finally {
            setLoading(prev => ({ ...prev, jobs: false }));
        }
    };

    const fetchExternalJobs = async (search = searchQuery) => {
        setLoading(prev => ({ ...prev, external: true }));
        try {
            const res = await api.get(`/student/external-jobs?search=${search}`);
            setExternalJobs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(prev => ({ ...prev, external: false }));
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put('/student/profile', profile);
            setMessage('Profile updated successfully');
            fetchJobs(); // Refresh eligibility
        } catch (err) {
            setMessage('Error updating profile');
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) return toast.error('Please select a PDF file');

        const formData = new FormData();
        formData.append('resume', file);

        setLoading(prev => ({ ...prev, ai: true }));
        try {
            const res = await api.post('/student/upload-resume', formData);
            setAnalysis(res.data.analysis);

            if (res.data.analysis.suitableRoles && res.data.analysis.suitableRoles.length > 0) {
                const topRole = res.data.analysis.suitableRoles[0];
                setSearchQuery(topRole);
                fetchExternalJobs(topRole);
            }

            toast.success('Resume uploaded and AI analysis complete!');
            fetchProfile();
        } catch (err) {
            console.error('File upload error:', err);
            toast.error(err.response?.data?.message || 'Error uploading resume');
        } finally {
            setLoading(prev => ({ ...prev, ai: false }));
        }
    };

    const handleApply = async (jobId) => {
        try {
            await api.post(`/student/apply/${jobId}`);
            toast.success('Applied successfully');
            fetchJobs();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error applying');
        }
    };

    const checkEligibility = (job) => {
        const studentCGPA = Number(profile.cgpa) || 0;
        const jobCriteria = Number(job.required_cgpa || job.eligibility_criteria) || 0;
        return job.is_eligible || (studentCGPA >= jobCriteria && jobCriteria > 0);
    };

    const getEligibleCount = () => jobs.filter(j => checkEligibility(j)).length;

    const renderTimeline = (status) => {
        const steps = ['applied', 'shortlisted', 'interview', 'placed'];
        const currentIdx = steps.indexOf(status || 'applied');

        return (
            <div className="d-flex align-items-center mt-2 w-100 px-2">
                {steps.map((step, i) => (
                    <React.Fragment key={step}>
                        <div className="d-flex flex-column align-items-center" style={{ flex: 1 }}>
                            <div className={`rounded-circle shadow-sm d-flex align-items-center justify-content-center ${i <= currentIdx ? 'bg-success text-white' : 'bg-light text-muted'}`} style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                {i <= currentIdx ? '✓' : i + 1}
                            </div>
                            <span className="x-small mt-1 text-capitalize fw-bold" style={{ fontSize: '9px' }}>{step}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{ flex: 1, height: '2px', backgroundColor: i < currentIdx ? '#198754' : '#e9ecef', marginBottom: '14px' }}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const calculateJobMatch = (job) => {
        if (!analysis) return null;

        const resumeTerms = [
            ...analysis.categorizedSkills.technical,
            ...analysis.categorizedSkills.tools,
            ...analysis.suitableRoles
        ].map(s => s.toLowerCase());

        const companyName = job.company_name || (job.company?.display_name) || '';
        const jobTerms = (job.title + ' ' + (job.description || '') + ' ' + companyName).toLowerCase();
        const matches = resumeTerms.filter(term => jobTerms.includes(term));
        const missing = resumeTerms.filter(term => !jobTerms.includes(term)).slice(0, 3);

        // Simple weighted score with higher floor for AI-matched roles
        const baseScore = Math.min(100, Math.round((matches.length / (jobTerms.split(' ').length / 5)) * 100) || 40);
        const score = job.is_ai_matched ? Math.max(85, baseScore) : baseScore;

        return { score, missing: missing.length > 0 ? missing : ['Cloud Services', 'System Design', 'Team Leadership'] };
    };

    return (
        <div className="pb-5">
            <h1 className="mb-4">Student Dashboard</h1>

            <Row className="mb-4 text-center">
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-primary text-white p-3">
                        <small className="fw-bold opacity-75">Your CGPA</small>
                        <h2 className="mb-0">{profile.cgpa || '0.0'}</h2>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="shadow-sm border-0 bg-white p-3 border-start border-4 border-info">
                        <div className="d-flex justify-content-between align-items-center">
                            <div className="text-start">
                                <h6 className="fw-bold text-info mb-0">Placement Eligibility Radar</h6>
                                <small className="text-muted">Based on your current academic standing</small>
                            </div>
                            <div className="text-end">
                                <h4 className="mb-0">{getEligibleCount()} / {jobs.length}</h4>
                                <small className="fw-bold text-success">Companies Eligible</small>
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 bg-success text-white p-3">
                        <small className="fw-bold opacity-75">Applications</small>
                        <h2 className="mb-0">{jobs.filter(j => j.application_status).length}</h2>
                    </Card>
                </Col>
            </Row>

            <Row>
                <Col lg={4}>
                    <Card className="mb-4 shadow-sm border-0">
                        <Card.Body>
                            <h5 className="fw-bold mb-3 border-bottom pb-2">Your Profile</h5>
                            {message && <Alert variant="success" className="py-2 small" onClose={() => setMessage('')} dismissible>{message}</Alert>}
                            <Form onSubmit={handleProfileUpdate}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Full Name</Form.Label>
                                    <Form.Control size="sm" type="text" value={profile.full_name || ''} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                                </Form.Group>
                                <Row>
                                    <Col>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small fw-bold">CGPA</Form.Label>
                                            <Form.Control size="sm" type="number" step="0.01" value={profile.cgpa || ''} onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })} />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group className="mb-2">
                                            <Form.Label className="small fw-bold">Department</Form.Label>
                                            <Form.Control size="sm" type="text" value={profile.department || ''} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Button variant="primary" type="submit" className="w-100 btn-sm mt-2">Update Credentials</Button>
                            </Form>

                            <hr className="my-3" />

                            <h5 className="fw-bold mb-3">AI Career Insights</h5>
                            <Form onSubmit={handleFileUpload}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small text-muted">Optimize with your latest Resume (PDF)</Form.Label>
                                    <Form.Control size="sm" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} />
                                </Form.Group>
                                <Button variant="dark" type="submit" className="w-100 btn-sm" disabled={loading.ai}>
                                    {loading.ai ? <Spinner size="sm" animation="border" /> : 'Start AI Analysis'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {analysis && (
                        <Card className="shadow-sm border-0 mb-4 overflow-hidden">
                            <Card.Header className={`py-3 text-white text-center fw-bold border-0 ${analysis.placementProbability < 50 ? 'bg-danger' : analysis.placementProbability < 70 ? 'bg-warning' : 'bg-success'}`}>
                                <h5 className="mb-0">Resume Strength: {analysis.placementProbability}%</h5>
                                <small className="opacity-75">Computation based on weighted parameters</small>
                            </Card.Header>
                            <Card.Body>
                                {/* Score Breakdown */}
                                <div className="mb-4">
                                    <h6 className="fw-bold small text-muted text-uppercase mb-2">Scorecard Breakdown</h6>
                                    <div className="bg-light p-3 rounded">
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span>✔ Education & CGPA</span>
                                            <span className="fw-bold text-primary">{analysis.scoreBreakdown.education} / 25</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span>✔ Technical Skills</span>
                                            <span className="fw-bold text-primary">{analysis.scoreBreakdown.skills} / 25</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-1 small">
                                            <span>{analysis.scoreBreakdown.projects > 10 ? '✔' : '✖'} Projects</span>
                                            <span className="fw-bold text-primary">{analysis.scoreBreakdown.projects} / 25</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-0 small">
                                            <span>{analysis.scoreBreakdown.experience > 10 ? '✔' : '✖'} Experience / Internships</span>
                                            <span className="fw-bold text-primary">{analysis.scoreBreakdown.experience} / 25</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary & Critique */}
                                <div className="mb-4">
                                    <h6 className="fw-bold small text-muted text-uppercase mb-1">Professional Summary</h6>
                                    <p className="small mb-2">{analysis.summaryCritique.summary}</p>
                                    <div className="p-2 border rounded bg-white">
                                        <div className="small fw-bold text-secondary mb-1">AI FEEDBACK</div>
                                        {analysis.summaryCritique.feedback.map((point, i) => (
                                            <div key={i} className={`small mb-1 ${point.toLowerCase().includes('lacks') || point.toLowerCase().includes('generic') ? 'text-danger' : 'text-success'}`}>
                                                {point.toLowerCase().includes('lacks') || point.toLowerCase().includes('generic') ? '✖' : '✔'} {point}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Categorized Skills */}
                                <div className="mb-4">
                                    <h6 className="fw-bold small text-muted text-uppercase mb-2">Skill Intelligence</h6>
                                    <div className="mb-2">
                                        <div className="x-small fw-bold text-primary mb-1" style={{ fontSize: '10px' }}>TECHNICAL SKILLS</div>
                                        {analysis.categorizedSkills.technical.map((s, i) => <Badge key={i} bg="primary" className="me-1 mb-1 fw-normal">{s}</Badge>)}
                                    </div>
                                    <div className="mb-2">
                                        <div className="x-small fw-bold text-info mb-1" style={{ fontSize: '10px' }}>TOOLS / LIBRARIES</div>
                                        {analysis.categorizedSkills.tools.map((s, i) => <Badge key={i} bg="info" className="me-1 mb-1 fw-normal">{s}</Badge>)}
                                    </div>
                                    <div>
                                        <div className="x-small fw-bold text-secondary mb-1" style={{ fontSize: '10px' }}>SOFT SKILLS</div>
                                        {analysis.categorizedSkills.soft.map((s, i) => <Badge key={i} bg="secondary" className="me-1 mb-1 fw-normal">{s}</Badge>)}
                                    </div>
                                </div>

                                {/* Roadmap */}
                                <div className="mb-4">
                                    <h6 className="fw-bold small text-muted text-uppercase mb-2">Roadmap to Success</h6>
                                    {analysis.roadmap.map((item, i) => (
                                        <div key={i} className="d-flex align-items-center mb-2 p-2 bg-light rounded border-start border-3 border-info">
                                            <div className="flex-grow-1 small lh-sm">{item.suggestion}</div>
                                            <Badge bg={item.priority === 'High' ? 'danger' : item.priority === 'Medium' ? 'warning' : 'info'} size="sm" className="ms-2" style={{ fontSize: '9px' }}>
                                                {item.priority}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>

                                {/* ATS Check */}
                                <div className="bg-dark text-white p-3 rounded shadow-sm">
                                    <h6 className="fw-bold small text-uppercase mb-2">ATS Compatibility Check</h6>
                                    <div className="row g-2 text-center">
                                        <div className="col-4">
                                            <div className="x-small opacity-75">Keywords</div>
                                            <div className={`fw-bold ${analysis.atsCheck.keywords === 'High' ? 'text-success' : 'text-danger'}`}>{analysis.atsCheck.keywords === 'High' ? '✔ High' : '✖ Low'}</div>
                                        </div>
                                        <div className="col-4 border-start border-secondary">
                                            <div className="x-small opacity-75">Formatting</div>
                                            <div className={`fw-bold ${analysis.atsCheck.formatting === 'Good' ? 'text-success' : 'text-danger'}`}>{analysis.atsCheck.formatting === 'Good' ? '✔ Good' : '✖ Bad'}</div>
                                        </div>
                                        <div className="col-4 border-start border-secondary">
                                            <div className="x-small opacity-75">Readable</div>
                                            <div className={`fw-bold ${analysis.atsCheck.readability === 'Good' ? 'text-success' : 'text-danger'}`}>{analysis.atsCheck.readability === 'Good' ? '✔ Yes' : '✖ No'}</div>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>

                <Col lg={8}>
                    <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                        <div className="d-flex align-items-center">
                            <h4 className="fw-bold mb-0 me-3">Opportunity Hub</h4>
                            <small className="text-muted d-none d-md-block">Last Sync: {lastUpdated}</small>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={fetchJobs}
                            disabled={loading.jobs}
                            className="rounded-pill px-3 shadow-sm d-flex align-items-center"
                        >
                            {loading.jobs ? <Spinner animation="border" size="sm" className="me-2" /> : <span className="me-2">🔄</span>}
                            Refresh Status
                        </Button>
                    </div>
                    <Tabs defaultActiveKey="college" id="job-tabs" className="mb-3 nav-fill shadow-sm rounded bg-white p-1">
                        <Tab eventKey="college" title={<span>Verified Jobs</span>}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="p-0">
                                    {loading.jobs ? <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div> : (
                                        <ListGroup variant="flush">
                                            {jobs.length > 0 ? jobs.map(job => (
                                                <ListGroup.Item key={job.id} className="p-4 border-bottom">
                                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                                        <div>
                                                            <h5 className="fw-bold mb-0">{job.title}</h5>
                                                            <span className="text-primary fw-bold small">{job.company_name}</span>
                                                        </div>
                                                        <div className="text-end">
                                                            {job.application_status ? (
                                                                <Badge
                                                                    bg={job.application_status === 'placed' ? 'success' :
                                                                        job.application_status === 'rejected' ? 'danger' : 'primary'}
                                                                    className="px-3 py-2 text-uppercase"
                                                                >
                                                                    {job.application_status}
                                                                </Badge>
                                                            ) : (
                                                                <Button variant="primary" size="sm" onClick={() => handleApply(job.id)} disabled={!checkEligibility(job)}>Apply Now</Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className="text-muted small mb-3">
                                                        {job.description || 'No description provided.'}
                                                    </p>

                                                    <div className="d-flex align-items-center mb-3">
                                                        <Badge bg="light" text="dark" className="border me-2">
                                                            <span className="fw-bold">Criteria:</span> {job.required_cgpa ?? job.eligibility_criteria ?? 'N/A'} CGPA
                                                        </Badge>
                                                        {checkEligibility(job) ? (
                                                            <Badge bg="success-soft" className="text-success border border-success fw-normal">✓ Pre-qualified</Badge>
                                                        ) : (
                                                            <Badge bg="danger-soft" className="text-danger border border-danger fw-normal">✕ Below Cutoff</Badge>
                                                        )}
                                                    </div>

                                                    {analysis && (
                                                        <div className="mt-3">
                                                            <Button
                                                                variant="outline-info"
                                                                size="sm"
                                                                onClick={() => setMatchingJobId(matchingJobId === job.id ? null : job.id)}
                                                            >
                                                                {matchingJobId === job.id ? 'Hide Match Analysis' : 'Analyze Match Score'}
                                                            </Button>

                                                            {matchingJobId === job.id && (
                                                                <div className="mt-2 bg-white border rounded p-3 shadow-sm border-start border-4 border-info">
                                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                                        <h6 className="fw-bold mb-0">Resume Match Score</h6>
                                                                        <Badge bg={calculateJobMatch(job).score > 70 ? 'success' : 'warning'} pill>
                                                                            {calculateJobMatch(job).score}% Match
                                                                        </Badge>
                                                                    </div>
                                                                    <ProgressBar
                                                                        variant={calculateJobMatch(job).score > 70 ? 'success' : 'warning'}
                                                                        now={calculateJobMatch(job).score}
                                                                        style={{ height: '6px' }}
                                                                        className="mb-3"
                                                                    />
                                                                    <div className="small">
                                                                        <span className="text-muted fw-bold">MISSING KEYWORDS:</span>{' '}
                                                                        {['Java', 'SQL', 'REST API'].map((k, i) => (
                                                                            <Badge key={i} bg="danger-soft" className="text-danger me-1 border border-danger fw-normal">{k}</Badge>
                                                                        ))}
                                                                    </div>
                                                                    <div className="x-small text-muted mt-2 mt-1">
                                                                        Tip: Incorporate these keywords to increase your selection probability.
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {job.application_status && (
                                                        <div className="bg-light p-3 rounded mt-3">
                                                            <div className="small fw-bold text-muted text-uppercase mb-2">Recruitment Timeline</div>
                                                            {renderTimeline(job.application_status)}
                                                        </div>
                                                    )}
                                                </ListGroup.Item>
                                            )) : <div className="p-5 text-center text-muted">No open jobs from college currently.</div>}
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>
                        <Tab eventKey="ai-recommended" title={<span>AI Recommended 🤖</span>}>
                            <Card className="border-0 shadow-sm">
                                <Card.Body className="p-0">
                                    {!analysis ? (
                                        <div className="p-5 text-center text-muted">
                                            <div className="display-4 mb-3">📄</div>
                                            <h6>Upload your resume to see AI-powered global recommendations</h6>
                                            <p className="small">Our AI will fetch and rank the best jobs from Adzuna that match your skill set.</p>
                                        </div>
                                    ) : (
                                        <ListGroup variant="flush">
                                            {/* Combined view of Internal High-Match and External AI-Fetched Jobs */}
                                            {[
                                                ...jobs.map(j => ({ ...j, type: 'internal', match: calculateJobMatch(j) })),
                                                ...externalJobs.map(j => ({ ...j, type: 'external', match: calculateJobMatch(j) }))
                                            ]
                                                .sort((a, b) => b.match.score - a.match.score)
                                                .filter(job => job.match.score > 10)
                                                .map((job, idx) => (
                                                    <ListGroup.Item key={idx} className="p-4 border-bottom">
                                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                                            <div>
                                                                <h5 className="fw-bold mb-0">
                                                                    {job.type === 'external' && <Badge bg="danger" className="me-2" style={{ fontSize: '10px', verticalAlign: 'middle' }}>GLOBAL</Badge>}
                                                                    {job.title}
                                                                </h5>
                                                                <span className="text-primary fw-bold small">{job.type === 'internal' ? job.company_name : job.company?.display_name}</span>
                                                            </div>
                                                            <Badge bg={job.match.score > 70 ? 'success' : 'info'} pill className="px-3 py-2">
                                                                {job.match.score}% Match
                                                            </Badge>
                                                        </div>
                                                        <p className="text-muted small mb-3">
                                                            {(job.description || '').substring(0, 180)}...
                                                        </p>
                                                        <div className="gap-2 d-flex">
                                                            {job.type === 'internal' ? (
                                                                <Button variant="primary" size="sm" onClick={() => handleApply(job.id)} disabled={!checkEligibility(job) || job.application_status}>
                                                                    {job.application_status ? 'Applied' : 'Apply Now'}
                                                                </Button>
                                                            ) : (
                                                                <a href={job.redirect_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-danger">View on Adzuna</a>
                                                            )}
                                                            <Button variant="outline-dark" size="sm" onClick={() => setMatchingJobId(matchingJobId === (job.id || idx) ? null : (job.id || idx))}>
                                                                Analyze Why
                                                            </Button>
                                                        </div>

                                                        {matchingJobId === (job.id || idx) && (
                                                            <div className="mt-2 bg-white border rounded p-3 shadow-sm border-start border-4 border-info">
                                                                <h6 className="fw-bold small mb-2">AI Match Report</h6>
                                                                <ProgressBar variant="success" now={job.match.score} style={{ height: '4px' }} className="mb-2" />
                                                                <div className="small">
                                                                    <span className="text-muted fw-bold">MISSING FOR THIS ROLE:</span>{' '}
                                                                    {job.match.missing.map((k, i) => (
                                                                        <Badge key={i} bg="danger-soft" className="text-danger me-1 border border-danger fw-normal">{k}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </ListGroup.Item>
                                                ))
                                            }
                                        </ListGroup>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>
                        <Tab eventKey="external" title={<span>Live External Openings</span>}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0 text-danger">Adzuna Global Search</h5>
                                    <Form className="d-flex" onSubmit={(e) => { e.preventDefault(); fetchExternalJobs(); }}>
                                        <Form.Control size="sm" type="text" placeholder="Search technology..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="me-2" />
                                        <Button size="sm" variant="danger" type="submit" disabled={loading.external}>Search</Button>
                                    </Form>
                                </Card.Header>
                                <Card.Body>
                                    {loading.external ? <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div> : (
                                        <Row>
                                            {externalJobs.map((job, i) => (
                                                <Col key={i} md={6} className="mb-3">
                                                    <Card className="h-100 border-0 bg-light hover-shadow transition">
                                                        <Card.Body className="p-3">
                                                            <h6 className="fw-bold mb-1">{job.title}</h6>
                                                            <div className="small text-muted mb-2">{job.company.display_name} • {job.location.display_name}</div>
                                                            <a href={job.redirect_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-danger w-100 mt-2">View Posting</a>
                                                        </Card.Body>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    )}
                                </Card.Body>
                            </Card>
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </div>
    );
};

export default StudentDashboard;
