import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/auth.service';

const BRANCHES = ['CS', 'IT', 'ENTC', 'Mechanical', 'Civil', 'Electrical', 'Chemical'];

export default function Register() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [step, setStep]       = useState(1); // 1 = account details, 2 = profile
  const [role, setRole]       = useState('student');
  const [loading, setLoading] = useState(false);

  // Step 1 fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Step 2 — Student
  const [fullName, setFullName]     = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch]         = useState('CS');
  const [year, setYear]             = useState('3');
  const [cgpa, setCgpa]             = useState('');

  // Step 2 — Recruiter
  const [companyName, setCompanyName]   = useState('');
  const [designation, setDesignation]   = useState('');
  const [phone, setPhone]               = useState('');
  const [recruiterName, setRecruiterName] = useState('');

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!email.trim())    return toast.error('Email is required');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (role === 'student') {
      if (!fullName.trim()) return toast.error('Full name is required');
      if (!cgpa)            return toast.error('CGPA is required');
    }
    if (role === 'recruiter') {
      if (!companyName.trim())  return toast.error('Company name is required');
      if (!recruiterName.trim()) return toast.error('Your name is required');
    }

    setLoading(true);
    try {
      const payload = {
        email, password, role,
        // Student
        full_name:   role === 'student'   ? fullName   : recruiterName,
        branch, year: parseInt(year), cgpa: parseFloat(cgpa), roll_number: rollNumber,
        // Recruiter
        company_name: companyName,
        designation,
        phone,
      };

      const res = await api.post('/auth/register', payload);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success('Account created! Welcome to PlacePortal 🎉');
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="text-slate-400 text-sm mt-1">
            Step {step} of 2 — {step === 1 ? 'Account details' : role === 'student' ? 'Student profile' : 'Recruiter profile'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-1 rounded-full bg-sky-500 transition-all" />
          <div className={`flex-1 h-1 rounded-full transition-all ${step === 2 ? 'bg-sky-500' : 'bg-slate-700'}`} />
        </div>

        <div className="auth-card rounded-2xl p-8">

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              {/* Role selector */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">I am a</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'student',   label: 'Student',   emoji: '🎓' },
                    { value: 'recruiter', label: 'Recruiter', emoji: '🏢' },
                  ].map(r => (
                    <button key={r.value} type="button" onClick={() => setRole(r.value)}
                      className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all
                        ${role === r.value
                          ? 'bg-sky-500/10 border-sky-500/50 text-sky-400'
                          : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}>
                      <span className="text-lg">{r.emoji}</span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Role description */}
              <div className={`px-4 py-3 rounded-xl border text-xs leading-relaxed
                ${role === 'student'
                  ? 'bg-sky-500/5 border-sky-500/20 text-sky-300'
                  : 'bg-violet-500/5 border-violet-500/20 text-violet-300'}`}>
                {role === 'student'
                  ? '🎓 As a student you can browse placement drives, upload your resume, apply, and track your AI match scores.'
                  : '🏢 As a recruiter you can post placement drives, view applicants, and run AI shortlisting. Your company will be reviewed by the TPO before going live.'}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@college.edu"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="auth-input w-full px-4 py-3 pr-11 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPass
                      ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" /></svg>
                      : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  </button>
                </div>
              </div>

              <button type="submit"
                className="btn-primary w-full py-3 rounded-xl text-sm font-semibold transition-all">
                Continue →
              </button>
            </form>
          )}

          {/* ── STEP 2 STUDENT ── */}
          {step === 2 && role === 'student' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full name <span className="text-red-400">*</span></label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Aman Sharma"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Roll number</label>
                <input value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                  placeholder="CS2021001"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Branch <span className="text-red-400">*</span></label>
                  <select value={branch} onChange={e => setBranch(e.target.value)}
                    className="auth-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none">
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Year <span className="text-red-400">*</span></label>
                  <select value={year} onChange={e => setYear(e.target.value)}
                    className="auth-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none">
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">CGPA <span className="text-red-400">*</span></label>
                <input type="number" value={cgpa} onChange={e => setCgpa(e.target.value)}
                  placeholder="8.5" min="0" max="10" step="0.01"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-slate-200 transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 btn-primary py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
                    : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2 RECRUITER ── */}
          {step === 2 && role === 'recruiter' && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Info banner */}
              <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-4 py-3 text-xs text-violet-300 leading-relaxed">
                Your company registration will be reviewed and approved by the TPO before your drives go live.
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Your name <span className="text-red-400">*</span></label>
                <input value={recruiterName} onChange={e => setRecruiterName(e.target.value)}
                  placeholder="Rahul Mehta"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Company name <span className="text-red-400">*</span></label>
                <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Infosys, TCS, Google India"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Designation</label>
                <input value={designation} onChange={e => setDesignation(e.target.value)}
                  placeholder="e.g. HR Manager, Campus Recruiter"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Phone number</label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-slate-400 bg-slate-800/60 border border-slate-700/50 hover:text-slate-200 transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 btn-primary py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</>
                    : 'Create account'}
                </button>
              </div>
            </form>
          )}

          {/* Sign in link — only on step 1 */}
          {step === 1 && (
            <p className="text-center text-slate-500 text-sm mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}