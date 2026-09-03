import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../../services/auth.service';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [profile, setProfile]   = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Load profile to check status
    api.get('/students/profile').then(res => setProfile(res.data.data)).catch(() => {});

    // Listen for real-time approval notification
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });
    socket.on('connect', () => socket.emit('register', user?.id));
    socket.on('approval_update', (data) => {
      if (data.type === 'approved') {
        toast.success(data.message, { duration: 6000, icon: '🎉' });
        setTimeout(() => navigate('/student/dashboard'), 1500);
      } else {
        toast.error(data.message, { duration: 8000 });
        setProfile(prev => ({ ...prev, rejection_reason: data.message }));
      }
    });
    return () => socket.disconnect();
  }, [user, navigate]);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await api.get('/students/profile');
      const student = res.data.data;
      if (student.is_approved) {
        toast.success('Your account has been approved!');
        navigate('/student/dashboard');
      } else {
        toast('Still pending TPO approval', { icon: '⏳' });
      }
    } catch { /**/ }
    finally { setChecking(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isRejected = profile && !profile.is_approved && profile.rejection_reason;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 w-full max-w-md text-center space-y-6">

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
        </div>

        {isRejected ? (
          // ── Rejected state ───────────────────────────────────────────────
          <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Registration Not Approved</h1>
            <p className="text-slate-400 text-sm mb-4">Your account could not be verified by the TPO.</p>
            {profile?.rejection_reason && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5 text-left">
                <p className="text-xs text-red-400 font-semibold mb-1">Reason from TPO:</p>
                <p className="text-sm text-slate-300">{profile.rejection_reason}</p>
              </div>
            )}
            <p className="text-slate-500 text-xs mb-5">
              If you believe this is a mistake, contact your TPO with your college ID and roll number.
            </p>
            <button onClick={handleLogout}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700 transition-all">
              Sign out
            </button>
          </div>
        ) : (
          // ── Pending state ────────────────────────────────────────────────
          <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-8 shadow-2xl">
            {/* Animated pending icon */}
            <div className="relative w-20 h-20 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border-4 border-amber-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-amber-400 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full bg-amber-500/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h1 className="text-xl font-bold text-white mb-2">Pending TPO Approval</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Your registration is awaiting verification by the Training & Placement Officer.
              You'll be notified instantly once approved.
            </p>

            {/* Student info */}
            {profile && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-5 text-left space-y-2">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Your details</p>
                {[
                  { label: 'Name',   value: profile.full_name   || '—' },
                  { label: 'Branch', value: profile.branch       || '—' },
                  { label: 'CGPA',   value: profile.cgpa         || '—' },
                  { label: 'Roll',   value: profile.roll_number  || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-medium text-slate-300">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* What they can do while waiting */}
            <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-4 mb-5 text-left">
              <p className="text-xs text-sky-400 font-semibold mb-2">While you wait, you can:</p>
              <ul className="space-y-1.5">
                {[
                  'Complete your profile (CGPA, roll number, LinkedIn)',
                  'Upload your resume so it\'s ready when approved',
                  'Your page will auto-refresh when TPO approves you',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-sky-400 mt-0.5 shrink-0">→</span>{item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button onClick={checkStatus} disabled={checking}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium rounded-xl border border-amber-500/20 transition-all disabled:opacity-50">
                {checking
                  ? <><div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />Checking...</>
                  : '↻ Check status'}
              </button>
              <button onClick={handleLogout}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-sm font-medium rounded-xl border border-slate-700 transition-all">
                Sign out
              </button>
            </div>
          </div>
        )}

        <p className="text-slate-600 text-xs">
          PlacePortal · Your college's placement management system
        </p>
      </div>
    </div>
  );
}