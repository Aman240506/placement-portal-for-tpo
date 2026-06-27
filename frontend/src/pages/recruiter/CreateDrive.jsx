import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RecruiterLayout from '../../layouts/RecruiterLayout';
import api from '../../services/auth.service';

const BRANCHES   = ['CS', 'IT', 'ENTC', 'Mechanical', 'Civil', 'Electrical', 'Chemical'];
const SKILL_SUGGESTIONS = [
  'React', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript', 'SQL', 'PostgreSQL',
  'MongoDB', 'Express.js', 'Django', 'Spring Boot', 'C++', 'C', 'Git', 'Docker',
  'AWS', 'Linux', 'REST APIs', 'HTML', 'CSS', 'Data Structures', 'System Design',
  'Machine Learning', 'TensorFlow', 'Pandas', 'NumPy', 'Kubernetes', 'GraphQL',
];

export default function CreateDrive() {
  const navigate  = useNavigate();
  const [saving, setSaving]         = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm]             = useState({
    title: '', description: '', min_cgpa: '', max_backlogs: 0,
    ctc_lpa: '', application_deadline: '', drive_date: '',
    required_skills: [], allowed_branches: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const addSkill = (skill) => {
    const s = skill.trim();
    if (!s || form.required_skills.includes(s)) return;
    setForm(prev => ({ ...prev, required_skills: [...prev.required_skills, s] }));
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, required_skills: prev.required_skills.filter(s => s !== skill) }));
  };

  const toggleBranch = (branch) => {
    setForm(prev => ({
      ...prev,
      allowed_branches: prev.allowed_branches.includes(branch)
        ? prev.allowed_branches.filter(b => b !== branch)
        : [...prev.allowed_branches, branch],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())               return toast.error('Job title is required');
    if (!form.min_cgpa)                   return toast.error('Minimum CGPA is required');
    if (!form.application_deadline)       return toast.error('Application deadline is required');
    if (form.required_skills.length === 0) return toast.error('Add at least one required skill');

    setSaving(true);
    try {
      await api.post('/drives', {
        ...form,
        min_cgpa:     parseFloat(form.min_cgpa),
        max_backlogs: parseInt(form.max_backlogs),
        ctc_lpa:      form.ctc_lpa ? parseFloat(form.ctc_lpa) : null,
      });
      toast.success('Drive posted successfully!');
      navigate('/recruiter/drives');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create drive');
    } finally {
      setSaving(false);
    }
  };

  const suggestedSkills = SKILL_SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(skillInput.toLowerCase()) &&
    !form.required_skills.includes(s)
  ).slice(0, 6);

  return (
    <RecruiterLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <button onClick={() => navigate('/recruiter/drives')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to drives
          </button>
          <h1 className="text-2xl font-bold text-white">Post a Drive</h1>
          <p className="text-slate-400 text-sm mt-1">Fill in the details to open a new placement drive</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic info */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Basic information</h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job title <span className="text-red-400">*</span></label>
              <input name="title" value={form.title} onChange={handleChange}
                placeholder="e.g. Software Engineer Intern"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Job description</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                placeholder="Describe the role, responsibilities, and what the candidate will work on..."
                rows={4}
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">CTC (LPA)</label>
                <input name="ctc_lpa" type="number" value={form.ctc_lpa} onChange={handleChange}
                  placeholder="e.g. 12.5" min="0" step="0.5"
                  className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Application deadline <span className="text-red-400">*</span></label>
                <input name="application_deadline" type="date" value={form.application_deadline} onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="profile-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Drive / interview date</label>
                <input name="drive_date" type="date" value={form.drive_date} onChange={handleChange}
                  className="profile-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none" />
              </div>
            </div>
          </div>

          {/* Required skills */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Required skills <span className="text-red-400">*</span></h2>

            {/* Added skills */}
            {form.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.required_skills.map(skill => (
                  <span key={skill}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm rounded-xl">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}
                      className="text-violet-500 hover:text-red-400 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Skill input */}
            <div className="relative">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                placeholder="Type a skill and press Enter..."
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>

            {/* Suggestions */}
            {skillInput.length > 0 && suggestedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-slate-500 w-full">Suggestions:</span>
                {suggestedSkills.map(s => (
                  <button key={s} type="button" onClick={() => addSkill(s)}
                    className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-violet-500/40 hover:text-violet-300 transition-all">
                    + {s}
                  </button>
                ))}
              </div>
            )}

            {/* Quick-add common skills */}
            {skillInput.length === 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_SUGGESTIONS.filter(s => !form.required_skills.includes(s)).slice(0, 10).map(s => (
                    <button key={s} type="button" onClick={() => addSkill(s)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-400 border border-slate-700/50 hover:border-violet-500/30 hover:text-slate-200 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Eligibility */}
          <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-semibold text-white">Eligibility criteria</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Minimum CGPA <span className="text-red-400">*</span></label>
                <input name="min_cgpa" type="number" value={form.min_cgpa} onChange={handleChange}
                  placeholder="e.g. 7.0" min="0" max="10" step="0.1"
                  className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Max active backlogs allowed</label>
                <select name="max_backlogs" value={form.max_backlogs} onChange={handleChange}
                  className="profile-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none">
                  <option value={0}>No backlogs (0)</option>
                  <option value={1}>Up to 1</option>
                  <option value={2}>Up to 2</option>
                  <option value={3}>Up to 3</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Eligible branches
                <span className="text-slate-500 font-normal ml-2">(leave all unselected = all branches)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {BRANCHES.map(b => (
                  <button key={b} type="button" onClick={() => toggleBranch(b)}
                    className={`px-3 py-1.5 text-sm rounded-xl border font-medium transition-all
                      ${form.allowed_branches.includes(b)
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:text-slate-200'}`}>
                    {b}
                  </button>
                ))}
              </div>
              {form.allowed_branches.length === 0 && (
                <p className="text-xs text-slate-500 mt-2">All branches are currently eligible</p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={() => navigate('/recruiter/drives')}
              className="px-5 py-2.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Posting...</>
              ) : 'Post Drive'}
            </button>
          </div>
        </form>
      </div>
    </RecruiterLayout>
  );
}