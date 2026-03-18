import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchAccounts } from '../store/accountSlice';
import toast from 'react-hot-toast';
import api from '../services/api';
import { Info, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

const transferSchema = z.object({
    fromAccountId: z.string().min(1, 'Source account is required'),
    toAccountId: z.string().min(1, 'Destination account is required'),
    amount: z.number({ invalid_type_error: 'Amount is required' })
        .min(0.01, 'Minimum transfer is $0.01')
        .max(10000, 'Maximum transfer is $10,000'),
    description: z.string().max(255).optional(),
});

type TransferFormData = z.infer<typeof transferSchema>;

const Transfer: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { accounts } = useSelector((state: RootState) => state.accounts);
    const [recipientType, setRecipientType] = useState<'MY_ACCOUNTS' | 'EXTERNAL'>('MY_ACCOUNTS');
    const [lookupResult, setLookupResult] = useState<{ accountId: string; accountNumber: string; ownerUsername: string; accountType: string } | null>(null);
    const [lookupError, setLookupError] = useState<string | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [transferSuccess, setTransferSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<TransferFormData>({
        resolver: zodResolver(transferSchema),
    });

    const selectedFromAccount = watch('fromAccountId');


    useEffect(() => {
        dispatch(fetchAccounts());
    }, [dispatch]);

    // Handle lookup when recipientType is EXTERNAL and account number is entered
    const handleLookup = async (accountNumber: string) => {
        if (!accountNumber || accountNumber.length < 5) return;
        
        setIsLookingUp(true);
        setLookupResult(null);
        setLookupError(null);
        
        try {
            const res = await api.get(`/accounts/lookup?accountNumber=${accountNumber}`);
            const data = res.data;
            setLookupResult(data);
            setValue('toAccountId', data.accountId);
            setLookupError(null);
        } catch (err: any) {
            setLookupError("Account not found");
            setValue('toAccountId', '');
        } finally {
            setIsLookingUp(false);
        }
    };

    const onSubmit = async (data: TransferFormData) => {
        try {
            await api.post('/transactions/transfer', {
                ...data,
                idempotencyKey: crypto.randomUUID(),
            });
            setTransferSuccess(true);
            toast.success('Funds Transferred');
            setTimeout(() => {
                reset();
                setRecipientType('MY_ACCOUNTS');
                setLookupResult(null);
                setTransferSuccess(false);
                dispatch(fetchAccounts());
            }, 3000);
        } catch (err: any) {
            const message = err.response?.data?.message || 'Transaction declined';
            toast.error(message);
        }
    };

    if (transferSuccess) {
        return (
            <div className="max-w-[480px] mx-auto py-20 text-center space-y-6 animate-fade-in">
                <div className="w-20 h-20 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-success animate-scale-in" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-serif text-text-primary">Transfer Complete</h2>
                    <p className="text-text-secondary text-sm">Your transaction has been processed successfully.</p>
                </div>
                <p className="text-text-tertiary text-xs animate-pulse">Refreshing your accounts...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[480px] mx-auto space-y-10 animate-fade-in">
            <div className="text-center">
                <h1 className="text-[28px] font-serif text-text-primary mb-1">Move Funds</h1>
                <p className="text-[13px] text-text-secondary uppercase tracking-[0.08em] font-medium">Safe & Secure Transfer</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* From Account */}
                <div className="space-y-3">
                    <label className="text-[13px] font-medium text-text-secondary uppercase tracking-wider block">From Account</label>
                    <div className="relative">
                        <select
                            className={`w-full bg-bg-tertiary border ${errors.fromAccountId ? 'border-danger' : 'border-border-subtle'} rounded-md px-4 py-3 text-[14px] text-text-primary focus:border-accent-gold outline-none transition-colors appearance-none`}
                            {...register('fromAccountId')}
                        >
                            <option value="">Select source account...</option>
                            {accounts.filter(a => a.active).map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.accountNumber.slice(0, 7)}...{acc.accountNumber.slice(-4)} ({acc.accountType}) · ${acc.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-tertiary">
                            <ArrowRight size={14} className="rotate-90 sm:rotate-0" />
                        </div>
                    </div>
                    {errors.fromAccountId && <p className="text-danger-bright text-[11px] mt-1">{errors.fromAccountId.message}</p>}
                </div>

                {/* To Account Section */}
                <div className="space-y-5 border-t border-border-subtle pt-8">
                    <div className="flex justify-between items-center">
                        <label className="text-[13px] font-medium text-text-secondary uppercase tracking-wider block">Recipient</label>
                        <div className="flex p-0.5 bg-bg-tertiary rounded-md border border-border-subtle">
                            <button
                                type="button"
                                onClick={() => { setRecipientType('MY_ACCOUNTS'); setLookupResult(null); setLookupError(null); setValue('toAccountId', ''); }}
                                className={`px-3 py-1 text-[11px] font-medium rounded transition-all ${recipientType === 'MY_ACCOUNTS' ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                            >
                                MY ACCOUNTS
                            </button>
                            <button
                                type="button"
                                onClick={() => { setRecipientType('EXTERNAL'); setLookupResult(null); setLookupError(null); setValue('toAccountId', ''); }}
                                className={`px-3 py-1 text-[11px] font-medium rounded transition-all ${recipientType === 'EXTERNAL' ? 'bg-bg-elevated text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'}`}
                            >
                                SEND TO SOMEONE
                            </button>
                        </div>
                    </div>

                    {recipientType === 'MY_ACCOUNTS' ? (
                        <div className="relative">
                            <select
                                className={`w-full bg-bg-tertiary border ${errors.toAccountId ? 'border-danger' : 'border-border-subtle'} rounded-md px-4 py-3 text-[14px] text-text-primary focus:border-accent-gold outline-none transition-colors appearance-none`}
                                {...register('toAccountId')}
                            >
                                <option value="">Select destination...</option>
                                {accounts.filter(a => a.active && a.id !== selectedFromAccount).map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.accountNumber.slice(0, 7)}...{acc.accountNumber.slice(-4)} ({acc.accountType}) · ${acc.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </option>
                                ))}
                            </select>
                            {errors.toAccountId && <p className="text-danger-bright text-[11px] mt-1">{errors.toAccountId.message}</p>}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter account number (e.g. CHK1234567890)"
                                    className={`w-full bg-bg-tertiary border ${lookupError ? 'border-danger' : lookupResult ? 'border-success' : 'border-border-subtle'} rounded-md px-4 py-3 text-[14px] text-text-primary focus:border-accent-gold outline-none transition-colors`}
                                    onBlur={(e) => handleLookup(e.target.value)}
                                />
                                {isLookingUp && <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-gold animate-spin" />}
                                {lookupResult && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-success" />}
                            </div>
                            
                            {lookupResult && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-success/5 border border-success/20 rounded text-[12px] text-success animate-fade-in">
                                    <span className="font-medium">→ {lookupResult.ownerUsername}</span>
                                    <span className="text-success/60">·</span>
                                    <span className="uppercase">{lookupResult.accountType}</span>
                                    <span className="ml-auto">✓</span>
                                </div>
                            )}

                            {lookupError && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-danger/5 border border-danger/20 rounded text-[12px] text-danger-bright animate-fade-in">
                                    <AlertCircle size={14} />
                                    <span>{lookupError}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Amount */}
                <div className="space-y-4 border-t border-border-subtle pt-8 text-center">
                    <label className="text-[13px] font-medium text-text-secondary uppercase tracking-wider">Transfer Amount</label>
                    <div className="relative px-10">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-accent-gold font-mono text-xl">$</span>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="bg-transparent border-none text-center font-mono text-4xl text-accent-gold w-full outline-none placeholder:text-text-tertiary/20 selection:bg-accent-gold/20"
                            {...register('amount', { valueAsNumber: true })}
                        />
                    </div>
                    {errors.amount && <p className="text-danger-bright text-[11px]">{errors.amount.message}</p>}
                </div>

                {/* Description */}
                <div className="space-y-3">
                    <label className="text-[13px] font-medium text-text-secondary uppercase tracking-wider block">Description <span className="text-text-tertiary italic">(optional)</span></label>
                    <textarea
                        rows={2}
                        placeholder="Purpose of transfer..."
                        className="w-full bg-bg-tertiary border border-border-subtle rounded-md px-4 py-3 text-[14px] text-text-primary focus:border-accent-gold outline-none transition-colors resize-none"
                        {...register('description')}
                    />
                </div>

                <div className="space-y-6 pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting || (recipientType === 'EXTERNAL' && !lookupResult)}
                        className="w-full h-12 bg-accent-gold text-bg-primary rounded-md text-[14px] font-bold uppercase tracking-widest hover:bg-accent-gold-dim transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                    >
                        {isSubmitting ? 'Authorizing...' : 'Execute Transfer'}
                    </button>

                    <div className="bg-bg-tertiary border border-border-subtle p-4 rounded-lg flex items-start gap-3">
                        <Info className="w-4 h-4 text-text-tertiary shrink-0 mt-0.5" />
                        <div className="text-[11px] text-text-secondary leading-relaxed">
                            <span className="block font-semibold text-text-tertiary mb-1 tracking-wider">TRANSFER LIMITS</span>
                            Minimum: $0.01 · Maximum: $10,000.00 · Processing: Instant
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Transfer;
