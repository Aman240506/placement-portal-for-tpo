import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    api.get('/admin/companies')
      .then(res => setCompanies(res.data.data || []))
      .catch(() => toast.error('Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id + '-approve');
    try {
      await api.put(`/admin/companies/${id}/approve`);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_approved: true } : c));
      toast.success('Company approved — they can now post drives');
    } catch { toast.error('Failed to approve'); }
    finally { setActionLoading(null); }
  };

  const handleReject = async (id) => {
    setActionLoading(id + '-reject');
    try {
      await api.put(`/admin/companies/${id}/reject`);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_approved: false, is_rejected: true } : c));
      toast.success('Company rejected');
    } catch { toast.error('Failed to reject'); }
    finally { setActionLoading(null); }
  };

  const pendingCount  = companies.filter(c => !c.is_approved && !c.is_rejected).length;
  const approvedCount = companies.filter(c => c.is_approved).length;
  const rejectedCount = companies.filter(c => c.is_rejected && !c.is_approved).length;

  const filtered = companies.filter(c => {
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'pending'  ? (!c.is_approved && !c.is_rejected) :
      filter === 'approved' ? c.is_approved :
      filter === 'rejected' ? (c.is_rejected && !c.is_approved) : true;
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-slate-400 text-sm mt-0.5">Review and approve company registrations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Pending approval', value: pendingCount,  bg: pendingCount > 0 ? 'bg-amber-500/10' : 'bg-slate-800/60', border: pendingCount > 0 ? 'border-amber-500/20' : 'border-slate-700/50', color: pendingCount > 0 ? 'text-amber-400' : 'text-slate-400' },
            { label: 'Approved',         value: approvedCount, bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', color: 'text-emerald-400' },
            { label: 'Total companies',  value: companies.length, bg: 'bg-slate-800/60', border: 'border-slate-700/50', color: 'text-white' },
          ].map(({ label, value, bg, border, color }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-5 text-center`}>
              <p className={`text-3xl font-bold ${color}`}>{loading ? '—' : value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pending alert */}
        {pendingCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-300">
                {pendingCount} {pendingCount === 1 ? 'company needs' : 'companies need'} your approval
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Companies cannot post drives until approved by TPO</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search company name..."
              className="profile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all',      label: `All (${companies.length})` },
              { key: 'pending',  label: `Pending (${pendingCount})` },
              { key: 'approved', label: `Approved (${approvedCount})` },
              { key: 'rejected', label: `Rejected (${rejectedCount})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${filter === f.key
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Companies */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-slate-500 text-sm">No companies found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(company => {
              const isPending  = !company.is_approved && !company.is_rejected;
              const isApproved = company.is_approved;
              const isRejected = company.is_rejected && !company.is_approved;

              return (
                <div key={company.id}
                  className={`bg-slate-900 rounded-2xl p-5 border transition-all
                    ${isPending ? 'border-amber-500/20 shadow-sm shadow-amber-500/5' : 'border-slate-800/60'}`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold border
                        ${isApproved ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                          isPending  ? 'bg-amber-500/10  border-amber-500/20  text-amber-400'  :
                                       'bg-slate-800     border-slate-700/50   text-slate-500'}`}>
                        {company.name?.[0]?.toUpperCase() || 'C'}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-white">{company.name}</h3>
                          {isApproved && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                              Approved
                            </span>
                          )}
                          {isPending && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Pending review
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                              Rejected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {company.domain && <p className="text-xs text-slate-500">{company.domain}</p>}
                          {company.website && (
                            <a href={company.website} target="_blank" rel="noreferrer"
                              className="text-xs text-sky-400 hover:text-sky-300 transition-colors">{company.website}</a>
                          )}
                          <p className="text-xs text-slate-600">
                            Registered {new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <>
                          <button onClick={() => handleApprove(company.id)}
                            disabled={actionLoading === company.id + '-approve'}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-xl border border-emerald-500/20 transition-all disabled:opacity-50">
                            {actionLoading === company.id + '-approve'
                              ? <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                            Approve
                          </button>
                          <button onClick={() => handleReject(company.id)}
                            disabled={actionLoading === company.id + '-reject'}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl border border-red-500/20 transition-all disabled:opacity-50">
                            {actionLoading === company.id + '-reject'
                              ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>}
                            Reject
                          </button>
                        </>
                      )}
                      {isApproved && (
                        <button onClick={() => handleReject(company.id)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-red-400 bg-slate-800 hover:bg-red-500/10 rounded-lg border border-slate-700/50 hover:border-red-500/20 transition-all">
                          Revoke
                        </button>
                      )}
                      {isRejected && (
                        <button onClick={() => handleApprove(company.id)}
                          className="px-3 py-1.5 text-xs text-slate-500 hover:text-emerald-400 bg-slate-800 hover:bg-emerald-500/10 rounded-lg border border-slate-700/50 hover:border-emerald-500/20 transition-all">
                          Re-approve
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
    </AdminLayout>
  );
}
