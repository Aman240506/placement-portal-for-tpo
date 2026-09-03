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
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-sky-500/30 rounded-2xl blur-xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PlacePortal</h1>
          <p className="text-slate-400 text-sm mt-1">AI-Powered Campus Placement</p>
        </div>

        {/* Card */}
        <div className="relative">
          {/* Card glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500/20 via-violet-500/20 to-emerald-500/20 rounded-2xl blur opacity-60" />

          <div className="relative bg-slate-900/90 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-8 shadow-2xl">

            <div className="mb-7">
              <h2 className="text-2xl font-bold text-white">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1">Sign in to continue to your portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    autoFocus
                    className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700/60 focus:border-sky-500/60 focus:bg-slate-800 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-sky-500/10"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-500 group-focus-within:text-sky-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    className="w-full pl-11 pr-12 py-3 bg-slate-800/60 border border-slate-700/60 focus:border-sky-500/60 focus:bg-slate-800 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-sky-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all duration-200 disabled:opacity-60 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-sky-500 to-blue-600 group-hover:from-sky-400 group-hover:to-blue-500 transition-all duration-200" />
                <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 opacity-0 group-hover:opacity-100 blur-lg transition-all duration-200" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                  ) : (
                    <> Sign in <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></>
                  )}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600 font-medium">ROLES</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Role cards — no credentials shown */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'Student',   emoji: '🎓', color: 'sky',     desc: 'Apply for drives' },
                { role: 'Recruiter', emoji: '🏢', color: 'violet',  desc: 'Post drives' },
                { role: 'TPO',       emoji: '👨‍💼', color: 'emerald', desc: 'Manage portal' },
              ].map(({ role, emoji, color, desc }) => (
                <div key={role}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all
                    bg-${color}-500/5 border-${color}-500/15 hover:bg-${color}-500/10`}>
                  <span className="text-xl">{emoji}</span>
                  <p className={`text-xs font-semibold text-${color}-400`}>{role}</p>
                  <p className="text-xs text-slate-600 text-center leading-tight">{desc}</p>
                </div>
              ))}
            </div>

            {/* Register link */}
            <p className="text-center text-slate-500 text-sm mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom badges */}
        <div className="flex items-center justify-center gap-4 mt-6">
          {['AI Powered', 'Secure', 'Real-time'].map((badge, i) => (
            <div key={badge} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-violet-400' : i === 1 ? 'bg-emerald-400' : 'bg-sky-400'}`} />
              <span className="text-xs text-slate-600">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

