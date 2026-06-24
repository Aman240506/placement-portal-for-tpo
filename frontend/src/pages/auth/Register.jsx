import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { registerAPI } from '../../services/auth.service';

const BRANCHES = ['CS', 'IT', 'ENTC', 'Mechanical', 'Civil', 'Electrical', 'Chemical'];

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', role: 'student',
    full_name: '', branch: 'CS', year: '3', cgpa: '', roll_number: ''
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill email and password');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.cgpa) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      const payload = {
        ...form,
        year: parseInt(form.year),
        cgpa: parseFloat(form.cgpa)
      };
      const res = await registerAPI(payload);
      const { token, user } = res.data.data;
      login(token, user);
      toast.success('Account created!');
      navigate(`/${user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg min-h-screen flex items-center justify-center p-4">
      <div className="grid-overlay" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">PlacePortal</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-400 text-sm">Step {step} of 2 — {step === 1 ? 'Account details' : 'Student profile'}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mb-6">
          <div className="h-1 flex-1 rounded-full bg-sky-500 transition-all" />
          <div className={`h-1 flex-1 rounded-full transition-all ${step === 2 ? 'bg-sky-500' : 'bg-slate-700'}`} />
        </div>

        <div className="auth-card rounded-2xl p-8">
          {step === 1 ? (
            <form onSubmit={handleNext} className="space-y-5">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  {['student', 'recruiter'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm({ ...form, role: r })}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium capitalize transition-all ${
                        form.role === r
                          ? 'border-sky-500 bg-sky-500/10 text-sky-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {r === 'student' ? '🎓 Student' : '🏢 Recruiter'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                <input
                  type="password" name="password" value={form.password} onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <button type="submit" className="btn-primary w-full py-3 rounded-xl font-semibold text-sm">
                Continue →
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
                <input
                  type="text" name="full_name" value={form.full_name} onChange={handleChange}
                  placeholder="Aman Sharma"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Roll number</label>
                <input
                  type="text" name="roll_number" value={form.roll_number} onChange={handleChange}
                  placeholder="CS2021001"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
                  <select name="branch" value={form.branch} onChange={handleChange}
                    className="auth-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none">
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
                  <select name="year" value={form.year} onChange={handleChange}
                    className="auth-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none">
                    {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">CGPA</label>
                <input
                  type="number" name="cgpa" value={form.cgpa} onChange={handleChange}
                  placeholder="8.5" min="0" max="10" step="0.01"
                  className="auth-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm font-medium hover:border-slate-600 transition-all">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 btn-primary py-3 rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating...</> : 'Create account'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-sky-400 hover:text-sky-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}