import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function AdminCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all'); // all | pending | approved

  useEffect(() => {
    api.get('/admin/companies')
      .then(res => setCompanies(res.data.data || []))
      .catch(() => toast.error('Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/companies/${id}/approve`);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_approved: true } : c));
      toast.success('Company approved');
    } catch {
      toast.error('Failed to approve company');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/admin/companies/${id}/reject`);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_approved: false, is_rejected: true } : c));
      toast.success('Company rejected');
    } catch {
      toast.error('Failed to reject company');
    }
  };

  const filtered = companies.filter(c => {
    if (filter === 'pending')  return !c.is_approved && !c.is_rejected;
    if (filter === 'approved') return c.is_approved;
    return true;
  });

  const pendingCount  = companies.filter(c => !c.is_approved && !c.is_rejected).length;
  const approvedCount = companies.filter(c => c.is_approved).length;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Companies</h1>
          <p className="text-slate-400 text-sm mt-1">Approve or reject company registrations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total companies', value: companies.length,  color: 'text-white' },
            { label: 'Approved',        value: approvedCount,     color: 'text-emerald-400' },
            { label: 'Pending approval',value: pendingCount,      color: pendingCount > 0 ? 'text-amber-400' : 'text-slate-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Pending alert banner */}
        {pendingCount > 0 && (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-amber-300">
              <span className="font-semibold">{pendingCount} {pendingCount === 1 ? 'company' : 'companies'}</span> waiting for approval
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all',      label: `All (${companies.length})` },
            { key: 'pending',  label: `Pending (${pendingCount})` },
            { key: 'approved', label: `Approved (${approvedCount})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${filter === f.key
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Companies list */}
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

              return (
                <div key={company.id}
                  className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Company avatar */}
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
                      <span className="text-lg font-bold text-slate-300">
                        {company.name?.[0]?.toUpperCase() || 'C'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="text-base font-semibold text-white">{company.name}</h3>
                        {isApproved && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Approved
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending
                          </span>
                        )}
                        {company.is_rejected && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                            Rejected
                          </span>
                        )}
                      </div>
                      {company.domain && (
                        <p className="text-xs text-slate-500">{company.domain}</p>
                      )}
                      {company.website && (
                        <a href={company.website} target="_blank" rel="noreferrer"
                          className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                          {company.website}
                        </a>
                      )}
                      <p className="text-xs text-slate-600 mt-1">
                        Registered {new Date(company.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isPending && (
                      <>
                        <button onClick={() => handleApprove(company.id)}
                          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium rounded-xl border border-emerald-500/20 transition-all">
                          Approve
                        </button>
                        <button onClick={() => handleReject(company.id)}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-xl border border-red-500/20 transition-all">
                          Reject
                        </button>
                      </>
                    )}
                    {isApproved && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Active
                      </span>
                    )}
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