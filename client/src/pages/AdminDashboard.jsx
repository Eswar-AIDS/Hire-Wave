import React, { useState, useEffect } from 'react';
import { Table, Button, Row, Col, Card, Badge, Form, ListGroup } from 'react-bootstrap';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Chart from 'chart.js/auto';
import { Bar } from 'react-chartjs-2';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [reports, setReports] = useState({
        total: 0,
        placed: 0,
        unplaced: 0,
        pendingStudents: 0,
        pendingCompanies: 0,
        deptStats: [],
        recentActions: []
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [deptFilter, setDeptFilter] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchReports();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReports = async () => {
        try {
            const res = await api.get('/admin/reports');
            setReports(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleApprove = async (userId) => {
        try {
            await api.put(`/admin/approve/${userId}`);
            fetchUsers();
            fetchReports(); // Refresh logs and counters
            toast.success('User approved successfully');
        } catch (err) {
            toast.error('Error approving user');
        }
    };

    const chartData = {
        labels: (reports?.deptStats || []).map(d => d?.department || 'Unknown'),
        datasets: [
            {
                label: 'Placed Students',
                data: (reports?.deptStats || []).map(d => d?.placed || 0),
                backgroundColor: 'rgba(25, 135, 84, 0.7)',
            },
            {
                label: 'Total Students',
                data: (reports?.deptStats || []).map(d => d?.total || 0),
                backgroundColor: 'rgba(13, 110, 253, 0.5)',
            },
        ],
    };

    const filteredStudents = users.filter(u =>
        u.role === 'student' &&
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-5">
            <h1 className="mb-4 fw-bold">Executive Overview</h1>

            {/* Metric Cards */}
            <Row className="mb-4">
                <Col md={3}>
                    <Card className="shadow-sm border-0 border-top border-4 border-info text-center p-3">
                        <small className="text-muted fw-bold text-uppercase">Total Students</small>
                        <h2 className="fw-bold mb-0 text-info">{reports.total}</h2>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 border-top border-4 border-success text-center p-3">
                        <small className="text-muted fw-bold text-uppercase">Placed</small>
                        <h2 className="fw-bold mb-0 text-success">{reports.placed}</h2>
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 border-top border-4 border-warning text-center p-3 position-relative">
                        <small className="text-muted fw-bold text-uppercase">Pending Students</small>
                        <h2 className="fw-bold mb-0 text-warning">{reports.pendingStudents}</h2>
                        {reports.pendingStudents > 0 && <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">Action Needed</Badge>}
                    </Card>
                </Col>
                <Col md={3}>
                    <Card className="shadow-sm border-0 border-top border-4 border-danger text-center p-3 position-relative">
                        <small className="text-muted fw-bold text-uppercase">Pending Companies</small>
                        <h2 className="fw-bold mb-0 text-danger">{reports.pendingCompanies}</h2>
                        {reports.pendingCompanies > 0 && <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">New Request</Badge>}
                    </Card>
                </Col>
            </Row>

            <Row className="mb-5">
                {/* Data Visualization */}
                <Col lg={8}>
                    <Card className="shadow-sm border-0 h-100 p-4">
                        <h5 className="fw-bold mb-4">Placement Statistics by Department</h5>
                        <div style={{ height: '300px' }}>
                            <Bar
                                data={chartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { position: 'bottom' } }
                                }}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Audit Log */}
                <Col lg={4}>
                    <Card className="shadow-sm border-0 h-100 p-4">
                        <h5 className="fw-bold mb-3 text-secondary">System Activity Log</h5>
                        <ListGroup variant="flush">
                            {(reports?.recentActions || []).map((log, i) => (
                                <ListGroup.Item key={i} className="px-0 py-3 bg-transparent border-light">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-light p-2 rounded-circle me-3" style={{ fontSize: '10px' }}>🔔</div>
                                        <div className="lh-sm">
                                            <div className="small fw-bold">{log.action}</div>
                                            <small className="text-muted" style={{ fontSize: '10px' }}>{new Date(log.created_at).toLocaleString()}</small>
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                            {reports.recentActions.length === 0 && <p className="text-muted small">No recent activities logged.</p>}
                        </ListGroup>
                    </Card>
                </Col>
            </Row>

            <h3 className="fw-bold mb-3">User Management</h3>
            <Row>
                {/* Students Section with Search */}
                <Col lg={12} className="mb-4">
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-primary text-white p-3 d-flex justify-content-between align-items-center">
                            <h6 className="mb-0 fw-bold">Student Directory</h6>
                            <Form.Control
                                size="sm"
                                type="text"
                                placeholder="Search by name..."
                                className="w-25 border-0 shadow-sm"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive className="mb-0 overflow-hidden rounded-bottom">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4">Username</th>
                                        <th>Registration Date</th>
                                        <th>Status</th>
                                        <th className="text-end px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(u => (
                                        <tr key={u.id}>
                                            <td className="px-4 fw-bold text-dark">{u.username}</td>
                                            <td className="text-muted small">{new Date(u.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <Badge bg={u.status === 'approved' ? 'success' : 'warning'} className="fw-normal">{u.status}</Badge>
                                            </td>
                                            <td className="text-end px-4">
                                                {u.status === 'pending' && (
                                                    <Button variant="outline-success" size="sm" className="fw-bold" onClick={() => handleApprove(u.id)}>Approve Student</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Companies Section */}
                <Col lg={12} className="mb-4">
                    <Card className="shadow-sm border-0">
                        <Card.Header className="bg-success text-white p-3">
                            <h6 className="mb-0 fw-bold">Partner Companies</h6>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover responsive className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4">Company Name</th>
                                        <th>Status</th>
                                        <th className="text-end px-4">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.filter(u => u.role === 'company').map(u => (
                                        <tr key={u.id}>
                                            <td className="px-4 fw-bold">{u.username}</td>
                                            <td>
                                                <Badge bg={u.status === 'approved' ? 'success' : 'warning'}>{u.status}</Badge>
                                            </td>
                                            <td className="text-end px-4">
                                                {u.status === 'pending' && (
                                                    <Button variant="outline-success" size="sm" onClick={() => handleApprove(u.id)}>Approve Partner</Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdminDashboard;
