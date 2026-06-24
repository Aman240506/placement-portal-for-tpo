import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/student/dashboard', label: 'Dashboard', icon: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { to: '/student/profile', label: 'My Profile', icon: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { to: '/student/drives', label: 'Drives', icon: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
  { to: '/student/applications', label: 'Applications', icon: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
];

export default function StudentLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/login'); };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <aside className={`h-full flex flex-col bg-slate-900 border-r border-slate-800/60 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          {!collapsed && <span className="font-bold text-white tracking-tight">PlacePortal</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-slate-500 hover:text-slate-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>
        {!collapsed && (
          <div className="px-4 py-3 border-b border-slate-800/60">
            <span className="text-xs font-medium text-sky-400 bg-sky-500/10 px-2 py-1 rounded-md">Student Portal</span>
          </div>
        )}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800/60">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}