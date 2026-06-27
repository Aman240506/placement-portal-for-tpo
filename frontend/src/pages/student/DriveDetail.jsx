import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/auth.service';

const StatusBadge = ({ deadline, status }) => {
  if (status !== 'open') return (
    <span className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 border border-slate-700/50">
      Closed
    </span>
  );
  const daysLeft = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (daysLeft < 0) return (
    <span className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-800 text-slate-400 border border-slate-700/50">
      Deadline passed
    </span>
  );
  if (daysLeft <= 3) return (
    <span className="px-3 py-1 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
      {daysLeft}d left — closing soon
    </span>
  );
  if (daysLeft <= 7) return (
    <span className="px-3 py-1 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
      {daysLeft} days left
    </span>
  );
  return (
    <span className="px-3 py-1 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      {daysLeft} days left
    </span>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0 text-slate-400">
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-200">{value}</p>
    </div>
  </div>
);

export default function DriveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [drive, setDrive]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [driveRes, appsRes] = await Promise.all([
          api.get(`/drives/${id}`),
          api.get('/students/applications').catch(() => ({ data: { data: [] } })),
        ]);
        const driveData = driveRes.data.data;
        setDrive(driveData);

        const apps = appsRes.data.data || [];
        setHasApplied(apps.some(a => String(a.drive_id) === String(id)));
      } catch {
        toast.error('Could not load drive details');
        navigate('/student/drives');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await api.post(`/drives/${id}/apply`);
      setHasApplied(true);
      toast.success('Application submitted!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  const isClosed =
    !drive ||
    drive.status !== 'open' ||
    new Date(drive.application_deadline) < new Date();

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-900 rounded-xl animate-pulse" />
        <div className="h-48 bg-slate-900 rounded-2xl animate-pulse" />
        <div className="h-32 bg-slate-900 rounded-2xl animate-pulse" />
        <div className="h-24 bg-slate-900 rounded-2xl animate-pulse" />
      </div>
    </StudentLayout>
  );

  if (!drive) return null;

  const skills        = drive.required_skills || [];
  const branches      = drive.allowed_branches || [];
  const deadlineStr   = new Date(drive.application_deadline).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const driveDateStr  = drive.drive_date
    ? new Date(drive.drive_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Back */}
        <button
          onClick={() => navigate('/student/drives')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to drives
        </button>

        {/* Header card */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h1 className="text-xl font-bold text-white">{drive.title}</h1>
                <StatusBadge deadline={drive.application_deadline} status={drive.status} />
              </div>
              <p className="text-slate-400 text-sm">{drive.company_name}</p>
              {drive.company_description && (
                <p className="text-slate-500 text-xs mt-1 leading-relaxed line-clamp-2">
                  {drive.company_description}
                </p>
              )}
            </div>

            {/* CTA */}
            <div className="shrink-0">
              {hasApplied ? (
                <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-400">Applied</span>
                </div>
              ) : (
                <button
                  onClick={handleApply}
                  disabled={applying || isClosed}
                  className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {applying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Applying...
                    </>
                  ) : isClosed ? 'Applications Closed' : 'Apply Now'}
                </button>
              )}
            </div>
          </div>

          {/* Key info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/60">
            {drive.ctc_lpa && (
              <InfoRow
                label="Package"
                value={`${drive.ctc_lpa} LPA`}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              />
            )}
            <InfoRow
              label="Min CGPA"
              value={drive.min_cgpa}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
            />
            <InfoRow
              label="Max Backlogs"
              value={drive.max_backlogs ?? 0}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
            <InfoRow
              label="Apply by"
              value={deadlineStr}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            />
            {driveDateStr && (
              <InfoRow
                label="Drive date"
                value={driveDateStr}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
              />
            )}
            {drive.website && (
              <InfoRow
                label="Website"
                value={
                  <a href={drive.website} target="_blank" rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 transition-colors">
                    Visit site →
                  </a>
                }
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>}
              />
            )}
          </div>
        </div>

        {/* Job description */}
        {drive.description && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-3">About the role</h2>
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{drive.description}</p>
          </div>
        )}

        {/* Required skills */}
        {skills.length > 0 && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
            <h2 className="text-base font-semibold text-white mb-3">Required skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <span key={skill}
                  className="px-3 py-1.5 text-sm rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Eligibility criteria */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Eligibility criteria</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
              <span className="text-sm text-slate-400">Minimum CGPA</span>
              <span className="text-sm font-semibold text-white">{drive.min_cgpa} and above</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-800/60">
              <span className="text-sm text-slate-400">Active backlogs allowed</span>
              <span className="text-sm font-semibold text-white">
                {drive.max_backlogs === 0 ? 'No backlogs allowed' : `Up to ${drive.max_backlogs}`}
              </span>
            </div>
            <div className="flex items-start justify-between py-3">
              <span className="text-sm text-slate-400">Eligible branches</span>
              {branches.length === 0 ? (
                <span className="text-sm font-semibold text-white">All branches</span>
              ) : (
                <div className="flex flex-wrap gap-1.5 justify-end max-w-xs">
                  {branches.map(b => (
                    <span key={b} className="px-2 py-0.5 text-xs rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom sticky CTA for mobile feel */}
        {!hasApplied && !isClosed && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-200">Ready to apply?</p>
              <p className="text-xs text-slate-500 mt-0.5">Deadline: {deadlineStr}</p>
            </div>
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
            >
              {applying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Applying...
                </>
              ) : 'Apply Now'}
            </button>
          </div>
        )}

        {hasApplied && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-emerald-400">Application submitted</p>
              <p className="text-xs text-slate-500 mt-0.5">Track your status in My Applications</p>
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}