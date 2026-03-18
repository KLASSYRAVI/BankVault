import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Dashboard from './Dashboard';
import AdminDashboard from './AdminDashboard';

const DashboardRoute: React.FC = () => {
    const { role } = useSelector((state: RootState) => state.auth);

    if (role === 'ROLE_ADMIN') {
        return <AdminDashboard />;
    }

    return <Dashboard />;
};

export default DashboardRoute;
