import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts, createAccount } from '../store/accountSlice';
import { AppDispatch, RootState } from '../store/store';
import toast from 'react-hot-toast';
import { Landmark, Wallet, PiggyBank, Plus, X } from 'lucide-react';
import api from '../services/api';
import AdminDashboard from './AdminDashboard';

const Dashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { accounts, loading } = useSelector((state: RootState) => state.accounts);
    const { role } = useSelector((state: RootState) => state.auth);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [closingAccountId, setClosingAccountId] = useState<string | null>(null);
    const [isClosing, setIsClosing] = useState(false);

    const isAdmin = role === 'ROLE_ADMIN';

    useEffect(() => {
        if (!isAdmin) {
            dispatch(fetchAccounts());
        }
    }, [dispatch, isAdmin]);

    const handleCreateAccount = async (type: 'CHECKING' | 'SAVINGS') => {
        try {
            await dispatch(createAccount(type)).unwrap();
            toast.success(`${type} account created`);
            setShowCreateModal(false);
        } catch (err) {
            toast.error(err as string);
        }
    };

    const handleCloseAccount = async () => {
        if (!closingAccountId) return;
        setIsClosing(true);
        try {
            const response = await api.post(`/accounts/${closingAccountId}/close`);
            if (response.status === 200) {
                toast.success("Account closed");
                dispatch(fetchAccounts());
                setClosingAccountId(null);
            }
        } catch (err: any) {
            const message = err.response?.data?.message || "Failed to close account";
            toast.error(message);
        } finally {
            setIsClosing(false);
        }
    };

    if (isAdmin) {
        return <AdminDashboard />;
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const checkingBalance = accounts.filter(a => a.accountType === 'CHECKING').reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const savingsBalance = accounts.filter(a => a.accountType === 'SAVINGS').reduce((sum, acc) => sum + (acc.balance || 0), 0);

    return (
        <div className="space-y-10 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-[28px] font-serif text-text-primary mb-1">Dashboard</h1>
                    <p className="text-[13px] text-text-secondary uppercase tracking-[0.08em] font-medium">Your Financial Overview</p>
                </div>
                <button 
                    onClick={() => setShowCreateModal(true)}
                    className="h-10 px-4 bg-accent-gold text-[#141414] rounded-md text-[13px] font-semibold flex items-center gap-2 hover:bg-accent-gold-dim transition-all active:scale-[0.97]"
                >
                    <Plus size={16} strokeWidth={3} />
                    New Account
                </button>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-bg-secondary border border-border-subtle p-6 rounded-lg relative hover:border-border-medium transition-colors group h-[120px] flex flex-col justify-between">
                    <Landmark className="absolute top-5 right-6 w-[18px] h-[18px] text-text-tertiary" />
                    <span className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary">Total Balance</span>
                    <span className="text-[26px] font-mono text-accent-gold">
                        ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="bg-bg-secondary border border-border-subtle p-6 rounded-lg relative hover:border-border-medium transition-colors group h-[120px] flex flex-col justify-between">
                    <Wallet className="absolute top-5 right-6 w-[18px] h-[18px] text-text-tertiary" />
                    <span className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary">Checking</span>
                    <span className="text-[26px] font-mono text-text-primary">
                        ${checkingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                <div className="bg-bg-secondary border border-border-subtle p-6 rounded-lg relative hover:border-border-medium transition-colors group h-[120px] flex flex-col justify-between">
                    <PiggyBank className="absolute top-5 right-6 w-[18px] h-[18px] text-text-tertiary" />
                    <span className="text-[11px] uppercase tracking-[0.1em] text-text-tertiary">Savings</span>
                    <span className="text-[26px] font-mono text-text-primary">
                        ${savingsBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-[13px] font-medium uppercase tracking-[0.08em] text-text-secondary border-b border-border-subtle pb-3">Your Accounts</h2>
                
                {loading ? (
                    <div className="flex flex-col items-center py-20 grayscale opacity-50">
                        <div className="w-8 h-8 border-2 border-border-subtle border-t-accent-gold rounded-full animate-spin mb-4" />
                        <span className="text-text-tertiary text-sm">Synchronizing data...</span>
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-border-subtle rounded-lg">
                        <p className="font-serif italic text-text-tertiary text-lg">No active accounts found.</p>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            className="text-accent-gold text-sm underline mt-2 hover:text-accent-gold-dim transition-colors"
                        >
                            Establish your first account
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {accounts.map((account) => (
                            <div 
                                key={account.id} 
                                className="bg-bg-secondary border border-border-subtle p-6 rounded-lg hover:border-border-medium transition-all group flex flex-col justify-between min-h-[160px]"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <span className="font-mono text-[13px] text-text-secondary">
                                            {account.accountType === 'CHECKING' ? 'CHK' : 'SAV'}••••{account.accountNumber.slice(-4)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                account.accountType === 'CHECKING' 
                                                ? 'text-info bg-info/10 border-info/20' 
                                                : 'text-success bg-success/10 border-success/20'
                                            }`}>
                                                {account.accountType}
                                            </span>
                                            {account.active ? (
                                                <span className="text-[10px] px-2 py-0.5 rounded border text-success bg-success/10 border-success/20">ACTIVE</span>
                                            ) : (
                                                <span className="text-[10px] px-2 py-0.5 rounded border text-danger-bright bg-danger/10 border-danger/20">CLOSED</span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[24px] font-mono text-accent-gold">
                                        ${(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                
                                <div className="flex justify-end mt-4">
                                    {account.active && (
                                        <button 
                                            onClick={() => setClosingAccountId(account.id)}
                                            className="text-[11px] text-[#7c4a4a] hover:text-[#c96e6e] transition-colors"
                                        >
                                            Close Account
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-bg-secondary border border-border-medium rounded-lg w-full max-w-[400px] overflow-hidden">
                        <div className="px-6 py-5 border-b border-border-subtle flex justify-between items-center">
                            <h3 className="font-serif text-[20px] text-text-primary">Establish New Account</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-text-tertiary hover:text-text-primary"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-text-secondary text-sm leading-relaxed">Please select the classification of the account you wish to establish.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => handleCreateAccount('CHECKING')}
                                    className="flex flex-col items-center gap-3 p-5 rounded-md border border-border-subtle hover:border-accent-gold hover:bg-bg-tertiary transition-all group"
                                >
                                    <Wallet className="w-6 h-6 text-text-tertiary group-hover:text-accent-gold" />
                                    <span className="text-[13px] font-medium text-text-primary">Checking</span>
                                </button>
                                <button 
                                    onClick={() => handleCreateAccount('SAVINGS')}
                                    className="flex flex-col items-center gap-3 p-5 rounded-md border border-border-subtle hover:border-accent-gold hover:bg-bg-tertiary transition-all group"
                                >
                                    <PiggyBank className="w-6 h-6 text-text-tertiary group-hover:text-accent-gold" />
                                    <span className="text-[13px] font-medium text-text-primary">Savings</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Closure Confirmation Modal */}
            {closingAccountId && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-bg-secondary border border-border-medium rounded-lg w-full max-w-[400px] overflow-hidden">
                        <div className="px-6 py-5 border-b border-border-subtle">
                            <h3 className="font-serif text-[20px] text-text-primary">Terminate Account?</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="text-text-secondary text-sm space-y-2 leading-relaxed">
                                <p>Account <span className="text-text-primary font-mono">{accounts.find(a => a.id === closingAccountId)?.accountNumber}</span> will be permanently closed.</p>
                                <p>A balance of <span className="text-accent-gold font-mono">$0.00</span> is required to proceed with termination.</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-bg-tertiary flex justify-end gap-3 border-t border-border-subtle">
                            <button 
                                onClick={() => setClosingAccountId(null)}
                                className="h-9 px-4 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCloseAccount}
                                disabled={isClosing}
                                className="h-9 px-4 bg-transparent border border-danger text-danger-bright rounded-md text-[13px] font-medium hover:bg-danger/10 active:scale-[0.97] transition-all"
                            >
                                {isClosing ? 'Closing...' : 'Yes, Close Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
