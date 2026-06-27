import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import api from '../../services/auth.service';

const appStatusConfig = {
  applied:     { label: 'Applied',     bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  rejected:    { label: 'Rejected',    bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20' },
  selected:    { label: 'Selected',    bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
};

const ScoreBar = ({ score }) => {
  const color = score >= 80 ? 'from-emerald-500 to-teal-500'
              : score >= 60 ? 'from-sky-500 to-blue-500'
              : 'from-amber-500 to-orange-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-slate-300">{score}%</span>
    </div>
  );
};

export default function ViewApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [drive, setDrive]           = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [shortlisting, setShortlisting] = useState(false);
  const [search, setSearch]         = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [sortBy, setSortBy]         = useState('applied_at');
  const [activeTab, setActiveTab]   = useState('all'); // all | shortlisted

  useEffect(() => {
    const load = async () => {
      try {
        const [driveRes, appRes] = await Promise.all([
          api.get(`/drives/${id}`),
          api.get(`/drives/${id}/applicants`),
        ]);
        setDrive(driveRes.data.data);
        setApplicants(appRes.data.data || []);
      } catch {
        toast.error('Failed to load applicants');
        navigate('/recruiter/drives');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleShortlist = async () => {
    setShortlisting(true);
    try {
      await api.post(`/drives/${id}/shortlist`);
      toast.success('AI shortlisting complete!');
      // Refresh applicants to show updated scores
      const appRes = await api.get(`/drives/${id}/applicants`);
      setApplicants(appRes.data.data || []);
      setActiveTab('shortlisted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Shortlisting failed');
    } finally {
      setShortlisting(false);
    }
  };

  const handleUpdateStatus = async (studentId, status) => {
    try {
      await api.put(`/drives/${id}/applicants/${studentId}`, { status });
      setApplicants(prev =>
        prev.map(a => a.id === studentId ? { ...a, application_status: status } : a)
      );
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const exportCSV = () => {
    const shortlisted = applicants.filter(a => a.match_score);
    if (shortlisted.length === 0) return toast.error('Run AI shortlisting first to export');

    const rows = [
      ['Rank', 'Name', 'Email', 'Branch', 'CGPA', 'Match Score', 'Matched Skills', 'Missing Skills', 'Status'],
      ...shortlisted
        .sort((a, b) => (b.match_score || 0) - (a.match_score || 0))
        .map((a, i) => [
          i + 1,
          a.full_name,
          a.email,
          a.branch,
          a.cgpa,
          `${a.match_score}%`,
          (a.matched_skills || []).join('; '),
          (a.missing_skills || []).join('; '),
          a.application_status,
        ]),
    ];

    const csv = rows.map(r => r.map(v => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `shortlist-${drive?.title?.replace(/\s+/g, '-') || id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Shortlist exported');
  };

  // Filter + sort
  const branches = [...new Set(applicants.map(a => a.branch).filter(Boolean))];

  const displayed = applicants
    .filter(a => {
      if (activeTab === 'shortlisted' && !a.match_score) return false;
      if (filterBranch !== 'all' && a.branch !== filterBranch) return false;
      const q = search.toLowerCase();
      return !q || a.full_name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'match_score')  return (b.match_score || 0) - (a.match_score || 0);
      if (sortBy === 'cgpa')         return (b.cgpa || 0) - (a.cgpa || 0);
      return new Date(b.applied_at) - new Date(a.applied_at);
    });

  const shortlistedCount = applicants.filter(a => a.match_score).length;

  if (loading) return (
    <RecruiterLayout>
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="h-8 w-64 bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-20 bg-slate-900 rounded-2xl animate-pulse" />
        <div className="h-96 bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    </RecruiterLayout>
  );

  return (
    <RecruiterLayout>
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={() => navigate('/recruiter/drives')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to drives
        </button>

        {/* Drive header */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-white">{drive?.title}</h1>
            <p className="text-slate-400 text-sm mt-0.5">{drive?.company_name}</p>
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <span className="text-xs text-slate-400">
                <span className="font-semibold text-white">{applicants.length}</span> total applicants
              </span>
              <span className="text-xs text-slate-400">
                <span className="font-semibold text-emerald-400">{shortlistedCount}</span> AI scored
              </span>
              {drive?.ctc_lpa && (
                <span className="text-xs text-emerald-400">{drive.ctc_lpa} LPA</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {shortlistedCount > 0 && (
              <button onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700/50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            )}
            <button onClick={handleShortlist} disabled={shortlisting || applicants.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {shortlisting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Running AI...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {shortlistedCount > 0 ? 'Re-run AI Shortlist' : 'Run AI Shortlist'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800/60 rounded-xl p-1">
            {[
              { key: 'all',         label: `All (${applicants.length})` },
              { key: 'shortlisted', label: `AI Ranked (${shortlistedCount})` },
            ].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${activeTab === t.key
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-300'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="profile-input w-full pl-10 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
          </div>

          {/* Branch filter */}
          {branches.length > 0 && (
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
              className="profile-input px-3 py-2.5 rounded-xl text-sm text-white outline-none">
              <option value="all">All branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          )}

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="profile-input px-3 py-2.5 rounded-xl text-sm text-white outline-none">
            <option value="applied_at">Sort: Latest first</option>
            <option value="match_score">Sort: AI Match score</option>
            <option value="cgpa">Sort: CGPA</option>
          </select>
        </div>

        {/* Applicants table */}
        {displayed.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-slate-500 text-sm">
              {applicants.length === 0 ? 'No applications yet' : 'No applicants match your filters'}
            </p>
            {activeTab === 'shortlisted' && shortlistedCount === 0 && (
              <p className="text-slate-600 text-xs mt-1">Run AI shortlisting to see ranked candidates</p>
            )}
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-800/60 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <div className="col-span-1">#</div>
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Branch / CGPA</div>
              <div className="col-span-2">AI Match</div>
              <div className="col-span-2">Skills match</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Action</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-800/60">
              {displayed.map((applicant, idx) => {
                const cfg = appStatusConfig[applicant.application_status] || appStatusConfig.applied;
                const matchedSkills = applicant.matched_skills || [];
                const missingSkills = applicant.missing_skills || [];

                return (
                  <div key={applicant.id}
                    className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-slate-800/30 transition-colors">

                    {/* Rank */}
                    <div className="col-span-1">
                      {applicant.match_score ? (
                        <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </div>

                    {/* Student */}
                    <div className="col-span-3 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {applicant.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{applicant.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{applicant.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Branch / CGPA */}
                    <div className="col-span-2">
                      <p className="text-sm text-slate-300">{applicant.branch}</p>
                      <p className="text-xs text-slate-500">CGPA {applicant.cgpa}</p>
                    </div>

                    {/* AI match score */}
                    <div className="col-span-2">
                      {applicant.match_score ? (
                        <ScoreBar score={parseFloat(applicant.match_score)} />
                      ) : (
                        <span className="text-xs text-slate-600">Not scored</span>
                      )}
                    </div>

                    {/* Skills breakdown */}
                    <div className="col-span-2">
                      {matchedSkills.length > 0 || missingSkills.length > 0 ? (
                        <div className="space-y-0.5">
                          {matchedSkills.length > 0 && (
                            <p className="text-xs text-emerald-400">✓ {matchedSkills.length} matched</p>
                          )}
                          {missingSkills.length > 0 && (
                            <p className="text-xs text-red-400">✗ {missingSkills.length} missing</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                        {cfg.label}
                      </span>
                    </div>

                    {/* Status action */}
                    <div className="col-span-1">
                      <select
                        value={applicant.application_status}
                        onChange={e => handleUpdateStatus(applicant.id, e.target.value)}
                        className="profile-input w-full py-1 px-1.5 rounded-lg text-xs text-slate-300 outline-none">
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlist</option>
                        <option value="selected">Select</option>
                        <option value="rejected">Reject</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI info banner (shown before shortlisting) */}
        {shortlistedCount === 0 && applicants.length > 0 && (
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-violet-300">AI shortlisting not run yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Click "Run AI Shortlist" to rank all {applicants.length} applicants by skill match, CGPA, and profile completeness.
                Results will show a match score and highlight matched vs missing skills for each candidate.
              </p>
            </div>
          </div>
        )}

      </div>
    </RecruiterLayout>
  );
}