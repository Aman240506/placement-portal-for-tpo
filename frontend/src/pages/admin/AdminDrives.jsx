import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

const STATUS = {
  open:      { label: 'Open',      bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  closed:    { label: 'Closed',    bg: 'bg-slate-800',      text: 'text-slate-400',   border: 'border-slate-700/50' },
  completed: { label: 'Completed', bg: 'bg-violet-500/10',  text: 'text-violet-400',  border: 'border-violet-500/20' },
};

export default function AdminDrives() {
  const [drives, setDrives]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [closing, setClosing] = useState(null);

  useEffect(() => {
    api.get('/admin/drives')
      .then(res => setDrives(res.data.data || []))
      .catch(() => toast.error('Failed to load drives'))
      .finally(() => setLoading(false));
  }, []);

  const handleClose = async (id) => {
    setClosing(id);
    try {
      await api.put(`/drives/${id}`, { status: 'closed' });
      setDrives(prev => prev.map(d => d.id === id ? { ...d, status: 'closed' } : d));
      toast.success('Drive closed');
    } catch { toast.error('Failed to close drive'); }
    finally { setClosing(null); }
  };

  const filtered = drives.filter(d => {
    const matchFilter = filter === 'all' || d.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || d.title?.toLowerCase().includes(q) || d.company_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const openCount       = drives.filter(d => d.status === 'open').length;
  const totalApplicants = drives.reduce((s, d) => s + parseInt(d.applicant_count || 0), 0);

  const exportCSV = () => {
    const rows = [
      ['Title', 'Company', 'CTC (LPA)', 'Min CGPA', 'Deadline', 'Status', 'Applicants'],
      ...filtered.map(d => [d.title, d.company_name, d.ctc_lpa || '', d.min_cgpa, d.application_deadline, d.status, d.applicant_count || 0]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'drives.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported drives list');
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Drives</h1>
            <p className="text-slate-400 text-sm mt-0.5">Monitor every placement drive across all companies</p>
          </div>
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700/50 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total drives',     value: drives.length,   color: 'text-white',       bg: 'bg-slate-800/60',  border: 'border-slate-700/50' },
            { label: 'Currently open',   value: openCount,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Total applicants', value: totalApplicants, color: 'text-violet-400',  bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-5 text-center`}>
              <p className={`text-3xl font-bold ${color}`}>{loading ? '—' : value}</p>
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
          <div className="flex gap-2 flex-wrap">
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
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <p className="text-slate-500 text-sm">No drives found</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Drive</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CTC</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Min CGPA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicants</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map(drive => {
                  const st  = STATUS[drive.status] || STATUS.closed;
                  const daysLeft = Math.ceil((new Date(drive.application_deadline) - new Date()) / 86400000);
                  return (
                    <tr key={drive.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{drive.title}</p>
                        {drive.status === 'open' && daysLeft >= 0 && (
                          <p className={`text-xs mt-0.5 ${daysLeft <= 3 ? 'text-red-400' : 'text-slate-500'}`}>
                            {daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-slate-300 truncate max-w-[140px]">{drive.company_name}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-emerald-400">
                          {drive.ctc_lpa ? `${drive.ctc_lpa} LPA` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-300">{drive.min_cgpa}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm text-slate-400">
                          {new Date(drive.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-slate-300">{drive.applicant_count || 0}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${st.bg} ${st.text} ${st.border}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {drive.status === 'open' && (
                          <button onClick={() => handleClose(drive.id)}
                            disabled={closing === drive.id}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-all disabled:opacity-50">
                            {closing === drive.id ? '...' : 'Close'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}