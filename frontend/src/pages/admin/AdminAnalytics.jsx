import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700/60 rounded-xl px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-slate-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const [stats, setStats]         = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/analytics'),
        ]);
        setStats(statsRes.data.data);
        setAnalytics(analyticsRes.data.data);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </AdminLayout>
  );

  const branchData   = analytics?.placements_by_branch || [];
  const skillsData   = analytics?.top_skills || [];
  const monthlyData  = analytics?.monthly_drives || [];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide placement statistics</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total students',   value: stats?.students          ?? '—', color: 'text-white' },
            { label: 'Companies',        value: stats?.companies         ?? '—', color: 'text-sky-400' },
            { label: 'Open drives',      value: stats?.drives            ?? '—', color: 'text-violet-400' },
            { label: 'Placements',       value: stats?.placements        ?? '—', color: 'text-emerald-400' },
            { label: 'Pending approval', value: stats?.pending_companies ?? '—', color: stats?.pending_companies > 0 ? 'text-amber-400' : 'text-slate-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Placements by branch */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Placements by branch</h2>
            {branchData.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No placement data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={branchData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
                  <XAxis dataKey="branch" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="placed_count" name="Placements" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top demanded skills */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Most in-demand skills</h2>
            {skillsData.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No drive data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {skillsData.slice(0, 8).map((skill, i) => {
                  const max = skillsData[0]?.demand_count || 1;
                  const pct = Math.round((skill.demand_count / max) * 100);
                  return (
                    <div key={skill.name} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-4 shrink-0">{i + 1}</span>
                      <span className="text-sm text-slate-300 w-24 shrink-0 truncate">{skill.name}</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-6 text-right shrink-0">{skill.demand_count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Monthly drive activity */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Drive activity (monthly)</h2>
            {monthlyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="drives_count" name="Drives" stroke="#8b5cf6"
                    strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Branch distribution pie */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4">Student distribution by branch</h2>
            {analytics?.students_by_branch?.length === 0 || !analytics?.students_by_branch ? (
              <div className="h-48 flex items-center justify-center">
                <p className="text-slate-600 text-sm">No student data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={analytics.students_by_branch}
                    dataKey="count"
                    nameKey="branch"
                    cx="50%" cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={3}
                  >
                    {analytics.students_by_branch.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}
                    iconType="circle" iconSize={8}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}