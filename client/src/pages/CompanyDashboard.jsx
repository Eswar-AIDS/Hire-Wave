import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Card, Row, Col, Table, Badge, ListGroup, Spinner, Alert } from 'react-bootstrap';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const CompanyDashboard = () => {
    const [jobData, setJobData] = useState({ title: '', description: '', eligibility_criteria: '' });
    const [myJobs, setMyJobs] = useState([]);
    const [allJobs, setAllJobs] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('mine'); // 'mine' or 'global'
    const [userStatus, setUserStatus] = useState('approved');

    const { user } = useContext(AuthContext);

    useEffect(() => {
        if (user?.status) {
            setUserStatus(user.status);
        }
        fetchMyJobs();
        fetchAllJobs();
    }, [user]);

    const fetchAllJobs = async () => {
        try {
            const res = await api.get('/company/all-jobs');
            setAllJobs(res.data);
        } catch (err) {
            console.error('Error fetching global jobs:', err);
        }
    };

    const fetchMyJobs = async () => {
        try {
            const res = await api.get('/company/jobs');
            setMyJobs(res.data);
            // Auto select first job if none selected
            if (res.data.length > 0 && !selectedJob) {
                fetchApplicants(res.data[0]);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handlePostJob = async (e) => {
        e.preventDefault();
        try {
            await api.post('/company/jobs', jobData);
            toast.success('Job posted successfully!');
            setJobData({ title: '', description: '', eligibility_criteria: '' });
            fetchMyJobs();
        } catch (err) {
            toast.error('Error posting job');
        }
    };

    const fetchApplicants = async (job) => {
        setLoading(true);
        try {
            const res = await api.get(`/company/applicants/${job.id}`);
            setApplicants(res.data);
            setSelectedJob(job);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (appId, status) => {
        try {
            await api.put(`/company/application/${appId}`, { status });
            toast.success(`Candidate ${status === 'placed' ? 'hired' : status}`);
            fetchApplicants(selectedJob);
        } catch (err) {
            console.error('Update error:', err);
            toast.error(err.response?.data?.message || 'Error updating status');
        }
    };

    return (
        <div className="pb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="fw-bold mb-0">Recruitment Hub</h1>
                <div className="btn-group shadow-sm">
                    <Button variant={viewMode === 'mine' ? 'primary' : 'outline-primary'} size="sm" onClick={() => setViewMode('mine')}>My Postings</Button>
                    <Button variant={viewMode === 'global' ? 'dark' : 'outline-dark'} size="sm" onClick={() => setViewMode('global')}>Global Openings</Button>
                </div>
            </div>

            {userStatus === 'pending' && (
                <Alert variant="warning" className="shadow-sm border-0 border-start border-4 border-warning mb-4">
                    <Alert.Heading className="h6 fw-bold">⚠️ Account Pending Approval</Alert.Heading>
                    <p className="small mb-0">Your company profile is under review by the placement cell. You can browse the portal, but you'll be able to post jobs and hire once approved.</p>
                </Alert>
            )}

            <Row>
                <Col lg={4}>
                    <Card className="mb-4 shadow-sm border-0 border-top border-4 border-success">
                        <Card.Body>
                            <h5 className="fw-bold mb-3">Create Opportunity</h5>
                            <Form onSubmit={handlePostJob}>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Job Title</Form.Label>
                                    <Form.Control size="sm" type="text" placeholder="e.g. SDE Intern" value={jobData.title} onChange={(e) => setJobData({ ...jobData, title: e.target.value })} required />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label className="small fw-bold">Description</Form.Label>
                                    <Form.Control size="sm" as="textarea" rows={3} placeholder="Key responsibilities..." value={jobData.description} onChange={(e) => setJobData({ ...jobData, description: e.target.value })} required />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold">Min CGPA Required</Form.Label>
                                    <Form.Control size="sm" type="number" step="0.1" placeholder="e.g. 7.5" value={jobData.eligibility_criteria} onChange={(e) => setJobData({ ...jobData, eligibility_criteria: e.target.value })} required />
                                </Form.Group>
                                <Button variant="success" type="submit" className="w-100 btn-sm fw-bold" disabled={userStatus === 'pending'}>Post Opening</Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-white py-3">
                            <h6 className="mb-0 fw-bold text-secondary">
                                {viewMode === 'mine' ? 'Your Active Postings' : 'Global Network Openings'}
                            </h6>
                        </Card.Header>
                        <ListGroup variant="flush">
                            {(viewMode === 'mine' ? myJobs : allJobs).map(job => (
                                <ListGroup.Item
                                    key={job.id}
                                    action
                                    active={selectedJob?.id === job.id}
                                    onClick={() => viewMode === 'mine' ? fetchApplicants(job) : setSelectedJob(job)}
                                    className="d-flex justify-content-between align-items-center"
                                >
                                    <div className="small fw-bold text-truncate" style={{ maxWidth: '70%' }}>{job.title}</div>
                                    <Badge bg={selectedJob?.id === job.id ? 'light' : 'primary'} text={selectedJob?.id === job.id ? 'dark' : 'white'} pill>
                                        {viewMode === 'mine' ? `${job.applicant_count} Apps` : 'View'}
                                    </Badge>
                                </ListGroup.Item>
                            ))}
                            {(viewMode === 'mine' ? myJobs : allJobs).length === 0 && <p className="p-3 text-muted small">No jobs found.</p>}
                        </ListGroup>
                    </Card>
                </Col>

                <Col lg={8}>
                    {selectedJob ? (
                        <Card className="shadow-sm border-0">
                            <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-0">{selectedJob.title}</h5>
                                    <small className="text-muted">Eligibility: {selectedJob.eligibility_criteria || selectedJob.required_cgpa} CGPA</small>
                                </div>
                                <div className="d-flex align-items-center">
                                    {viewMode === 'mine' && (
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            className="me-3 d-flex align-items-center gap-2 shadow-sm"
                                            onClick={() => fetchApplicants(selectedJob)}
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner animation="border" size="sm" /> : <span>↻ Refresh Applicants</span>}
                                        </Button>
                                    )}
                                    {viewMode === 'mine' ? <Badge bg="info">Recruitment Active</Badge> : <Badge bg="secondary">External Job</Badge>}
                                </div>
                            </Card.Header>
                            <Card.Body className={viewMode === 'mine' ? 'p-0' : 'p-4'}>
                                {viewMode === 'global' && (
                                    <div className="mb-4">
                                        <h6 className="fw-bold text-primary small mb-2 text-uppercase">Opportunity Overview</h6>
                                        <p className="text-dark bg-light p-3 rounded">{selectedJob.description}</p>
                                    </div>
                                )}

                                {viewMode === 'mine' && (
                                    <>
                                        <div className="p-4 border-bottom bg-light bg-opacity-10">
                                            <h6 className="fw-bold text-secondary small mb-2 text-uppercase">Description</h6>
                                            <p className="small mb-0 text-dark">{selectedJob.description}</p>
                                        </div>
                                        {loading ? <div className="text-center py-5"><Spinner animation="border" /></div> : (
                                            <Table hover responsive className="mb-0">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th className="px-4">Student Name</th>
                                                        <th>CGPA</th>
                                                        <th>Qualification</th>
                                                        <th>Current Status</th>
                                                        <th className="text-end px-4">Recruitment Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {applicants.map(app => {
                                                        const isEligible = app.cgpa >= parseFloat(selectedJob.eligibility_criteria);
                                                        return (
                                                            <tr key={app.app_id} className={!isEligible ? 'opacity-50 grayscale' : ''}>
                                                                <td className="px-4">
                                                                    <div className="fw-bold">{app.full_name || app.username}</div>
                                                                    <small className="text-muted">{app.department}</small>
                                                                </td>
                                                                <td className="fw-bold">{app.cgpa}</td>
                                                                <td>
                                                                    {isEligible ?
                                                                        <Badge bg="success-soft" className="text-success border border-success">✓ Eligible</Badge> :
                                                                        <Badge bg="danger-soft" className="text-danger border border-danger">✕ Below Cutoff</Badge>
                                                                    }
                                                                </td>
                                                                <td>
                                                                    <Badge bg={
                                                                        app.app_status === 'shortlisted' ? 'info' :
                                                                            app.app_status === 'interview' ? 'primary' :
                                                                                app.app_status === 'placed' ? 'success' :
                                                                                    app.app_status === 'rejected' ? 'danger' : 'secondary'
                                                                    }>
                                                                        {app.app_status.toUpperCase()}
                                                                    </Badge>
                                                                </td>
                                                                <td className="text-end px-4">
                                                                    <div className="btn-group shadow-sm">
                                                                        <Button variant="outline-info" size="sm" onClick={() => handleStatusUpdate(app.app_id, 'shortlisted')} disabled={app.app_status === 'shortlisted'}>Shortlist</Button>
                                                                        <Button variant="outline-primary" size="sm" onClick={() => handleStatusUpdate(app.app_id, 'interview')} disabled={app.app_status === 'interview'}>Interview</Button>
                                                                        <Button variant="outline-danger" size="sm" onClick={() => handleStatusUpdate(app.app_id, 'rejected')} disabled={app.app_status === 'rejected'}>Reject</Button>
                                                                        <Button variant="success" size="sm" onClick={() => handleStatusUpdate(app.app_id, 'placed')} disabled={app.app_status === 'placed'}>Hire</Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {applicants.length === 0 && (
                                                        <tr>
                                                            <td colSpan="5" className="text-center py-5 text-muted">No applications received yet for this opportunity.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        )}
                                    </>
                                )}
                            </Card.Body>
                        </Card>
                    ) : (
                        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted border rounded bg-white shadow-sm p-5">
                            <div className="display-1 mb-3">📁</div>
                            <h4>Select a job posting to manage candidates</h4>
                        </div>
                    )}
                </Col>
            </Row>
        </div>
    );
};

export default CompanyDashboard;
