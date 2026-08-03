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
  const [drives, setDrives]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('all');
  const [actionId, setActionId]         = useState(null);
  const [instrDrive, setInstrDrive]     = useState(null); // drive being edited for instructions
  const [instrText, setInstrText]       = useState('');
  const [savingInstr, setSavingInstr]   = useState(false);

  useEffect(() => {
    api.get('/admin/drives')
      .then(res => setDrives(res.data.data || []))
      .catch(() => toast.error('Failed to load drives'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    setActionId(id);
    try {
      await api.put(`/admin/drives/${id}`, { status });
      setDrives(prev => prev.map(d => d.id === id ? { ...d, status } : d));
      toast.success(`Drive ${status}`);
    } catch { toast.error('Failed to update drive'); }
    finally { setActionId(null); }
  };

  const openInstructions = (drive) => {
    setInstrDrive(drive);
    setInstrText(drive.tpo_instructions || '');
  };

  const saveInstructions = async () => {
    if (!instrDrive) return;
    setSavingInstr(true);
    try {
      await api.put(`/admin/drives/${instrDrive.id}/instructions`, {
        tpo_instructions: instrText,
      });
      setDrives(prev => prev.map(d =>
        d.id === instrDrive.id ? { ...d, tpo_instructions: instrText } : d
      ));
      toast.success('TPO instructions saved');
      setInstrDrive(null);
    } catch { toast.error('Failed to save instructions'); }
    finally { setSavingInstr(false); }
  };

  const filtered = drives.filter(d => {
    const matchFilter = filter === 'all' || d.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || d.title?.toLowerCase().includes(q) ||
      d.company_name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const openCount       = drives.filter(d => d.status === 'open').length;
  const totalApplicants = drives.reduce((s, d) => s + parseInt(d.applicant_count || 0), 0);
  const totalSelected   = drives.reduce((s, d) => s + parseInt(d.selected_count  || 0), 0);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">All Drives</h1>
          <p className="text-slate-400 text-sm mt-0.5">Monitor and manage every placement drive</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total drives',     value: drives.length,   color: 'text-white',       bg: 'bg-slate-800/60',   border: 'border-slate-700/50' },
            { label: 'Currently open',   value: openCount,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Total applicants', value: totalApplicants, color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
            { label: 'Students placed',  value: totalSelected,   color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
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
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-900 rounded-xl animate-pulse" />)}
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicants</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">TPO Note</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map(drive => {
                  const st       = STATUS[drive.status] || STATUS.closed;
                  const daysLeft = Math.ceil((new Date(drive.application_deadline) - new Date()) / 86400000);
                  return (
                    <tr key={drive.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-slate-200 truncate max-w-[180px]">{drive.title}</p>
                        {drive.status === 'open' && daysLeft >= 0 && (
                          <p className={`text-xs mt-0.5 ${daysLeft <= 3 ? 'text-red-400' : 'text-slate-500'}`}>
                            {daysLeft === 0 ? 'Closes today' : `${daysLeft}d left`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-slate-300 truncate max-w-[120px]">{drive.company_name}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-emerald-400">
                          {drive.ctc_lpa ? `${drive.ctc_lpa} LPA` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-slate-300">{drive.applicant_count || 0}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-sm font-semibold ${parseInt(drive.selected_count) > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {drive.selected_count || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-lg border ${st.bg} ${st.text} ${st.border}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {drive.tpo_instructions ? (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Added
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* TPO Instructions */}
                          <button onClick={() => openInstructions(drive)}
                            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium rounded-lg border border-amber-500/20 transition-all"
                            title="Add TPO Instructions">
                            📋
                          </button>
                          {/* Close / Reopen */}
                          {drive.status === 'open' && (
                            <button onClick={() => handleStatusChange(drive.id, 'closed')}
                              disabled={actionId === drive.id}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-all disabled:opacity-50">
                              {actionId === drive.id ? '...' : 'Close'}
                            </button>
                          )}
                          {drive.status === 'closed' && (
                            <button onClick={() => handleStatusChange(drive.id, 'open')}
                              disabled={actionId === drive.id}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/20 transition-all disabled:opacity-50">
                              Reopen
                            </button>
                          )}
                          {drive.status === 'open' && (
                            <button onClick={() => handleStatusChange(drive.id, 'completed')}
                              disabled={actionId === drive.id}
                              className="px-2.5 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs font-medium rounded-lg border border-violet-500/20 transition-all disabled:opacity-50">
                              Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TPO Instructions Modal */}
        {instrDrive && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">TPO Instructions</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{instrDrive.title} · {instrDrive.company_name}</p>
                </div>
                <button onClick={() => setInstrDrive(null)}
                  className="text-slate-500 hover:text-slate-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-3">
                These instructions will be shown to students on the drive detail page and included in selection emails.
              </p>

              <textarea
                value={instrText}
                onChange={e => setInstrText(e.target.value)}
                rows={6}
                placeholder="e.g. Please bring your college ID, 2 passport size photos, and all mark sheets. Report at 9:00 AM sharp to the placement hall. Dress code: formal attire..."
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none resize-none"
              />

              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={() => setInstrDrive(null)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 bg-slate-800 rounded-xl border border-slate-700/50 transition-all">
                  Cancel
                </button>
                <button onClick={saveInstructions} disabled={savingInstr}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-semibold rounded-xl border border-amber-500/30 transition-all disabled:opacity-50">
                  {savingInstr
                    ? <><div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />Saving...</>
                    : '💾 Save Instructions'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}