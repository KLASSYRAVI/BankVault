import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchAccounts } from '../store/accountSlice';
import { format } from 'date-fns';
import api from '../services/api';
import { Download, Search, X, Calendar, ChevronLeft, ChevronRight, RefreshCw, Landmark } from 'lucide-react';

interface Transaction {
    id: string;
    fromAccount: { id: string; accountNumber: string; ownerUsername: string } | null;
    toAccount: { id: string; accountNumber: string; ownerUsername: string } | null;
    amount: number;
    type: 'CREDIT' | 'DEBIT' | 'TRANSFER';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED';
    referenceId: string;
    description: string;
    createdAt: string;
}

interface PageData {
    content: Transaction[];
    totalPages: number;
    totalElements: number;
    number: number;
}

const Transactions: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { accounts } = useSelector((state: RootState) => state.accounts);
    const { role } = useSelector((state: RootState) => state.auth);
    const isAdmin = role === 'ROLE_ADMIN';
    
    const [selectedAccount, setSelectedAccount] = useState('');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pageInfo, setPageInfo] = useState({ totalPages: 0, totalElements: 0, number: 0 });
    const [loading, setLoading] = useState(false);
    
    const [filters, setFilters] = useState({
        dateFrom: null as string | null,
        dateTo: null as string | null,
        page: 0,
        size: 15,
    });

    // Initial load
    useEffect(() => {
        if (!isAdmin) {
            dispatch(fetchAccounts());
        }
    }, [dispatch, isAdmin]);

    // Auto-select first account for customers
    useEffect(() => {
        if (!isAdmin && accounts.length > 0 && !selectedAccount) {
            setSelectedAccount(accounts[0].id);
        }
    }, [accounts, isAdmin, selectedAccount]);

    const fetchTransactions = useCallback(async () => {
        if (!isAdmin && !selectedAccount) return;
        
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
            if (filters.dateTo) params.set('dateTo', filters.dateTo);
            params.set('page', String(filters.page));
            params.set('size', String(filters.size));

            const endpoint = isAdmin 
                ? `/admin/transactions`
                : `/transactions/account/${selectedAccount}`;

            const res = await api.get(`${endpoint}?${params.toString()}`);
            const data: PageData = res.data.data;
            
            if (data && data.content) {
                setTransactions(data.content);
                setPageInfo({
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    number: data.number,
                });
            } else {
                setTransactions([]);
            }
        } catch (err) {
            console.error("Failed to load ledger:", err);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [selectedAccount, filters, isAdmin]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleClearFilters = () => {
        setFilters({
            dateFrom: null,
            dateTo: null,
            page: 0,
            size: 15,
        });
    };

    const handleExport = async () => {
        if (!selectedAccount && !isAdmin) return;
        try {
            const endpoint = isAdmin 
                ? '/admin/transactions/export' 
                : `/transactions/account/${selectedAccount}/export`;
            const res = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', isAdmin ? 'system_ledger.csv' : 'account_statement.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            // silent Error
        }
    };

    const hasActiveFilters = filters.dateFrom !== null || filters.dateTo !== null;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-[28px] font-serif text-text-primary mb-1">Transaction History</h1>
                    <p className="text-[13px] text-text-secondary uppercase tracking-[0.08em] font-medium">Detailed Financial Ledger</p>
                </div>
                {(isAdmin || selectedAccount) && (
                    <button 
                        onClick={handleExport}
                        className="h-9 px-4 border border-border-medium rounded-md text-[12px] font-medium text-text-secondary hover:text-text-primary hover:border-border-subtle flex items-center gap-2 transition-all active:scale-[0.97]"
                    >
                        <Download size={14} />
                        Export Ledger
                    </button>
                )}
            </div>

            {/* Sticky Filter Bar */}
            <div className="bg-bg-secondary border border-border-subtle p-4 rounded-lg flex flex-wrap items-center gap-4 sticky top-0 z-10 shadow-sm">
                {!isAdmin && (
                    <div className="flex-1 min-w-[200px]">
                        <select
                            className="w-full bg-bg-tertiary border border-border-subtle rounded-md px-3 py-2.5 text-[13px] text-text-primary focus:border-accent-gold outline-none transition-colors cursor-pointer"
                            value={selectedAccount}
                            onChange={(e) => {
                                setSelectedAccount(e.target.value);
                                setFilters(f => ({ ...f, page: 0 }));
                            }}
                        >
                            <option value="">Select Account...</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.accountNumber} ({acc.accountType}) · ${acc.balance?.toLocaleString()}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
                        <input 
                            type="date" 
                            className="bg-bg-tertiary border border-border-subtle rounded-md pl-9 pr-3 py-2 text-[12px] text-text-primary focus:border-accent-gold outline-none transition-colors appearance-none min-w-[130px]"
                            value={filters.dateFrom || ''}
                            onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value || null, page: 0 }))}
                            placeholder="From date"
                        />
                    </div>
                    <span className="text-text-tertiary text-xs">to</span>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
                        <input 
                            type="date" 
                            className="bg-bg-tertiary border border-border-subtle rounded-md pl-9 pr-3 py-2 text-[12px] text-text-primary focus:border-accent-gold outline-none transition-colors appearance-none min-w-[130px]"
                            value={filters.dateTo || ''}
                            onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value || null, page: 0 }))}
                            placeholder="To date"
                        />
                    </div>
                </div>

                {hasActiveFilters && (
                    <button 
                        onClick={handleClearFilters}
                        className="h-9 px-3 text-[12px] text-accent-gold hover:text-accent-gold-dim flex items-center gap-1.5 transition-colors ml-auto"
                    >
                        <X size={14} />
                        Reset Filters
                    </button>
                )}
            </div>

            {/* Results Table */}
            <div className="bg-bg-secondary border border-border-subtle rounded-lg overflow-hidden min-h-[460px] flex flex-col shadow-sm">
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center grayscale opacity-50">
                        <RefreshCw className="w-8 h-8 text-accent-gold animate-spin mb-4" />
                        <span className="text-text-tertiary text-sm tracking-widest uppercase">Processing Records</span>
                    </div>
                ) : !isAdmin && !selectedAccount ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        <Search size={40} className="text-text-tertiary opacity-10 mb-5" />
                        <p className="font-serif italic text-text-tertiary text-xl text-center">Select an account to view transactions.</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-20">
                        {hasActiveFilters ? (
                            <>
                                <Search size={40} className="text-text-tertiary opacity-10 mb-5" />
                                <p className="font-serif italic text-text-tertiary text-xl text-center">No transactions match your filters. Try adjusting the date range.</p>
                            </>
                        ) : (
                            <>
                                <Landmark size={40} className="text-text-tertiary opacity-10 mb-5" />
                                <p className="font-serif italic text-text-tertiary text-xl text-center">No transactions yet. Make your first transfer!</p>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-bg-secondary z-20">
                                    <tr className="border-b border-border-subtle shadow-[0_1px_0_rgba(255,255,255,0.02)]">
                                        <th className="px-6 py-4 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-medium">Date & Time</th>
                                        <th className="px-6 py-4 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-medium">Type</th>
                                        <th className="px-6 py-4 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-medium">Entity Detail</th>
                                        <th className="px-6 py-4 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-medium">Status</th>
                                        <th className="px-6 py-4 text-[11px] uppercase tracking-[0.12em] text-text-tertiary font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.02]">
                                    {transactions.map((txn) => {
                                        const isDebited = !isAdmin && txn.fromAccount?.id === selectedAccount;
                                        const isCredited = !isAdmin && txn.toAccount?.id === selectedAccount;
                                        
                                        let amountColor = 'text-text-primary';
                                        let prefix = '';

                                        if (isDebited) {
                                            amountColor = 'text-danger-bright';
                                            prefix = '− ';
                                        } else if (isCredited || txn.type === 'CREDIT') {
                                            amountColor = 'text-success';
                                            prefix = '+ ';
                                        } else if (txn.type === 'DEBIT') {
                                            amountColor = 'text-danger-bright';
                                            prefix = '− ';
                                        }

                                        return (
                                            <tr key={txn.id} className="hover:bg-bg-tertiary transition-colors group h-[52px]">
                                                <td className="px-6">
                                                    <span className="text-[13px] text-text-secondary group-hover:text-text-primary transition-colors">
                                                        {format(new Date(txn.createdAt), 'MMM dd, yyyy · HH:mm')}
                                                    </span>
                                                </td>
                                                <td className="px-6">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                        txn.type === 'TRANSFER' ? 'text-info bg-info/10 border-info/20' : 
                                                        (txn.type === 'DEBIT' || isDebited) ? 'text-danger bg-danger/10 border-danger/20' : 'text-success bg-success/10 border-success/20'
                                                    }`}>
                                                        {txn.type}
                                                    </span>
                                                </td>
                                                <td className="px-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] text-text-primary">
                                                            {txn.type === 'TRANSFER' ? (
                                                                isAdmin ? (
                                                                    `${txn.fromAccount?.accountNumber} → ${txn.toAccount?.accountNumber}`
                                                                ) : (
                                                                    isDebited ? `To: ${txn.toAccount?.accountNumber}` : `From: ${txn.fromAccount?.accountNumber}`
                                                                )
                                                            ) : (
                                                                isAdmin ? (txn.fromAccount?.accountNumber || txn.toAccount?.accountNumber) : 'Direct Transaction'
                                                            )}
                                                        </span>
                                                        <span className="text-[11px] font-mono text-text-tertiary/60">
                                                            REF: {txn.referenceId.slice(0, 12)}...
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded border ${
                                                        txn.status === 'COMPLETED' ? 'text-success bg-success/10 border-success/20' :
                                                        txn.status === 'PENDING' ? 'text-accent-gold-dim bg-accent-gold/5 border-accent-gold/10' :
                                                        'text-danger-bright bg-danger/10 border-danger/20'
                                                    }`}>
                                                        {txn.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 text-right">
                                                    <span className={`text-[15px] font-mono ${amountColor}`}>
                                                        {prefix}${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        <div className="px-6 py-4 border-t border-border-subtle flex items-center justify-between bg-bg-secondary/50">
                            <span className="text-[11px] text-text-tertiary uppercase tracking-widest font-mono">
                                System Records: {pageInfo.totalElements} entries
                            </span>
                            <div className="flex items-center gap-3">
                                <button 
                                    className="p-1.5 border border-border-subtle rounded text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
                                    disabled={filters.page === 0}
                                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-[12px] text-text-secondary font-medium tracking-tighter">
                                    PAGE {filters.page + 1} / {pageInfo.totalPages || 1}
                                </span>
                                <button 
                                    className="p-1.5 border border-border-subtle rounded text-text-tertiary hover:text-text-primary disabled:opacity-30 transition-colors"
                                    disabled={filters.page >= pageInfo.totalPages - 1}
                                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Transactions;
