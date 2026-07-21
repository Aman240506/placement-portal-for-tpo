
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, icon, color, bgColor, onClick }) => (
  <div onClick={onClick}
    className={`bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-start gap-4
      ${onClick ? 'cursor-pointer hover:border-slate-700 hover:bg-slate-800/40 transition-all' : ''}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bgColor}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className={`text-3xl font-bold ${color}`}>{value ?? '—'}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-1">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats]           = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [recentDrives, setRecentDrives]     = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading]       = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, studentsRes, drivesRes, companiesRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/students?limit=5'),
          api.get('/admin/drives'),
          api.get('/admin/companies'),
        ]);
        setStats(statsRes.data.data);
        setRecentStudents(studentsRes.data.data?.slice(0, 5) || []);
        setRecentDrives(drivesRes.data.data?.slice(0, 4) || []);
        setPendingCompanies(companiesRes.data.data?.filter(c => !c.is_approved) || []);
      } catch {
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/companies/${id}/approve`);
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      setStats(prev => prev ? { ...prev, pending_companies: prev.pending_companies - 1, companies: prev.companies + 1 } : prev);
      toast.success('Company approved');
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/companies/${id}/reject`);
      setPendingCompanies(prev => prev.filter(c => c.id !== id));
      setStats(prev => prev ? { ...prev, pending_companies: prev.pending_companies - 1 } : prev);
      toast.success('Company rejected');
    } catch { toast.error('Failed to reject'); }
  };

  if (loading) return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Good morning, TPO 👋</h1>
            <p className="text-slate-400 text-sm mt-1">Here's what's happening on your campus placement portal today.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/analytics"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Analytics
            </Link>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Students" value={stats?.students}
            sub="registered on platform"
            bgColor="bg-sky-500/10" color="text-sky-400"
            onClick={() => navigate('/admin/students')}
            icon={<svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />

          <StatCard label="Companies" value={stats?.companies}
            sub="approved & active"
            bgColor="bg-violet-500/10" color="text-violet-400"
            onClick={() => navigate('/admin/companies')}
            icon={<svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />

          <StatCard label="Open Drives" value={stats?.drives}
            sub="currently accepting applications"
            bgColor="bg-amber-500/10" color="text-amber-400"
            onClick={() => navigate('/admin/drives')}
            icon={<svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />

          <StatCard label="Placements" value={stats?.placements}
            sub="confirmed this season"
            bgColor="bg-emerald-500/10" color="text-emerald-400"
            icon={<svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />

          <StatCard label="Pending Approval" value={stats?.pending_companies}
            sub="companies awaiting review"
            bgColor={stats?.pending_companies > 0 ? "bg-red-500/10" : "bg-slate-800"}
            color={stats?.pending_companies > 0 ? "text-red-400" : "text-slate-400"}
            onClick={() => navigate('/admin/companies')}
            icon={<svg className={`w-6 h-6 ${stats?.pending_companies > 0 ? 'text-red-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Pending companies — action required */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Pending Approvals</h2>
                {pendingCompanies.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                    {pendingCompanies.length}
                  </span>
                )}
              </div>
              <Link to="/admin/companies" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                View all →
              </Link>
            </div>

            {pendingCompanies.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 text-sm">All caught up!</p>
                <p className="text-slate-600 text-xs mt-1">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCompanies.slice(0, 4).map(company => (
                  <div key={company.id}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 text-sm font-bold text-slate-300">
                        {company.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-200 truncate">{company.name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(company.id)}
                        className="flex-1 py-1.5 text-xs font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg transition-colors">
                        Approve
                      </button>
                      <button onClick={() => handleReject(company.id)}
                        className="flex-1 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent drives */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Recent Drives</h2>
              <Link to="/admin/drives" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</Link>
            </div>
            {recentDrives.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 text-sm">No drives yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentDrives.map(drive => {
                  const isOpen = drive.status === 'open';
                  const daysLeft = Math.ceil((new Date(drive.application_deadline) - new Date()) / 86400000);
                  return (
                    <div key={drive.id}
                      className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-200 truncate">{drive.title}</p>
                          <span className={`shrink-0 px-2 py-0.5 text-xs rounded-md font-medium
                            ${isOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                            {drive.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{drive.company_name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-emerald-400">{drive.ctc_lpa ? `${drive.ctc_lpa} LPA` : '—'}</p>
                        <p className={`text-xs mt-0.5 ${isOpen && daysLeft <= 3 ? 'text-red-400' : 'text-slate-500'}`}>
                          {isOpen ? (daysLeft >= 0 ? `${daysLeft}d left` : 'Expired') : 'Closed'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-white">{drive.applicant_count || 0}</p>
                        <p className="text-xs text-slate-500">applicants</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent students */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recently Registered Students</h2>
            <Link to="/admin/students" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</Link>
          </div>
          {recentStudents.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">No students registered yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {recentStudents.map(s => (
                <div key={s.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {s.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{s.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{s.branch} · {s.cgpa} CGPA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}

