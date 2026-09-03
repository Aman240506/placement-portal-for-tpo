import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/auth.service';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
);

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats] = useState({ applications: 0, drives: 0, shortlists: 0 });
  const [recentDrives, setRecentDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, drivesRes] = await Promise.all([
          api.get('/students/profile').catch(() => ({ data: { data: null } })),
          api.get('/drives/eligible').catch(() => ({ data: { data: [] } })),
        ]);
        setProfile(profileRes.data.data);
        setRecentDrives(drivesRes.data.data?.slice(0, 3) || []);
      } catch { /* silent */ }
      setLoading(false);
    };
    load();
  }, []);
// Add this in StudentDashboard useEffect:
useEffect(() => {
  api.get('/students/profile').then(res => {
    if (!res.data.data?.is_approved) {
      navigate('/pending-approval');
    }
  });
}, []);
  const completeness = profile ? Math.round(
    [profile.full_name, profile.phone, profile.roll_number, profile.cgpa, profile.branch, profile.linkedin_url, profile.github_url]
      .filter(Boolean).length / 7 * 100
  ) : 0;

  return (
    <StudentLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Good morning, {profile?.full_name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Here's your placement overview</p>
          </div>
          <Link to="/student/drives"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-xl transition-colors">
            Browse Drives
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Applications" value={stats.applications} sub="total applied"
            color="bg-sky-500/10" icon={<svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
          <StatCard label="Open Drives" value={recentDrives.length} sub="eligible for you"
            color="bg-violet-500/10" icon={<svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <StatCard label="Shortlisted" value={stats.shortlists} sub="this semester"
            color="bg-emerald-500/10" icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard label="CGPA" value={profile?.cgpa || '—'} sub={profile?.branch || 'update profile'}
            color="bg-amber-500/10" icon={<svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>} />
        </div>

        {/* Profile completeness */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-slate-200">Profile Completeness</p>
              <p className="text-xs text-slate-500 mt-0.5">Complete your profile to improve AI match scores</p>
            </div>
            <span className="text-2xl font-bold text-white">{completeness}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-700"
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <Link to="/student/profile" className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 mt-3 transition-colors">
              Complete your profile →
            </Link>
          )}
        </div>

        {/* Recent drives */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Eligible Drives</h2>
            <Link to="/student/drives" className="text-xs text-sky-400 hover:text-sky-300 transition-colors">View all →</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)}
            </div>
          ) : recentDrives.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">No eligible drives at the moment</p>
              <p className="text-slate-600 text-xs mt-1">Check back later or update your profile</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDrives.map((drive) => (
                <div key={drive.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{drive.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{drive.company_name} · {drive.ctc_lpa ? `${drive.ctc_lpa} LPA` : 'CTC not listed'}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-xs text-slate-500">
                      {new Date(drive.application_deadline) > new Date()
                        ? `${Math.ceil((new Date(drive.application_deadline) - new Date()) / 86400000)}d left`
                        : 'Closed'}
                    </span>
                    <Link to={`/student/drives/${drive.id}`}
                      className="px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium rounded-lg transition-colors">
                      Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
