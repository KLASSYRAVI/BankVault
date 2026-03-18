import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Landmark, Users, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    active: boolean;
    createdAt: string;
}

interface DashboardStats {
    totalAccounts: number;
    volumeToday: number;
    failedCountToday: number;
    totalUsers: number;
}

interface AdminDashboardProps {
    roleRequired?: string;
}

const CountUp: React.FC<{ value: number }> = ({ value }) => {
    const [count, setCount] = useState(0);

    const duration = 800;
    const startTimestamp = useRef<number | null>(null);

    useEffect(() => {
        const step = (timestamp: number) => {
            if (!startTimestamp.current) startTimestamp.current = timestamp;
            const progress = Math.min((timestamp - startTimestamp.current) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease out
            
            setCount(Math.floor(easeOut * value));
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
        return () => { startTimestamp.current = null };
    }, [value]);

    return <>{count.toLocaleString()}</>;
};

const AdminDashboard: React.FC<AdminDashboardProps> = (_props) => {
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users'>('overview');

    const fetchData = useCallback(async () => {
        try {
            const [usersRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/dashboard/stats'),
            ]);
            setUsers(usersRes.data.data);
            setStats({
                ...statsRes.data.data,
                totalUsers: usersRes.data.data.length
            });
        } catch {
            toast.error('Synchronization failed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleToggleUser = async (user: User) => {
        const nextStatus = !user.active;
        try {
            await api.put(`/admin/users/${user.id}/status?active=${nextStatus}`);
            toast.success(`User ${user.username} ${nextStatus ? 'activated' : 'deactivated'}`);
            fetchData();
        } catch {
            toast.error('Failed to update user status');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 grayscale opacity-50">
                <RefreshCw className="w-8 h-8 text-accent-gold animate-spin mb-4" />
                <span className="text-text-tertiary text-sm">Synchronizing Admin Panel...</span>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-[28px] font-serif text-text-primary mb-1">Administrative Terminal</h1>
                    <p className="text-[13px] text-text-secondary uppercase tracking-[0.08em] font-medium">System Intelligence & Management</p>
                </div>
            </div>

            {/* Admin Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-bg-secondary border border-border-subtle p-6 rounded-lg relative hover:border-border-medium transition-colors group">
                    <Landmark className="absolute top-5 right-6 w-[18px] h-[18px] text-text-tertiary" />
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary">Total Accounts</span>
                        <span className="text-[26px] font-mono text-text-primary">
                            <CountUp value={stats?.totalAccounts || 0} />
                        </span>
                    </div>
                </div>
                <div className="bg-bg-secondary border border-border-subtle p-6 rounded-lg relative hover:border-border-medium transition-colors group">
                    <Users className="absolute top-5 right-6 w-[18px] h-[18px] text-text-tertiary" />
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary">Total Users</span>
                        <span className="text-[26px] font-mono text-text-primary">
                            <CountUp value={stats?.totalUsers || 0} />
                        </span>
                    </div>
                </div>
                <div className="bg-bg-secondary border border-border-subtle p-6 rounded-lg relative hover:border-border-medium transition-colors group">
                    <TrendingUp className="absolute top-5 right-6 w-[18px] h-[18px] text-text-tertiary" />
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary">Volume Today</span>
                        <span className="text-[26px] font-mono text-accent-gold">
                            ${(stats?.volumeToday || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                    </div>
                </div>
                <div className="bg-bg-secondary border border-border-subtle p-6 rounded-lg relative hover:border-border-medium transition-colors group">
                    <AlertCircle className="absolute top-5 right-6 w-[18px] h-[18px] text-text-tertiary" />
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary">Failed Transactions</span>
                        <span className="text-[26px] font-mono text-[#c96e6e]">
                            <CountUp value={stats?.failedCountToday || 0} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-8 border-b border-border-subtle pb-px">
                <button
                    className={`pb-3 text-[13px] font-medium uppercase tracking-[0.08em] transition-all border-b-2 ${
                        activeTab === 'overview' ? 'text-accent-gold border-accent-gold' : 'text-text-secondary border-transparent hover:text-text-primary'
                    }`}
                    onClick={() => setActiveTab('overview')}
                >
                    System Overview
                </button>
                <button
                    className={`pb-3 text-[13px] font-medium uppercase tracking-[0.08em] transition-all border-b-2 ${
                        activeTab === 'users' ? 'text-accent-gold border-accent-gold' : 'text-text-secondary border-transparent hover:text-text-primary'
                    }`}
                    onClick={() => setActiveTab('users')}
                >
                    User Directory
                </button>
            </div>

            {activeTab === 'users' && (
                <div className="bg-bg-secondary border border-border-subtle rounded-lg overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-subtle">
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">Entity Name</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">Permission</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium">Status</th>
                                    <th className="px-6 py-4 text-[11px] uppercase tracking-[0.08em] text-text-tertiary font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.02]">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-bg-tertiary transition-colors group h-12">
                                        <td className="px-6 text-[14px] text-text-secondary group-hover:text-text-primary transition-colors">{user.username}</td>
                                        <td className="px-6">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                user.role === 'ROLE_ADMIN' 
                                                ? 'text-accent-gold bg-accent-gold/10 border-accent-gold/20' 
                                                : 'text-info bg-info/10 border-info/20'
                                            }`}>
                                                {user.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'}
                                            </span>
                                        </td>
                                        <td className="px-6">
                                            {user.active ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded border text-success bg-success/10 border-success/20">ACTIVE</span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded border text-text-tertiary bg-white/5 border-white/10">INACTIVE</span>
                                            )}
                                        </td>
                                        <td className="px-6 text-right">
                                            <button 
                                                onClick={() => handleToggleUser(user)}
                                                className={`text-[11px] font-medium underline transition-all ${user.active ? 'text-[#7c4a4a] hover:text-[#c96e6e]' : 'text-[#4a7c59] hover:text-[#7cb08d]'}`}
                                            >
                                                {user.active ? 'Terminate Access' : 'Restore Access'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="py-20 text-center border border-dashed border-border-subtle rounded-lg animate-fade-in">
                    <Landmark size={32} className="mx-auto text-text-tertiary opacity-20 mb-4" />
                    <p className="font-serif italic text-text-tertiary text-lg">Detailed system analytics are being generated.</p>
                    <p className="text-text-tertiary text-xs uppercase tracking-widest mt-2 font-mono">Status: Secure · Live Feed active</p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
