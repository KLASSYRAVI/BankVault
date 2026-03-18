import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser, clearAuth } from '../store/authSlice';
import { clearAccounts } from '../store/accountSlice';
import { AppDispatch, RootState } from '../store/store';
import { 
    LayoutDashboard, 
    ListOrdered, 
    Send, 
    ShieldCheck, 
    LogOut, 
    Menu, 
    Landmark, 
    X
} from 'lucide-react';

const Layout: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { username, role } = useSelector((state: RootState) => state.auth);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const isAdmin = role === 'ROLE_ADMIN';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        dispatch(clearAccounts());
        dispatch(clearAuth());
        navigate('/login');
    };

    const navItems = isAdmin 
        ? [
            { to: '/dashboard', label: 'Admin Panel', icon: ShieldCheck },
            { to: '/transactions', label: 'All Transactions', icon: ListOrdered },
        ]
        : [
            { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/transactions', label: 'Transactions', icon: ListOrdered },
            { to: '/transfer', label: 'Transfer', icon: Send },
        ];

    return (
        <div className="layout-container font-sans text-text-primary bg-bg-primary min-h-screen flex">
            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden" 
                    onClick={() => setSidebarOpen(false)} 
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-[220px] bg-[#0f0f0f] border-r border-border-subtle 
                transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
            `}>
                <div className="h-[52px] px-5 flex items-center justify-between border-b border-border-subtle">
                    <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-accent-gold" />
                        <span className="font-serif text-[18px] text-accent-gold leading-none">BankVault</span>
                    </div>
                    <button className="lg:hidden text-text-tertiary hover:text-text-primary" onClick={() => setSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 py-5 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `
                                group flex items-center gap-3 px-5 py-2.5 text-[13px] transition-all duration-200
                                border-l-2
                                ${isActive 
                                    ? 'text-text-primary bg-bg-secondary border-accent-gold' 
                                    : 'text-text-secondary border-transparent hover:text-text-primary hover:border-accent-gold-dim'}
                            `}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="w-4 h-4" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-5 border-t border-border-subtle space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full border border-accent-gold flex items-center justify-center text-[14px] font-medium text-accent-gold bg-bg-secondary">
                            {username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[14px] text-text-primary truncate">{username}</span>
                            <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
                                {isAdmin ? 'Administrator' : 'Customer'}
                            </span>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout} 
                        className="w-full h-9 flex items-center justify-center gap-2 text-[13px] font-medium border border-border-medium rounded-md text-text-secondary hover:text-text-primary hover:border-border-subtle transition-colors"
                    >
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-[52px] flex items-center justify-between px-5 lg:px-10 border-b border-border-subtle bg-transparent">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden text-text-secondary" onClick={() => setSidebarOpen(true)}>
                            <Menu size={20} />
                        </button>
                        <span className="text-[13px] text-text-secondary hidden sm:inline">
                            Welcome, <span className="text-text-primary">{username}</span>
                        </span>
                    </div>
                    <div className="font-mono text-[12px] text-text-tertiary">
                        {currentTime.toLocaleString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric', 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                        }).toUpperCase()}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto w-full max-w-[1200px] mx-auto p-6 lg:p-10">
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
