import { useState } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/auth.service';
import toast from 'react-hot-toast';

const tipIcon = {
  success: { icon: '✓', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  warning: { icon: '!', bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20' },
  tip:     { icon: '→', bg: 'bg-sky-500/10',     text: 'text-sky-400',     border: 'border-sky-500/20' },
};

const ScoreRing = ({ score }) => {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#0ea5e9' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(51,65,85,0.6)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="70" y="65" textAnchor="middle" fill="white" fontSize="26" fontWeight="700" fontFamily="DM Sans">{score}</text>
        <text x="70" y="84" textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="DM Sans">/100</text>
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
};

const SubScore = ({ label, score, color }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-xs font-semibold text-slate-300">{score}%</span>
    </div>
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
    </div>
  </div>
);

export default function ATSChecker() {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students/ats-check');
      setResult(res.data.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'ATS check failed';
      if (msg.includes('No resume')) {
        toast.error('Upload a resume first from your Profile page');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">ATS Resume Checker</h1>
          <p className="text-slate-400 text-sm mt-1">
            Scan your resume against ATS systems and get actionable improvement tips
          </p>
        </div>

        {/* Run button */}
        {!result && (
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-white">Analyse your resume</p>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                We'll check section completeness, keyword density, length, and profile quality — then give you a score and tips.
              </p>
            </div>
            <button onClick={runCheck} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Analysing...</>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run ATS Check
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <>
            {/* Main score card */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
              <div className="flex items-center gap-8 flex-wrap">
                <ScoreRing score={result.ats_score} />
                <div className="flex-1 min-w-48 space-y-4">
                  <SubScore label="Section completeness" score={result.section_score} color="#10b981" />
                  <SubScore label="Keyword density"      score={result.keyword_score} color="#0ea5e9" />
                  <SubScore label="Resume length"        score={result.length_score}  color="#8b5cf6" />
                  <SubScore label="Profile completeness" score={result.profile_score} color="#f59e0b" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-5 pt-5 border-t border-slate-800/60">
                <p className="text-xs text-slate-500">{result.word_count} words detected in resume</p>
                <button onClick={runCheck} disabled={loading}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                  Re-run check →
                </button>
              </div>
            </div>

            {/* Sections found */}
            <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-white mb-4">Sections detected</h2>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(result.sections_found).map(([section, found]) => (
                  <div key={section}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium capitalize
                      ${found
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-500'}`}>
                    <span>{found ? '✓' : '✗'}</span>
                    <span>{section}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted skills */}
            {result.extracted_skills?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                <h2 className="text-base font-semibold text-white mb-3">
                  Skills detected
                  <span className="ml-2 text-sm font-normal text-slate-500">({result.extracted_skills.length} found)</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.extracted_skills.map(skill => (
                    <span key={skill}
                      className="px-3 py-1 text-sm rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tips?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5">
                <h2 className="text-base font-semibold text-white mb-4">Recommendations</h2>
                <div className="space-y-3">
                  {result.tips.map((tip, i) => {
                    const cfg = tipIcon[tip.type] || tipIcon.tip;
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                        <span className={`text-xs font-bold mt-0.5 shrink-0 ${cfg.text}`}>{cfg.icon}</span>
                        <p className="text-sm text-slate-300">{tip.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </StudentLayout>
  );
}