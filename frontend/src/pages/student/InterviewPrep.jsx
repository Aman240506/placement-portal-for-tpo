import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

const DIFF_COLOR = {
  Easy:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10  text-amber-400   border-amber-500/20',
  Hard:   'bg-red-500/10    text-red-400     border-red-500/20',
};

const PRIORITY_COLOR = {
  High:   'text-red-400',
  Medium: 'text-amber-400',
  Low:    'text-slate-400',
};

const ReadinessRing = ({ score }) => {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const r = 44, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(51,65,85,0.6)" strokeWidth="9" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="55" y="50" textAnchor="middle" fill="white" fontSize="22" fontWeight="700" fontFamily="DM Sans">{score}%</text>
        <text x="55" y="68" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="DM Sans">Ready</text>
      </svg>
    </div>
  );
};

export default function InterviewPrep() {
  const { driveId } = useParams();
  const navigate    = useNavigate();

  const [drive, setDrive]       = useState(null);
  const [prep, setPrep]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [driveRes, prepRes] = await Promise.all([
          api.get(`/drives/${driveId}`),
          api.get(`/interview/prep/${driveId}`).catch(() => ({ data: { data: null } })),
        ]);
        setDrive(driveRes.data.data);
        if (prepRes.data.data) setPrep(prepRes.data.data);
      } catch {
        toast.error('Failed to load drive');
        navigate('/student/applications');
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [driveId, navigate]);

  const generatePrep = async () => {
    setLoading(true);
    try {
      toast.loading('AI is generating your personalized prep...', { id: 'prep' });
      const res = await api.post('/interview/prep', { drive_id: driveId });
      setPrep(res.data.data);
      toast.success('Interview prep ready!', { id: 'prep' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate prep', { id: 'prep' });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'questions', label: '❓ Questions',     count: prep?.technical_questions?.length },
    { key: 'gaps',      label: '📚 Study Plan',    count: prep?.missing_skills_plan?.length },
    { key: 'hr',        label: '🤝 HR Round',      count: prep?.hr_questions?.length },
    { key: 'schedule',  label: '📅 5-Day Schedule', count: null },
    { key: 'tips',      label: '💡 Pro Tips',       count: null },
  ];

  if (fetching) return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-900 rounded-2xl animate-pulse" />)}
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Back */}
        <button onClick={() => navigate('/student/applications')}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to applications
        </button>

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎯</span>
                <h1 className="text-xl font-bold text-white">Interview Prep</h1>
                <span className="px-2 py-0.5 text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg font-medium">
                  AI Powered
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {drive?.title} — <span className="text-white font-medium">{drive?.company_name}</span>
              </p>
              {drive?.ctc_lpa && (
                <p className="text-emerald-400 text-sm mt-1 font-medium">{drive.ctc_lpa} LPA</p>
              )}
            </div>

            {prep ? (
              <div className="flex items-center gap-4">
                <ReadinessRing score={prep.overall_readiness || 0} />
                <div>
                  <p className="text-xs text-slate-500">Readiness</p>
                  <p className="text-sm font-semibold" style={{
                    color: (prep.overall_readiness || 0) >= 75 ? '#10b981'
                         : (prep.overall_readiness || 0) >= 50 ? '#f59e0b' : '#ef4444'
                  }}>{prep.readiness_label}</p>
                  <button onClick={generatePrep} disabled={loading}
                    className="mt-2 text-xs text-slate-500 hover:text-sky-400 transition-colors">
                    Regenerate →
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={generatePrep} disabled={loading}
                className="flex items-center gap-2 px-5 py-3 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
                ) : (
                  <><span>✨</span> Generate AI Prep</>
                )}
              </button>
            )}
          </div>

          {/* Company overview */}
          {prep?.company_overview && (
            <div className="mt-4 pt-4 border-t border-slate-800/60">
              <p className="text-xs text-slate-500 mb-1">About the company</p>
              <p className="text-sm text-slate-300 leading-relaxed">{prep.company_overview}</p>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!prep && !loading && (
          <div className="text-center py-16 bg-slate-900 border border-slate-800/60 rounded-2xl">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-lg font-semibold text-white mb-2">Get AI Interview Preparation</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Our AI analyses your skills vs the job requirements and generates personalised
              interview questions, a study plan, and a 5-day preparation schedule just for you.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
              {['10 Technical Questions', 'Skill Gap Study Plan', '5-Day Schedule'].map(f => (
                <div key={f} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-xs text-slate-400">{f}</div>
              ))}
            </div>
            <button onClick={generatePrep} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold rounded-xl transition-colors mx-auto">
              <span>✨</span> Generate My Interview Prep
            </button>
          </div>
        )}

        {/* Tabs */}
        {prep && (
          <>
            {/* Skill gap summary */}
            {prep.meta && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
                  <p className="text-xs text-emerald-400 font-semibold mb-2">✅ You already know</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(prep.meta.matched_skills || []).map(s => (
                      <span key={s} className="px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">{s}</span>
                    ))}
                    {(prep.meta.matched_skills || []).length === 0 && (
                      <p className="text-xs text-slate-500">Upload your resume to detect skills</p>
                    )}
                  </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4">
                  <p className="text-xs text-red-400 font-semibold mb-2">❌ Study before interview</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(prep.meta.missing_skills || []).map(s => (
                      <span key={s} className="px-2 py-0.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">{s}</span>
                    ))}
                    {(prep.meta.missing_skills || []).length === 0 && (
                      <p className="text-xs text-slate-500">Great — you have all required skills!</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex gap-1 bg-slate-900 border border-slate-800/60 rounded-xl p-1 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                    ${activeTab === t.key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                  {t.label}
                  {t.count > 0 && (
                    <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 rounded text-xs">{t.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="space-y-3">

              {/* Technical Questions */}
              {activeTab === 'questions' && (prep.technical_questions || []).map((q, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpanded(expanded === i ? null : i)}
                    className="w-full flex items-start gap-3 p-5 text-left hover:bg-slate-800/30 transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded border ${DIFF_COLOR[q.difficulty] || DIFF_COLOR.Medium}`}>
                          {q.difficulty}
                        </span>
                        <span className="text-xs text-slate-500">{q.topic}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200">{q.question}</p>
                    </div>
                    <svg className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${expanded === i ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expanded === i && (
                    <div className="px-5 pb-5 space-y-3 border-t border-slate-800/60">
                      {q.why_asked && (
                        <div className="bg-sky-500/5 border border-sky-500/15 rounded-xl p-3">
                          <p className="text-xs text-sky-400 font-semibold mb-1">Why they ask this</p>
                          <p className="text-xs text-slate-300">{q.why_asked}</p>
                        </div>
                      )}
                      {q.hint && (
                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
                          <p className="text-xs text-amber-400 font-semibold mb-1">💡 How to approach</p>
                          <p className="text-xs text-slate-300">{q.hint}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Study Plan */}
              {activeTab === 'gaps' && (
                <div className="space-y-3">
                  {(prep.missing_skills_plan || []).length === 0 ? (
                    <div className="text-center py-10 bg-slate-900 border border-slate-800/60 rounded-2xl">
                      <p className="text-2xl mb-2">🎉</p>
                      <p className="text-slate-300 font-medium">You have all required skills!</p>
                      <p className="text-slate-500 text-sm mt-1">Focus on revising and practicing</p>
                    </div>
                  ) : (
                    (prep.missing_skills_plan || []).map((item, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white">{item.skill}</span>
                            <span className={`text-xs font-medium ${PRIORITY_COLOR[item.priority]}`}>
                              {item.priority} Priority
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">
                            ⏱ {item.time_needed}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{item.what_to_study}</p>
                        {item.resource && (
                          <p className="text-xs text-sky-400">📖 Resource: {item.resource}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* HR Questions */}
              {activeTab === 'hr' && (
                <div className="space-y-3">
                  {(prep.hr_questions || []).map((q, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                      <p className="text-sm font-semibold text-white mb-2">Q{i+1}. {q.question}</p>
                      <div className="bg-slate-800/50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 font-semibold mb-1">How to answer:</p>
                        <p className="text-xs text-slate-300 leading-relaxed">{q.how_to_answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5-Day Schedule */}
              {activeTab === 'schedule' && (
                <div className="space-y-3">
                  {(prep.day_wise_plan || []).map((day, i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
                          D{i+1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{day.day}</p>
                          <p className="text-xs text-violet-400">{day.focus}</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {(day.tasks || []).map((task, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {/* Pro Tips */}
              {activeTab === 'tips' && (
                <div className="space-y-3">
                  {/* Confidence boosters */}
                  {(prep.confidence_boosters || []).length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                      <p className="text-sm font-semibold text-emerald-400 mb-3">💪 Your strengths for this interview</p>
                      <ul className="space-y-2">
                        {prep.confidence_boosters.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-emerald-400 shrink-0">★</span>{b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Pro tips */}
                  <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-white mb-3">🎯 Pro tips for this interview</p>
                    <ul className="space-y-3">
                      {(prep.pro_tips || []).map((tip, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-violet-500/10 text-violet-400 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                            {i+1}
                          </span>
                          <p className="text-sm text-slate-300 leading-relaxed">{tip}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </StudentLayout>
  );
}