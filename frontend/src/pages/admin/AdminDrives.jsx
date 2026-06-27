import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

const statusConfig = {
  open:      { label: 'Open',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  closed:    { label: 'Closed',    bg: 'bg-slate-800',      text: 'text-slate-400',   border: 'border-slate-700/50' },
  completed: { label: 'Completed', bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
};

export default function AdminDrives() {
  const [drives, setDrives]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');

  useEffect(() => {
    api.get('/admin/drives')
      .then(res => setDrives(res.data.data || []))
      .catch(() => toast.error('Failed to load drives'))
      .finally(() => setLoading(false));
  }, []);

  const handleCloseDrive = async (id) => {
    try {
      await api.put(`/drives/${id}`, { status: 'closed' });
      setDrives(prev => prev.map(d => d.id === id ? { ...d, status: 'closed' } : d));
      toast.success('Drive closed');
    } catch {
      toast.error('Failed to close drive');
    }
  };

  const filtered = drives.filter(d => {
    const matchFilter = filter === 'all' || d.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      d.title?.toLowerCase().includes(q) ||
      d.company_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const openCount  = drives.filter(d => d.status === 'open').length;
  const totalApplicants = drives.reduce((s, d) => s + parseInt(d.applicant_count || 0), 0);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Drives</h1>
          <p className="text-slate-400 text-sm mt-1">Monitor every placement drive across all companies</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total drives',     value: drives.length,   color: 'text-white' },
            { label: 'Currently open',   value: openCount,       color: 'text-emerald-400' },
            { label: 'Total applicants', value: totalApplicants, color: 'text-violet-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by role or company..."
              className="profile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            {['all', 'open', 'closed', 'completed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all
                  ${filter === f
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}>
                {f === 'all' ? `All (${drives.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 text-sm">No drives found</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-800/60 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-4">Drive</div>
              <div className="col-span-2">Company</div>
              <div className="col-span-1">CTC</div>
              <div className="col-span-1">CGPA</div>
              <div className="col-span-2">Deadline</div>
              <div className="col-span-1">Applicants</div>
              <div className="col-span-1">Action</div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filtered.map(drive => {
                const cfg = statusConfig[drive.status] || statusConfig.closed;
                return (
                  <div key={drive.id}
                    className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-slate-800/30 transition-colors">

                    <div className="col-span-4 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium text-slate-200 truncate">{drive.title}</p>
                        <span className={`shrink-0 px-1.5 py-0.5 text-xs font-medium rounded border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          {cfg.label}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-slate-300 truncate">{drive.company_name}</p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-sm text-emerald-400">{drive.ctc_lpa ? `${drive.ctc_lpa}L` : '—'}</p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-sm text-slate-300">{drive.min_cgpa}</p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-slate-300">
                        {new Date(drive.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="col-span-1">
                      <p className="text-sm font-medium text-slate-300">{drive.applicant_count || 0}</p>
                    </div>

                    <div className="col-span-1">
                      {drive.status === 'open' && (
                        <button onClick={() => handleCloseDrive(drive.id)}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors">
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}