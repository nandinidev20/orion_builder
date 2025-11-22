import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminLayout from './components/common/AdminLayout';
import StudioLayout from './components/common/StudioLayout';
import StudioLayoutSample from './components/common/StudioLayoutSample';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminLogin from './pages/admin/AdminLogin';
import StudioDashboard from './pages/studio/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import AdminStudios from './pages/admin/Studios';
import AdminExperiences from './pages/admin/Experiences';
import AdminCreateExperience from './pages/admin/CreateExperience';
import AdminEditExperience from './pages/admin/EditExperience';
import AdminExperienceDetails from './pages/admin/ExperienceDetails';
import AdminAnalytics from './pages/admin/Analytics';
import AdminExperienceSettings from './pages/admin/ExperienceSettings';
import AdminSettings from './pages/admin/Settings';
import StudioCreateExperience from './pages/studio/CreateExperience';
import StudioAnalytics from './pages/studio/Analytics';
import StudioExperiences from './pages/studio/Experiences';
import StudioExperienceDetails from './pages/studio/ExperienceDetails';
import StudioSettings from './pages/studio/Settings';
import GuestExperience from './pages/GuestExperience';
import AcceptInvite from './pages/AcceptInvite';
import SetPassword from './pages/SetPassword';
import PublicDashboard from './pages/studio/PublicDashboard';
import PublicCreateExperience from './pages/studio/PublicCreateExperience';
import PublicAnalytics from './pages/studio/PublicAnalytics';
import PublicExperiences from './pages/studio/PublicExperiences';
import PublicExperienceDetails from './pages/studio/PublicExperienceDetails';
import PublicEditExperience from './pages/studio/PublicEditExperience';
import PublicSettings from './pages/studio/PublicSettings';
import CreateExperience from './pages/studio/CreateExperiencV2/CreateExperience';
import EditExperienceV2 from './pages/studio/CreateExperiencV2/EditExperience';
import ExperienceCreatedSuccess from './pages/studio/ExperienceCreatedSuccess';
import AdminExperienceCreatedSuccess from './pages/admin/AdminExperienceCreatedSucces';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/experience/:slug" element={<GuestExperience />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminDashboard /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/studios" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminStudios /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/experiences" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminExperiences /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/create" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminCreateExperience /></AdminLayout>
            </AdminProtectedRoute>
          } />

            <Route path="/admin/experience-created/:id" element={
            <AdminProtectedRoute>
              <StudioLayout><AdminExperienceCreatedSuccess/></StudioLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/edit/:id" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminEditExperience /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/experiences/:id" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminExperienceDetails /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/analytics" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminAnalytics /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/experience-settings" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminExperienceSettings /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminSettings /></AdminLayout>
            </AdminProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <AdminProtectedRoute>
              <AdminLayout><AdminUsers /></AdminLayout>
            </AdminProtectedRoute>
          } />
          
          {/* Studio routes */}
          <Route path="/studio" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><StudioDashboard /></StudioLayout>
            </ProtectedRoute>
          } />
          <Route path="/studio/create" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><CreateExperience /></StudioLayout>
            </ProtectedRoute>
          } />
          <Route path="/studio/analytics" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><StudioAnalytics /></StudioLayout>
            </ProtectedRoute>
          } />
          <Route path="/studio/experiences" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><StudioExperiences /></StudioLayout>
            </ProtectedRoute>
          } />
          <Route path="/studio/experiences/:id" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><StudioExperienceDetails /></StudioLayout>
            </ProtectedRoute>
          } />
          <Route path="/studio/edit/:id" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><EditExperienceV2 /></StudioLayout>
            </ProtectedRoute>
          } />
          <Route path="/studio/experience-created/:id" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><ExperienceCreatedSuccess /></StudioLayout>
            </ProtectedRoute>
          } />
          <Route path="/studio/settings" element={
            <ProtectedRoute allowedRoles={['studio', 'admin']}>
              <StudioLayout><StudioSettings /></StudioLayout>
            </ProtectedRoute>
          } />
          
          {/* Public Studio routes (no auth) */}
          <Route path="/public/studio" element={
            <StudioLayoutSample><PublicDashboard /></StudioLayoutSample>
          } />
          <Route path="/public/studio/create" element={
            <StudioLayoutSample><CreateExperience /></StudioLayoutSample>
          } />
          <Route path="/public/studio/edit" element={
            <StudioLayoutSample><EditExperienceV2 /></StudioLayoutSample>
          } />
          <Route path="/public/studio/analytics" element={
            <StudioLayoutSample><PublicAnalytics /></StudioLayoutSample>
          } />
          <Route path="/public/studio/experiences" element={
            <StudioLayoutSample><PublicExperiences /></StudioLayoutSample>
          } />
          <Route path="/public/studio/experiences/:id" element={
            <StudioLayoutSample><PublicExperienceDetails /></StudioLayoutSample>
          } />
          <Route path="/public/studio/edit/:id" element={
            <StudioLayoutSample><PublicEditExperience /></StudioLayoutSample>
          } />
          <Route path="/public/studio/settings" element={
            <StudioLayoutSample><PublicSettings /></StudioLayoutSample>
          } />
          
          {/* Default redirect */}
          <Route path="*" element={<Login />} />
        </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App
