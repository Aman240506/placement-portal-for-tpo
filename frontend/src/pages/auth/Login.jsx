import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/auth.service';

export default function Login() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome back!`);
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill demo credentials
  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    toast('Demo credentials filled — click Sign in', { icon: '👆' });
  };

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="grid-overlay" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center mb-3 shadow-lg shadow-sky-500/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">PlacePortal</span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="auth-card rounded-2xl p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@college.edu" autoFocus
                className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="auth-input w-full px-4 py-3 pr-11 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in...</>
                : 'Sign in'}
            </button>
          </form>

          {/* Who can log in */}
          <div className="border-t border-slate-800/60 pt-5 space-y-2">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-3">Quick access — click to fill</p>

            {/* Admin / TPO */}
            <button onClick={() => fillDemo('admin@demo.com', 'admin1234')}
              className="w-full text-left px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span>👨‍💼</span> TPO / Admin
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">admin@demo.com · admin1234</p>
                </div>
                <span className="text-xs text-emerald-500/60 group-hover:text-emerald-400 transition-colors">Fill →</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">Manages students, approves companies, views analytics</p>
            </button>

            {/* Role info boxes */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="px-3 py-2.5 rounded-xl bg-sky-500/5 border border-sky-500/15">
                <p className="text-xs font-semibold text-sky-400">🎓 Student</p>
                <p className="text-xs text-slate-600 mt-0.5">Register to get your account</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl bg-violet-500/5 border border-violet-500/15">
                <p className="text-xs font-semibold text-violet-400">🏢 Recruiter</p>
                <p className="text-xs text-slate-600 mt-0.5">Register to post drives</p>
              </div>
            </div>
          </div>

          <p className="text-center text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
