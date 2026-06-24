import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import StudentLayout from '../../layouts/StudentLayout';
import api from '../../services/auth.service';

const BRANCHES = ['CS', 'IT', 'ENTC', 'Mechanical', 'Civil', 'Electrical', 'Chemical'];

export default function StudentProfile() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState(null);

  useEffect(() => {
    api.get('/students/profile')
      .then(res => {
        setForm(res.data.data || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    api.get('/students/resume')
      .then(res => setResume(res.data.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/students/profile', form);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') return toast.error('Only PDF files allowed');
    if (file.size > 5 * 1024 * 1024) return toast.error('File must be under 5MB');

    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      const res = await api.post('/students/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResume(res.data.data);
      toast.success('Resume uploaded & parsed!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-900 rounded-2xl animate-pulse" />)}
      </div>
    </StudentLayout>
  );

  return (
    <StudentLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-slate-400 text-sm mt-1">Keep your profile updated to improve AI match scores</p>
        </div>

        {/* Resume section */}
        <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Resume</h2>
          {resume ? (
            <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{resume.file_name || 'Resume.pdf'}</p>
                  <p className="text-xs text-slate-500">Uploaded {new Date(resume.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={resume.file_url} target="_blank" rel="noreferrer"
                  className="px-3 py-1.5 text-xs text-sky-400 bg-sky-500/10 rounded-lg hover:bg-sky-500/20 transition-colors">
                  View
                </a>
                <label className="px-3 py-1.5 text-xs text-slate-400 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                  Replace
                  <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-all
              ${uploading ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5'}`}>
              {uploading ? (
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
              ) : (
                <svg className="w-8 h-8 text-slate-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              <p className="text-sm font-medium text-slate-300">{uploading ? 'Uploading & parsing...' : 'Upload Resume'}</p>
              <p className="text-xs text-slate-500 mt-1">PDF only, max 5MB</p>
              <input type="file" accept=".pdf" onChange={handleResumeUpload} disabled={uploading} className="hidden" />
            </label>
          )}
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-semibold text-white">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
              <input name="full_name" value={form.full_name || ''} onChange={handleChange}
                placeholder="Aman Sharma"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
              <input name="phone" value={form.phone || ''} onChange={handleChange}
                placeholder="+91 98765 43210"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Roll number</label>
              <input name="roll_number" value={form.roll_number || ''} onChange={handleChange}
                placeholder="CS2021001"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Branch</label>
              <select name="branch" value={form.branch || 'CS'} onChange={handleChange}
                className="profile-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none">
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Year</label>
              <select name="year" value={form.year || 3} onChange={handleChange}
                className="profile-input w-full px-4 py-3 rounded-xl text-white text-sm outline-none">
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">CGPA</label>
              <input name="cgpa" type="number" value={form.cgpa || ''} onChange={handleChange}
                placeholder="8.5" min="0" max="10" step="0.01"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Active backlogs</label>
              <input name="backlogs" type="number" value={form.backlogs || 0} onChange={handleChange}
                placeholder="0" min="0"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-300">Social Links</h3>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">LinkedIn URL</label>
              <input name="linkedin_url" value={form.linkedin_url || ''} onChange={handleChange}
                placeholder="https://linkedin.com/in/yourname"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">GitHub URL</label>
              <input name="github_url" value={form.github_url || ''} onChange={handleChange}
                placeholder="https://github.com/yourname"
                className="profile-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm outline-none" />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </StudentLayout>
  );
}
