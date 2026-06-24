import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/auth.service';

const StatusBadge = ({ deadline }) => {
  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (daysLeft < 0) return <span className="px-2 py-0.5 text-xs rounded-md bg-slate-800 text-slate-500">Closed</span>;
  if (daysLeft <= 3) return <span className="px-2 py-0.5 text-xs rounded-md bg-red-500/10 text-red-400">{daysLeft}d left</span>;
  if (daysLeft <= 7) return <span className="px-2 py-0.5 text-xs rounded-md bg-amber-500/10 text-amber-400">{daysLeft}d left</span>;
  return <span className="px-2 py-0.5 text-xs rounded-md bg-emerald-500/10 text-emerald-400">{daysLeft}d left</span>;
};

export default function StudentDrives() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/drives/eligible')
      .then(res => setDrives(res.data.data || []))
      .catch(() => setDrives([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = drives.filter(d => {
    const matchSearch = d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.company_name?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'open') return matchSearch && new Date(d.application_deadline) > new Date();
    return matchSearch;
  });

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Placement Drives</h1>
          <p className="text-slate-400 text-sm mt-1">Drives you're eligible for based on your profile</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search drives or companies..."
              className="profile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
          </div>
          <div className="flex gap-2">
            {['all', 'open'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium capitalize transition-all
                  ${filter === f ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'}`}>
                {f === 'all' ? 'All drives' : 'Open only'}
              </button>
            ))}
          </div>
        </div>

        {/* Drives list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-slate-500 text-sm">No drives found</p>
            <p className="text-slate-600 text-xs mt-1">Try updating your profile to match more drives</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(drive => (
              <div key={drive.id} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/80 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-white">{drive.title}</h3>
                      <StatusBadge deadline={drive.application_deadline} />
                    </div>
                    <p className="text-sm text-slate-400">{drive.company_name}</p>
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {drive.ctc_lpa && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {drive.ctc_lpa} LPA
                        </span>
                      )}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Min CGPA {drive.min_cgpa}
                      </span>
                      <span className="text-xs text-slate-500">
                        Deadline: {new Date(drive.application_deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {/* Skills */}
                    {drive.required_skills?.length > 0 && (
                      <div className="flex gap-1.5 mt-3 flex-wrap">
                        {drive.required_skills.slice(0, 5).map(skill => (
                          <span key={skill} className="px-2 py-0.5 text-xs rounded-md bg-slate-800 text-slate-400 border border-slate-700/50">{skill}</span>
                        ))}
                        {drive.required_skills.length > 5 && (
                          <span className="px-2 py-0.5 text-xs rounded-md bg-slate-800 text-slate-500">+{drive.required_skills.length - 5}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <Link to={`/student/drives/${drive.id}`}
                    className="shrink-0 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-xl transition-colors">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
