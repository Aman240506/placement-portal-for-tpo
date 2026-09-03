import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

const cgpaBadge = (cgpa) => {
  if (!cgpa) return 'bg-slate-800 text-slate-500 border-slate-700/50';
  if (cgpa >= 8.5) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (cgpa >= 7.0) return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  if (cgpa >= 6.0) return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  return 'bg-red-500/10 text-red-400 border-red-500/20';
};

export default function AdminStudents() {
  const [students, setStudents]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // all | pending | approved | rejected
  const [sortBy, setSortBy]           = useState('created_at');
  const [selected, setSelected]       = useState(new Set()); // for bulk actions
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null); // student being rejected
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get('/admin/students?limit=200')
      .then(res => setStudents(res.data.data || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id + '-approve');
    try {
      await api.put(`/admin/students/${id}/approve`);
      setStudents(prev => prev.map(s =>
        s.id === id ? { ...s, is_approved: true, rejection_reason: null } : s
      ));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      toast.success('Student approved — they can now access drives');
    } catch { toast.error('Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setActionLoading(rejectModal.id + '-reject');
    try {
      await api.put(`/admin/students/${rejectModal.id}/reject`, { reason: rejectReason });
      setStudents(prev => prev.map(s =>
        s.id === rejectModal.id
          ? { ...s, is_approved: false, rejection_reason: rejectReason || 'Not verified' }
          : s
      ));
      toast.success('Student rejected');
      setRejectModal(null);
      setRejectReason('');
    } catch { toast.error('Failed to reject'); }
    finally { setActionLoading(null); }
  };

  const handleBulkApprove = async () => {
    if (selected.size === 0) return toast.error('Select students first');
    try {
      await api.post('/admin/students/bulk-approve', { student_ids: [...selected] });
      setStudents(prev => prev.map(s =>
        selected.has(s.id) ? { ...s, is_approved: true, rejection_reason: null } : s
      ));
      toast.success(`${selected.size} students approved`);
      setSelected(new Set());
    } catch { toast.error('Bulk approval failed'); }
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const selectAllPending = () => {
    const pendingIds = filtered
      .filter(s => !s.is_approved && !s.rejection_reason)
      .map(s => s.id);
    setSelected(new Set(pendingIds));
  };

  const branches = [...new Set(students.map(s => s.branch).filter(Boolean))].sort();

  const filtered = students
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q || s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) || s.roll_number?.toLowerCase().includes(q);
      const matchBranch = filterBranch === 'all' || s.branch === filterBranch;
      const matchStatus =
        filterStatus === 'all'      ? true :
        filterStatus === 'pending'  ? (!s.is_approved && !s.rejection_reason) :
        filterStatus === 'approved' ? s.is_approved :
        filterStatus === 'rejected' ? (!s.is_approved && !!s.rejection_reason) : true;
      return matchSearch && matchBranch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'cgpa') return (parseFloat(b.cgpa) || 0) - (parseFloat(a.cgpa) || 0);
      if (sortBy === 'name') return (a.full_name || '').localeCompare(b.full_name || '');
      return new Date(b.created_at) - new Date(a.created_at);
    });

  const pendingCount  = students.filter(s => !s.is_approved && !s.rejection_reason).length;
  const approvedCount = students.filter(s => s.is_approved).length;
  const rejectedCount = students.filter(s => !s.is_approved && s.rejection_reason).length;

  const exportCSV = () => {
    const rows = [
      ['Name','Email','Roll No','Branch','Year','CGPA','Status'],
      ...filtered.map(s => [
        s.full_name, s.email, s.roll_number, s.branch, s.year, s.cgpa,
        s.is_approved ? 'Approved' : s.rejection_reason ? 'Rejected' : 'Pending',
      ]),
    ];
    const csv  = rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported students list');
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Students</h1>
            <p className="text-slate-400 text-sm mt-0.5">Manage and verify student registrations</p>
          </div>
          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <button onClick={handleBulkApprove}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl border border-emerald-500/20 transition-all">
                ✓ Approve selected ({selected.size})
              </button>
            )}
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700/50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total students',   value: students.length,  color: 'text-white',       bg: 'bg-slate-800/60',   border: 'border-slate-700/50' },
            { label: 'Pending approval', value: pendingCount,     color: pendingCount > 0 ? 'text-amber-400' : 'text-slate-400', bg: pendingCount > 0 ? 'bg-amber-500/10' : 'bg-slate-800/60', border: pendingCount > 0 ? 'border-amber-500/20' : 'border-slate-700/50' },
            { label: 'Approved',         value: approvedCount,    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Rejected',         value: rejectedCount,    color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-between px-5 py-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm text-amber-300">
                <span className="font-semibold">{pendingCount} student{pendingCount > 1 ? 's' : ''}</span> waiting for TPO verification
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAllPending}
                className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors">
                Select all pending
              </button>
              <span className="text-slate-600">·</span>
              <button onClick={() => setFilterStatus('pending')}
                className="text-xs text-amber-400 hover:text-amber-300 underline transition-colors">
                View pending
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-52">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email or roll number..."
              className="profile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800/60 rounded-xl p-1">
            {[
              { key: 'all',      label: `All (${students.length})` },
              { key: 'pending',  label: `Pending (${pendingCount})` },
              { key: 'approved', label: `Approved (${approvedCount})` },
              { key: 'rejected', label: `Rejected (${rejectedCount})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterStatus === f.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                {f.label}
              </button>
            ))}
          </div>

          <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
            className="profile-input px-3 py-2.5 rounded-xl text-sm text-white outline-none">
            <option value="all">All branches</option>
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="profile-input px-3 py-2.5 rounded-xl text-sm text-white outline-none">
            <option value="created_at">Newest first</option>
            <option value="cgpa">Highest CGPA</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of {students.length} students
        </p>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-900 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <p className="text-slate-500 text-sm">No students match your filters</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox"
                      checked={selected.size === filtered.filter(s => !s.is_approved).length && filtered.filter(s => !s.is_approved).length > 0}
                      onChange={() => {
                        const pendingIds = filtered.filter(s => !s.is_approved).map(s => s.id);
                        setSelected(selected.size === pendingIds.length ? new Set() : new Set(pendingIds));
                      }}
                      className="rounded border-slate-600 bg-slate-800 text-emerald-500 outline-none cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Roll / Branch</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CGPA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map(student => {
                  const isPending  = !student.is_approved && !student.rejection_reason;
                  const isApproved = student.is_approved;
                  const isRejected = !student.is_approved && student.rejection_reason;

                  return (
                    <tr key={student.id}
                      className={`hover:bg-slate-800/30 transition-colors ${selected.has(student.id) ? 'bg-emerald-500/5' : ''}`}>

                      <td className="px-4 py-3.5">
                        {!isApproved && (
                          <input type="checkbox"
                            checked={selected.has(student.id)}
                            onChange={() => toggleSelect(student.id)}
                            className="rounded border-slate-600 bg-slate-800 text-emerald-500 outline-none cursor-pointer"
                          />
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {student.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{student.full_name || '—'}</p>
                            <p className="text-xs text-slate-500 truncate">{student.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="text-sm font-mono text-slate-300">{student.roll_number || '—'}</p>
                        <p className="text-xs text-slate-500">{student.branch || '—'} · Yr {student.year || '—'}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-lg border ${cgpaBadge(student.cgpa)}`}>
                          {student.cgpa || '—'}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {isApproved && (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="flex items-center gap-1.5 text-xs text-amber-400">
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Pending
                          </span>
                        )}
                        {isRejected && (
                          <div>
                            <span className="flex items-center gap-1.5 text-xs text-red-400">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                              Rejected
                            </span>
                            {student.rejection_reason && (
                              <p className="text-xs text-slate-600 mt-0.5 max-w-[150px] truncate" title={student.rejection_reason}>
                                {student.rejection_reason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {!isApproved && (
                            <button
                              onClick={() => handleApprove(student.id)}
                              disabled={actionLoading === student.id + '-approve'}
                              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 transition-all disabled:opacity-50">
                              {actionLoading === student.id + '-approve'
                                ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                : '✓'} Approve
                            </button>
                          )}
                          {!isRejected && (
                            <button
                              onClick={() => { setRejectModal(student); setRejectReason(''); }}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-all">
                              Reject
                            </button>
                          )}
                          {isRejected && (
                            <button onClick={() => handleApprove(student.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium rounded-lg border border-slate-700/50 transition-all">
                              Re-approve
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

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-base font-semibold text-white mb-1">Reject Student</h3>
              <p className="text-xs text-slate-500 mb-4">
                {rejectModal.full_name} · {rejectModal.email}
              </p>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason for rejection <span className="text-slate-500 font-normal">(shown to student)</span>
              </label>

              {/* Quick reasons */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  'Not a registered student of this college',
                  'Duplicate account detected',
                  'Incorrect roll number or branch',
                  'Graduation year mismatch',
                ].map(r => (
                  <button key={r} onClick={() => setRejectReason(r)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all
                      ${rejectReason === r
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:text-slate-200'}`}>
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Or type a custom reason..."
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none resize-none"
              />

              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={() => setRejectModal(null)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 rounded-xl border border-slate-700/50">
                  Cancel
                </button>
                <button onClick={handleReject}
                  disabled={actionLoading === rejectModal.id + '-reject'}
                  className="flex items-center gap-2 px-5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-all disabled:opacity-50">
                  {actionLoading === rejectModal.id + '-reject'
                    ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : null}
                  Reject Student
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
