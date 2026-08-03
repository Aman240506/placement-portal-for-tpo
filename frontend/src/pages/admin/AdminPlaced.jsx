import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function AdminPlaced() {
  const [placed, setPlaced]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [emailModal, setEmailModal] = useState(null);
  const [emailMsg, setEmailMsg]     = useState('');
  const [sending, setSending]       = useState(false);

  useEffect(() => {
    api.get('/admin/placed-students')
      .then(res => setPlaced(res.data.data || []))
      .catch(() => toast.error('Failed to load placed students'))
      .finally(() => setLoading(false));
  }, []);

  const handleSendEmail = async () => {
    if (!emailModal) return;
    setSending(true);
    try {
      const res = await api.post('/admin/send-selection-email', {
        student_id:     emailModal.id,
        drive_id:       emailModal.drive_id,
        custom_message: emailMsg,
      });
      if (res.data.data?.preview) {
        toast.success('Email preview generated (configure SMTP to actually send)');
      } else {
        toast.success(`Email sent to ${emailModal.email}`);
      }
      setEmailModal(null);
      setEmailMsg('');
    } catch { toast.error('Failed to send email'); }
    finally { setSending(false); }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Email', 'Branch', 'CGPA', 'Company', 'Role', 'CTC (LPA)'],
      ...placed.map(p => [p.full_name, p.email, p.branch, p.cgpa, p.company_name, p.drive_title, p.ctc_lpa || '']),
    ];
    const csv  = rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'placed_students.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported placed students list');
  };

  const filtered = placed.filter(p => {
    const q = search.toLowerCase();
    return !q || p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) || p.company_name?.toLowerCase().includes(q);
  });

  // Group by company for display
  const companies = [...new Set(placed.map(p => p.company_name))];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Placed Students</h1>
            <p className="text-slate-400 text-sm mt-0.5">Students who have been selected in placement drives</p>
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
            { label: 'Total placed',      value: placed.length,   color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Companies hiring',  value: companies.length, color: 'text-sky-400',     bg: 'bg-sky-500/10',    border: 'border-sky-500/20' },
            { label: 'Avg CTC (LPA)',     color: 'text-violet-400', bg: 'bg-violet-500/10',  border: 'border-violet-500/20',
              value: placed.length
                ? (placed.filter(p => p.ctc_lpa).reduce((s, p) => s + parseFloat(p.ctc_lpa), 0) / (placed.filter(p => p.ctc_lpa).length || 1)).toFixed(1)
                : '—' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-5 text-center`}>
              <p className={`text-3xl font-bold ${color}`}>{loading ? '—' : value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search student or company..."
            className="profile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <span className="text-5xl">🎓</span>
            <p className="text-slate-500 text-sm mt-4">No placed students yet</p>
            <p className="text-slate-600 text-xs mt-1">Students will appear here when recruiters mark them as selected</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch / CGPA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">CTC</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Match</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {p.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{p.full_name}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-300">{p.branch}</p>
                      <p className="text-xs text-slate-500">CGPA {p.cgpa}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-slate-200">{p.company_name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-slate-400">{p.drive_title}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-emerald-400">
                        {p.ctc_lpa ? `${p.ctc_lpa} LPA` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.match_score ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                              style={{ width: `${p.match_score}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{p.match_score}%</span>
                        </div>
                      ) : <span className="text-xs text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => setEmailModal({ ...p, drive_id: p.drive_id || p.id })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-medium rounded-lg border border-sky-500/20 transition-all">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Email Modal */}
        {emailModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Send Selection Email</h3>
                  <p className="text-xs text-slate-500 mt-0.5">To: {emailModal.email}</p>
                </div>
                <button onClick={() => setEmailModal(null)}
                  className="text-slate-500 hover:text-slate-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-slate-800/60 rounded-xl p-4 mb-4 text-xs text-slate-400 space-y-1">
                <p>📧 Will be sent to: <span className="text-white">{emailModal.email}</span></p>
                <p>🏢 Company: <span className="text-white">{emailModal.company_name}</span></p>
                <p>💼 Role: <span className="text-white">{emailModal.drive_title}</span></p>
                {emailModal.ctc_lpa && <p>💰 Package: <span className="text-emerald-400">{emailModal.ctc_lpa} LPA</span></p>}
              </div>

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional message from TPO <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={emailMsg}
                onChange={e => setEmailMsg(e.target.value)}
                rows={4}
                placeholder="e.g. Please report to HR department on Monday 9 AM with your documents..."
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none resize-none"
              />

              <p className="text-xs text-slate-600 mt-2">
                {!import.meta.env.VITE_SMTP_EMAIL
                  ? '⚠️ Add SMTP_EMAIL and SMTP_PASSWORD to .env to actually send emails'
                  : '✅ SMTP configured — email will be sent'}
              </p>

              <div className="flex gap-3 mt-4 justify-end">
                <button onClick={() => setEmailModal(null)}
                  className="px-4 py-2 text-sm text-slate-400 bg-slate-800 rounded-xl border border-slate-700/50 transition-all">
                  Cancel
                </button>
                <button onClick={handleSendEmail} disabled={sending}
                  className="flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                  {sending
                    ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                    : '📧 Send Email'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}