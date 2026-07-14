import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const homeRoute = user ? `/${user.role}/dashboard` : '/login';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-slate-800 select-none">404</p>
        <h1 className="text-2xl font-bold text-white mt-4">Page not found</h1>
        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">
          The page you're looking for doesn't exist or you don't have access to it.
        </p>
        <div className="flex items-center gap-3 justify-center mt-6">
          <button onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl border border-slate-700/50 transition-colors">
            Go back
          </button>
          <Link to={homeRoute}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-xl transition-colors">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}