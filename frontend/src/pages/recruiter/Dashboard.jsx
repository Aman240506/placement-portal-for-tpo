import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import api from '../../services/auth.service';

const StatCard = ({ label, value, color, icon }) => (
  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
    </div>
  </div>
);

export default function RecruiterDashboard() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/drives/my')
      .then(res => setDrives(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const open = drives.filter(d => d.status === 'open').length;
  const totalApplicants = drives.reduce((sum, d) => sum + (d.applicant_count || 0), 0);

  return (
    <RecruiterLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Recruiter Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your placement drives</p>
          </div>
          <Link to="/recruiter/drives/create"
            className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Post Drive
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Drives" value={drives.length} color="bg-violet-500/10"
            icon={<svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <StatCard label="Open Drives" value={open} color="bg-emerald-500/10"
            icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard label="Total Applicants" value={totalApplicants} color="bg-sky-500/10"
            icon={<svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">My Drives</h2>
            <Link to="/recruiter/drives" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />)}</div>
          ) : drives.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500 text-sm">No drives posted yet</p>
              <Link to="/recruiter/drives/create" className="text-violet-400 text-xs mt-2 inline-block hover:text-violet-300">Post your first drive →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {drives.slice(0, 5).map(drive => (
                <div key={drive.id} className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/30 hover:border-slate-600/50 transition-all">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{drive.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{drive.applicant_count || 0} applicants · Deadline {new Date(drive.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${drive.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {drive.status}
                    </span>
                    <Link to={`/recruiter/drives/${drive.id}/applicants`}
                      className="px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium rounded-lg transition-colors">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RecruiterLayout>
  );
}
