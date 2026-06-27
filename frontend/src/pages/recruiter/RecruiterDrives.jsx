import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import api from '../../services/auth.service';

const statusConfig = {
  open:      { label: 'Open',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  closed:    { label: 'Closed',    bg: 'bg-slate-800',      text: 'text-slate-400',   border: 'border-slate-700/50' },
  completed: { label: 'Completed', bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
};

export default function RecruiterDrives() {
  const [drives, setDrives]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/drives/my')
      .then(res => setDrives(res.data.data || []))
      .catch(() => toast.error('Failed to load drives'))
      .finally(() => setLoading(false));
  }, []);

  const handleClose = async (id) => {
    try {
      await api.put(`/drives/${id}`, { status: 'closed' });
      setDrives(prev => prev.map(d => d.id === id ? { ...d, status: 'closed' } : d));
      toast.success('Drive closed');
    } catch {
      toast.error('Failed to close drive');
    }
  };

  const filtered = filter === 'all' ? drives : drives.filter(d => d.status === filter);

  return (
    <RecruiterLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Drives</h1>
            <p className="text-slate-400 text-sm mt-1">Manage all your placement drives</p>
          </div>
          <Link to="/recruiter/drives/create"
            className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-medium rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post Drive
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total drives',    value: drives.length,                             color: 'text-white' },
            { label: 'Open now',        value: drives.filter(d => d.status === 'open').length,  color: 'text-emerald-400' },
            { label: 'Total applicants',value: drives.reduce((s, d) => s + parseInt(d.applicant_count || 0), 0), color: 'text-violet-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {['all', 'open', 'closed', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all
                ${filter === f
                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}>
              {f === 'all' ? `All (${drives.length})` : f}
            </button>
          ))}
        </div>

        {/* Drives list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 text-sm">No drives yet</p>
            <p className="text-slate-600 text-xs mt-1">Post your first placement drive to get started</p>
            <Link to="/recruiter/drives/create"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors">
              Post a drive →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(drive => {
              const cfg = statusConfig[drive.status] || statusConfig.closed;
              const daysLeft = Math.ceil((new Date(drive.application_deadline) - new Date()) / 86400000);
              return (
                <div key={drive.id}
                  className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-semibold text-white">{drive.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">{drive.company_name}</p>

                      <div className="flex items-center gap-4 mt-3 flex-wrap">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {drive.applicant_count || 0} applicants
                        </span>
                        {drive.ctc_lpa && (
                          <span className="text-xs text-emerald-400">{drive.ctc_lpa} LPA</span>
                        )}
                        <span className="text-xs text-slate-500">
                          Deadline: {new Date(drive.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {drive.status === 'open' && daysLeft >= 0 && (
                            <span className={`ml-2 ${daysLeft <= 3 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-slate-500'}`}>
                              ({daysLeft}d left)
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-500">Min CGPA {drive.min_cgpa}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/recruiter/drives/${drive.id}/applicants`)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors">
                        View Applicants
                      </button>
                      {drive.status === 'open' && (
                        <button
                          onClick={() => handleClose(drive.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors">
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
}