import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterBranch, setFilterBranch] = useState('all');

  useEffect(() => {
    api.get('/admin/students')
      .then(res => setStudents(res.data.data || []))
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (q) => {
    setSearch(q);
    try {
      const res = await api.get(`/admin/students?search=${q}`);
      setStudents(res.data.data || []);
    } catch { /* silent */ }
  };

  const branches = [...new Set(students.map(s => s.branch).filter(Boolean))];

  const filtered = filterBranch === 'all'
    ? students
    : students.filter(s => s.branch === filterBranch);

  const cgpaColor = (cgpa) => {
    if (!cgpa) return 'text-slate-500';
    if (cgpa >= 8.5) return 'text-emerald-400';
    if (cgpa >= 7.0) return 'text-sky-400';
    if (cgpa >= 6.0) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-slate-400 text-sm mt-1">All registered students on the platform</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total students', value: students.length, color: 'text-white' },
            { label: 'Avg CGPA', color: 'text-sky-400',
              value: students.length
                ? (students.reduce((s, st) => s + parseFloat(st.cgpa || 0), 0) / students.length).toFixed(2)
                : '—' },
            { label: 'Branches represented', value: branches.length, color: 'text-emerald-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
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
            <input value={search} onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name or branch..."
              className="profile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
          </div>
          {branches.length > 0 && (
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
              className="profile-input px-4 py-2.5 rounded-xl text-sm text-white outline-none">
              <option value="all">All branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-900 rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-slate-500 text-sm">No students found</p>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-800/60 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-4">Student</div>
              <div className="col-span-2">Roll no.</div>
              <div className="col-span-2">Branch / Year</div>
              <div className="col-span-1">CGPA</div>
              <div className="col-span-1">Backlogs</div>
              <div className="col-span-2">Links</div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {filtered.map(student => (
                <div key={student.id}
                  className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-slate-800/30 transition-colors">

                  {/* Student info */}
                  <div className="col-span-4 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {student.full_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{student.full_name || '—'}</p>
                      <p className="text-xs text-slate-500 truncate">{student.email}</p>
                    </div>
                  </div>

                  {/* Roll number */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-300 font-mono">{student.roll_number || '—'}</p>
                  </div>

                  {/* Branch / Year */}
                  <div className="col-span-2">
                    <p className="text-sm text-slate-300">{student.branch || '—'}</p>
                    <p className="text-xs text-slate-500">Year {student.year || '—'}</p>
                  </div>

                  {/* CGPA */}
                  <div className="col-span-1">
                    <span className={`text-sm font-semibold ${cgpaColor(student.cgpa)}`}>
                      {student.cgpa || '—'}
                    </span>
                  </div>

                  {/* Backlogs */}
                  <div className="col-span-1">
                    <span className={`text-sm font-medium ${student.backlogs > 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {student.backlogs ?? 0}
                    </span>
                  </div>

                  {/* Links */}
                  <div className="col-span-2 flex items-center gap-2">
                    {student.linkedin_url && (
                      <a href={student.linkedin_url} target="_blank" rel="noreferrer"
                        className="text-slate-500 hover:text-sky-400 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    {student.github_url && (
                      <a href={student.github_url} target="_blank" rel="noreferrer"
                        className="text-slate-500 hover:text-slate-200 transition-colors">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    )}
                    {!student.linkedin_url && !student.github_url && (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}