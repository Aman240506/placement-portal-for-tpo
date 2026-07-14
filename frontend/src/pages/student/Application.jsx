import { useState, useEffect } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/auth.service';

const statusConfig = {
  applied:     { label: 'Applied',     bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected:    { label: 'Rejected',    bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
  selected:    { label: 'Selected 🎉', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
};

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState('all');

  useEffect(() => {
    api.get('/students/applications')
      .then(res => setApplications(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter);

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
          <p className="text-slate-400 text-sm mt-1">Track all your placement applications</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'applied', 'shortlisted', 'selected', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all
                ${filter === f
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}>
              {f === 'all' ? `All (${applications.length})` : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 text-sm">No applications yet</p>
            <p className="text-slate-600 text-xs mt-1">Browse drives and start applying</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(app => {
              const cfg = statusConfig[app.status] || statusConfig.applied;
              const matched = app.matched_skills || [];
              const missing = app.missing_skills || [];
              return (
                <div key={app.id}
                  className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-white truncate">{app.drive_title}</p>
                    <p className="text-sm text-slate-400 mt-0.5">{app.company_name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Applied {new Date(app.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    {/* AI match score + skill gap */}
                    {(app.match_score || matched.length > 0 || missing.length > 0) && (
                      <div className="mt-3 space-y-2">
                        {app.match_score && (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                                style={{ width: `${app.match_score}%` }} />
                            </div>
                            <span className="text-xs text-slate-400">AI Match: {app.match_score}%</span>
                          </div>
                        )}
                        {(matched.length > 0 || missing.length > 0) && (
                          <div className="flex flex-wrap gap-1.5">
                            {matched.slice(0, 4).map(s => (
                              <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ✓ {s}
                              </span>
                            ))}
                            {missing.slice(0, 3).map(s => (
                              <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                                ✗ {s}
                              </span>
                            ))}
                            {missing.length > 3 && (
                              <span className="px-2 py-0.5 text-xs rounded-md bg-slate-800 text-slate-500">
                                +{missing.length - 3} missing
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <span className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
