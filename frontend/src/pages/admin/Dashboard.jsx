import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-start gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, companies: 0, drives: 0, placements: 0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats').catch(() => ({ data: { data: {} } })),
      api.get('/admin/students?limit=5').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, studentsRes]) => {
      setStats(statsRes.data.data || {});
      setRecentStudents(studentsRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform overview and management</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Students" value={stats.students || 0} color="bg-sky-500/10"
            icon={<svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /></svg>} />
          <StatCard label="Companies" value={stats.companies || 0} sub={`${stats.pending_companies || 0} pending`} color="bg-violet-500/10"
            icon={<svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} />
          <StatCard label="Active Drives" value={stats.drives || 0} color="bg-amber-500/10"
            icon={<svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
          <StatCard label="Placements" value={stats.placements || 0} sub="confirmed" color="bg-emerald-500/10"
            icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
        </div>

        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Students</h2>
            <a href="/admin/students" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">View all →</a>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />)}</div>
          ) : recentStudents.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No students registered yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-medium text-slate-500 pb-3">Name</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3">Branch</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3">CGPA</th>
                    <th className="text-left text-xs font-medium text-slate-500 pb-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map(s => (
                    <tr key={s.id} className="border-b border-slate-800/40">
                      <td className="py-3 text-sm text-slate-200">{s.full_name}</td>
                      <td className="py-3 text-sm text-slate-400">{s.branch}</td>
                      <td className="py-3 text-sm text-slate-400">{s.cgpa}</td>
                      <td className="py-3 text-xs text-slate-500">{new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
