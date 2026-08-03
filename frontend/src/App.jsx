import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PublicStats from './pages/public/PublicStats';
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Student
import StudentDashboard    from './pages/student/Dashboard';
import StudentProfile      from './pages/student/Profile';
import StudentDrives       from './pages/student/Drives';
import StudentApplications from './pages/student/Application';
import DriveDetail         from './pages/student/DriveDetail';
import ATSChecker          from './pages/student/ATSChecker';

// Recruiter
import RecruiterDashboard from './pages/recruiter/Dashboard';
import RecruiterDrives    from './pages/recruiter/RecruiterDrives';
import CreateDrive        from './pages/recruiter/CreateDrive';
import ViewApplicants     from './pages/recruiter/ViewApplicants';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudents  from './pages/admin/AdminStudents';
import AdminCompanies from './pages/admin/AdminCompanies';
import AdminDrives    from './pages/admin/AdminDrives';
import AdminPlaced    from './pages/admin/AdminPlaced';
import AdminAnalytics from './pages/admin/AdminAnalytics';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user)   return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
};
<Route path="/placements" element={<PublicStats />} />
export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/login"    element={!user ? <Login />    : <Navigate to={`/${user.role}/dashboard`} replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role}/dashboard`} replace />} />

      {/* Student */}
      <Route path="/student/dashboard"    element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/profile"      element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/drives"       element={<ProtectedRoute allowedRoles={['student']}><StudentDrives /></ProtectedRoute>} />
      <Route path="/student/drives/:id"   element={<ProtectedRoute allowedRoles={['student']}><DriveDetail /></ProtectedRoute>} />
      <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['student']}><StudentApplications /></ProtectedRoute>} />
      <Route path="/student/ats-check"    element={<ProtectedRoute allowedRoles={['student']}><ATSChecker /></ProtectedRoute>} />

      {/* Recruiter */}
      <Route path="/recruiter/dashboard"             element={<ProtectedRoute allowedRoles={['recruiter']}><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/drives"                element={<ProtectedRoute allowedRoles={['recruiter']}><RecruiterDrives /></ProtectedRoute>} />
      <Route path="/recruiter/drives/create"         element={<ProtectedRoute allowedRoles={['recruiter']}><CreateDrive /></ProtectedRoute>} />
      <Route path="/recruiter/drives/:id/applicants" element={<ProtectedRoute allowedRoles={['recruiter']}><ViewApplicants /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/students"  element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['admin']}><AdminCompanies /></ProtectedRoute>} />
      <Route path="/admin/drives"    element={<ProtectedRoute allowedRoles={['admin']}><AdminDrives /></ProtectedRoute>} />
      <Route path="/admin/placed"    element={<ProtectedRoute allowedRoles={['admin']}><AdminPlaced /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

      {/* Catch old /admin/placements URL → redirect to correct route */}
      <Route path="/admin/placements" element={<Navigate to="/admin/placed" replace />} />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
