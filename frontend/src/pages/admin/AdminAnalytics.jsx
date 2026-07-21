import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from 'recharts';

const COLORS = ['#0ea5e9','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#a78bfa','#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs shadow-xl shadow-black/30">
      {label && <p className="text-slate-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: <span className="text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-5">
    <h2 className="text-base font-semibold text-white">{title}</h2>
    {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
  </div>
);

export default function AdminAnalytics() {
  const [stats, setStats]       = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/analytics')])
      .then(([statsRes, analyticsRes]) => {
        setStats(statsRes.data.data);
        setAnalytics(analyticsRes.data.data);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  const branchData  = analytics?.placements_by_branch || [];
  const skillsData  = analytics?.top_skills || [];
  const monthlyData = analytics?.monthly_drives || [];
  const studentDist = analytics?.students_by_branch || [];

  const placementRate = stats
    ? stats.students > 0 ? Math.round((stats.placements / stats.students) * 100) : 0
    : 0;

  if (loading) return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-72 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-0.5">Platform-wide placement statistics and insights</p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total students',   value: stats?.students          ?? '—', sub: 'registered',      color: 'text-white',       icon: '🎓', bg: 'bg-slate-800/80',   border: 'border-slate-700/50' },
            { label: 'Companies',        value: stats?.companies         ?? '—', sub: 'approved',        color: 'text-sky-400',     icon: '🏢', bg: 'bg-sky-500/10',     border: 'border-sky-500/20' },
            { label: 'Open drives',      value: stats?.drives            ?? '—', sub: 'active now',      color: 'text-violet-400',  icon: '📋', bg: 'bg-violet-500/10',  border: 'border-violet-500/20' },
            { label: 'Placed students',  value: stats?.placements        ?? '—', sub: 'confirmed offers',color: 'text-emerald-400', icon: '✅', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Placement rate',   value: `${placementRate}%`,     sub: 'of total students',      color: 'text-amber-400',   icon: '📈', bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
          ].map(({ label, value, sub, color, icon, bg, border }) => (
            <div key={label} className={`${bg} border ${border} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Pending companies alert */}
        {stats?.pending_companies > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
            <span className="text-amber-400 text-lg">⚠️</span>
            <p className="text-sm text-amber-300 font-medium">
              {stats.pending_companies} {stats.pending_companies === 1 ? 'company' : 'companies'} pending approval
            </p>
            <a href="/admin/companies" className="ml-auto text-xs text-amber-400 hover:text-amber-300 underline">Review →</a>
          </div>
        )}

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Placements by branch */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <SectionHeader title="Placements by branch" subtitle="Confirmed placements per engineering branch" />
            {branchData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl opacity-20">📊</span>
                <p className="text-slate-600 text-sm">No placement data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={branchData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
                  <XAxis dataKey="branch" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="placed_count" name="Placements" fill="#10b981" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Student distribution pie */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <SectionHeader title="Student distribution" subtitle="Students registered per branch" />
            {studentDist.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl opacity-20">🥧</span>
                <p className="text-slate-600 text-sm">No student data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={studentDist} dataKey="count" nameKey="branch"
                    cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                    {studentDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(v) => <span className="text-xs text-slate-400">{v}</span>} iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Monthly activity */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <SectionHeader title="Drive activity" subtitle="Number of drives posted per month" />
            {monthlyData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl opacity-20">📅</span>
                <p className="text-slate-600 text-sm">No monthly data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <defs>
                    <linearGradient id="driveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="drives_count" name="Drives" stroke="#8b5cf6"
                    strokeWidth={2} fill="url(#driveGrad)" dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top skills */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <SectionHeader title="Most in-demand skills" subtitle="Based on required_skills across all drives" />
            {skillsData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center gap-2">
                <span className="text-4xl opacity-20">💡</span>
                <p className="text-slate-600 text-sm">Post drives to see skill demand</p>
              </div>
            ) : (
              <div className="space-y-3">
                {skillsData.slice(0, 8).map((skill, i) => {
                  const max = skillsData[0]?.demand_count || 1;
                  const pct = Math.round((skill.demand_count / max) * 100);
                  return (
                    <div key={skill.name} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-4 shrink-0 text-right font-mono">{i + 1}</span>
                      <span className="text-xs text-slate-300 w-28 shrink-0 truncate font-medium">{skill.name}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                      <span className="text-xs font-semibold w-6 text-right shrink-0"
                        style={{ color: COLORS[i % COLORS.length] }}>
                        {skill.demand_count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}