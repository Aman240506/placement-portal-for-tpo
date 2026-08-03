import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import api from '../../services/auth.service';

const COLORS = ['#0ea5e9','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#a78bfa','#34d399'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="font-semibold" style={{ color: p.color || p.fill }}>
          {p.name}: <span className="text-white">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color, bg, border }) => (
  <div className={`${bg} border ${border} rounded-2xl p-5`}>
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-sm font-medium text-slate-300 mt-1">{label}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

export default function PublicStats() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [drives, setDrives]   = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/public/stats'),
      api.get('/public/drives'),
    ]).then(([statsRes, drivesRes]) => {
      setStats(statsRes.data.data);
      setDrives(drivesRes.data.data || []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading placement stats...</p>
      </div>
    </div>
  );

  const s = stats?.summary || {};

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Grid overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-white text-sm">PlacePortal</p>
              <p className="text-xs text-slate-500">Campus Placement Statistics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Sign in
            </Link>
            <Link to="/register"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-xl transition-colors">
              Register
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 space-y-12">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs text-sky-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Live placement data · Updated in real-time
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white">
            Campus Placement
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
              Statistics 2025
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Real-time placement data — student achievements, top recruiters, and branch-wise breakdown.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🎓" label="Total Students"    value={s.total_students    ?? '—'} sub="registered"            color="text-white"       bg="bg-slate-800/60"   border="border-slate-700/50" />
          <StatCard icon="✅" label="Students Placed"   value={s.total_placed      ?? '—'} sub={`${s.placement_rate ?? 0}% placement rate`}       color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" />
          <StatCard icon="🏢" label="Companies Visited" value={s.total_companies   ?? '—'} sub="approved & active"    color="text-sky-400"     bg="bg-sky-500/10"     border="border-sky-500/20" />
          <StatCard icon="💰" label="Average CTC"       value={s.avg_ctc ? `${s.avg_ctc} LPA` : '—'} sub={s.highest_ctc ? `Highest: ${s.highest_ctc} LPA` : ''} color="text-violet-400" bg="bg-violet-500/10" border="border-violet-500/20" />
        </div>

        {/* Placement rate hero bar */}
        {s.placement_rate > 0 && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Overall Placement Rate</h2>
                <p className="text-slate-400 text-sm">{s.total_placed} out of {s.total_students} students placed</p>
              </div>
              <span className="text-4xl font-bold text-emerald-400">{s.placement_rate}%</span>
            </div>
            <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                style={{ width: `${s.placement_rate}%` }}
              />
            </div>
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Branch-wise stats */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Branch-wise Placements</h2>
            <p className="text-xs text-slate-500 mb-4">Students placed per engineering branch</p>
            {(stats?.branch_stats || []).length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.branch_stats} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
                  <XAxis dataKey="branch" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="placed_students" name="Placed" fill="#10b981" radius={[4,4,0,0]} />
                  <Bar dataKey="total_students"  name="Total"  fill="#334155" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly trend */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Placement Trend</h2>
            <p className="text-xs text-slate-500 mb-4">Monthly placement activity</p>
            {(stats?.monthly_trend || []).length === 0 ? (
              <div className="h-52 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.monthly_trend} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="placements" name="Placements" stroke="#0ea5e9"
                    strokeWidth={2} fill="url(#grad)" dot={{ fill: '#0ea5e9', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top companies */}
        {(stats?.top_companies || []).length > 0 && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Top Hiring Companies</h2>
            <p className="text-xs text-slate-500 mb-5">Companies with most placements this year</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.top_companies.map((c, i) => (
                <div key={c.name}
                  className="flex items-center gap-3 p-4 bg-slate-800/50 border border-slate-700/40 rounded-xl hover:border-slate-600/60 transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
                    style={{ background: `${COLORS[i % COLORS.length]}20`, color: COLORS[i % COLORS.length] }}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.hired_count} hired</p>
                    {c.max_ctc && <p className="text-xs text-emerald-400">↑ {c.max_ctc} LPA</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent placements ticker */}
        {(stats?.recent_placements || []).length > 0 && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-1">Recent Placements</h2>
            <p className="text-xs text-slate-500 mb-4">Latest students who got placed</p>
            <div className="space-y-2">
              {stats.recent_placements.map((p, i) => (
                <div key={i}
                  className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{p.full_name}</p>
                      <p className="text-xs text-slate-500">{p.branch} · {p.role}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-200">{p.company_name}</p>
                    {p.ctc_lpa && <p className="text-xs text-emerald-400">{p.ctc_lpa} LPA</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Open drives CTA */}
        {drives.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Open Placement Drives</h2>
                <p className="text-xs text-slate-500 mt-0.5">Register to apply for these opportunities</p>
              </div>
              <Link to="/register"
                className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                Register to apply →
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {drives.slice(0, 6).map(drive => {
                const daysLeft = Math.ceil((new Date(drive.application_deadline) - new Date()) / 86400000);
                return (
                  <div key={drive.id}
                    className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 hover:border-slate-700/80 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{drive.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{drive.company_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {drive.ctc_lpa && <span className="text-xs text-emerald-400">{drive.ctc_lpa} LPA</span>}
                          <span className="text-xs text-slate-500">Min CGPA {drive.min_cgpa}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${daysLeft <= 3 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {daysLeft}d left
                        </span>
                        <div className="mt-2">
                          <Link to="/register"
                            className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                            Apply →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-800/60 pt-8 text-center">
          <p className="text-slate-600 text-sm">
            Powered by <span className="text-slate-400 font-medium">PlacePortal</span> · AI-powered campus placement management
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/login"    className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign in</Link>
            <Link to="/register" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
}