import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginUser } from '../store/authSlice';
import { AppDispatch, RootState } from '../store/store';
import { Landmark, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showDemo, setShowDemo] = useState(false);
    
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const from = location.state?.from?.pathname || '/dashboard';

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await dispatch(loginUser({ username, password })).unwrap();
            toast.success('Welcome to BankVault');
        } catch {
            // Error mapped in slice
        }
    };

    const quotes = [
        { text: "Wealth is not about having a lot of money; it's about having a lot of options.", author: "Chris Rock" },
        { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
        { text: "A bank is a place that will lend you money if you can prove that you don't need it.", author: "Bob Hope" }
    ];
    const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

    return (
        <div className="flex min-h-screen bg-bg-primary">
            {/* Left side art panel */}
            <div className="hidden lg:flex w-2/5 bg-[#0f0f0f] border-r border-border-subtle flex-col justify-center px-16 relative">
                <Landmark className="absolute top-12 left-12 text-accent-gold w-8 h-8 opacity-20" />
                <div className="animate-fade-in" style={{animationDuration: '600ms'}}>
                    <blockquote className="font-serif italic text-2xl text-text-secondary mb-6 leading-relaxed">
                        "{quote.text}"
                    </blockquote>
                    <p className="font-sans text-sm text-text-tertiary uppercase tracking-widest">
                        — {quote.author}
                    </p>
                </div>
            </div>

            {/* Right side form panel */}
            <div className="flex-1 flex flex-col justify-center items-center px-6">
                <div className="w-full max-w-[320px] animate-fade-in" style={{animationDelay: '100ms'}}>
                    <div className="flex flex-col items-center mb-10">
                        <Landmark className="text-accent-gold w-10 h-10 mb-4" />
                        <h1 className="text-3xl text-accent-gold tracking-wide">BankVault</h1>
                        <p className="text-text-secondary mt-2 text-sm uppercase tracking-widest">Private Wealth Management</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        {error && (
                            <div className="p-3 border-l-2 border-danger-bright bg-bg-elevated text-danger-bright text-sm rounded">
                                {error}
                            </div>
                        )}

                        <div className="form-group mb-0">
                            <label className="form-label" htmlFor="username">Username</label>
                            <input
                                id="username"
                                type="text"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group mb-0">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary w-full mt-2 py-3 text-[14px]"
                        >
                            {loading ? <span className="spinner w-[18px] h-[18px]"></span> : 'Secure Login'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button 
                            className="text-text-tertiary hover:text-text-secondary transition-colors inline-flex items-center gap-1.5 text-xs"
                            onClick={() => setShowDemo(!showDemo)}
                        >
                            <HelpCircle size={14} /> Need test credentials?
                        </button>

                        {showDemo && (
                            <div className="mt-4 text-xs text-text-secondary text-left bg-bg-elevated p-4 rounded border border-border-subtle animate-fade-in">
                                <p className="mb-2"><strong>Admin</strong>: admin / Admin@123</p>
                                <p><strong>Customer</strong>: customer1 / Customer@123</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
