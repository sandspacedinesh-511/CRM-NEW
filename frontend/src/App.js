// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import MarketingLayout from './layouts/MarketingLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

// Marketing pages
import Home from './pages/marketing/Home';
import About from './pages/marketing/About';
import Services from './pages/marketing/Services';
import Contact from './pages/marketing/Contact';

// Auth pages
import Login from './pages/auth/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import CounselorManagement from './pages/admin/CounselorManagement';
import CounselorMonitoring from './pages/admin/CounselorMonitoring';
import ApplicationProgress from './pages/admin/ApplicationProgress';
import Analytics from './pages/admin/Analytics';
import StudentManagement from './pages/admin/StudentManagement';
import UniversityManagement from './pages/admin/UniversityManagement';
import Settings from './pages/admin/Settings';
import Reports from './pages/admin/Reports';
import AdminProfile from './pages/admin/Profile';
import AdminSecurity from './pages/admin/Security';
import TelecallerManagement from './pages/admin/TelecallerManagement';
import TelecallerDashboardAdmin from './pages/admin/TelecallerDashboardAdmin';
import MarketingTeamManagement from './pages/admin/MarketingTeamManagement';
import B2BMarketingTeamManagement from './pages/admin/B2BMarketingTeamManagement';
import MarketingMemberLeadsAdmin from './pages/admin/MarketingMemberLeadsAdmin';
import B2BMarketingMemberLeadsAdmin from './pages/admin/B2BMarketingMemberLeadsAdmin';


// Counselor pages
import CounselorDashboard from './pages/counselor/Dashboard';
import StudentList from './pages/counselor/StudentList';
import StudentDetails from './pages/counselor/StudentDetails';
import Documents from './pages/counselor/Documents';
import Applications from './pages/counselor/Applications';
import UniversityList from './pages/counselor/UniversityList';
import Tasks from './pages/counselor/Tasks';


import Profile from './pages/counselor/Profile';
import CounselorSettings from './pages/counselor/Settings';
import CounselorSecurity from './pages/counselor/Security';
import CounselorNotifications from './pages/counselor/Notifications';

// Telecaller pages
import TelecallerDashboard from './pages/telecaller/Dashboard';
import TelecallerTasks from './pages/telecaller/Tasks';
import TelecallerFollowUps from './pages/telecaller/FollowUps';
import TelecallerActivityLog from './pages/telecaller/ActivityLog';
import TelecallerExports from './pages/telecaller/Exports';
import TelecallerNotifications from './pages/telecaller/Notifications';
import TelecallerCommunication from './pages/telecaller/Communication';
import TelecallerProfile from './pages/telecaller/Profile';
import TelecallerSettings from './pages/telecaller/Settings';
import TelecallerSecurity from './pages/telecaller/Security';

// Marketing team pages
import MarketingDashboard from './pages/marketingTeam/Dashboard';
import MarketingLeads from './pages/marketingTeam/Leads';
import MarketingActivities from './pages/marketingTeam/Activities';
import MarketingReports from './pages/marketingTeam/Reports';
import MarketingCommunication from './pages/marketingTeam/Communication';
import MarketingNotifications from './pages/marketingTeam/Notifications';
import MarketingProfile from './pages/marketingTeam/Profile';
import MarketingSettings from './pages/marketingTeam/Settings';
import MarketingSecurity from './pages/marketingTeam/Security';
import B2BMarketingProfile from './pages/b2bMarketing/Profile';
import B2BMarketingSettings from './pages/b2bMarketing/Settings';
import B2BMarketingSecurity from './pages/b2bMarketing/Security';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ModalProvider>
          <Router>
            <Routes>
              {/* Marketing Routes */}
              <Route element={<MarketingLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/about" element={<About />} />
                <Route path="/services" element={<Services />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/counselors" element={<CounselorManagement />} />
                  <Route path="/admin/counselor-monitoring" element={<CounselorMonitoring />} />
                  <Route path="/admin/students" element={<StudentManagement />} />
                  <Route path="/admin/students/:studentId/progress" element={<ApplicationProgress />} />
                  <Route path="/admin/universities" element={<UniversityManagement />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/telecallers" element={<TelecallerManagement />} />
                  <Route path="/admin/telecallers/:id/dashboard" element={<TelecallerDashboardAdmin />} />
                  <Route path="/admin/marketing-team" element={<MarketingTeamManagement />} />
                  <Route path="/admin/marketing-team/:id/leads" element={<MarketingMemberLeadsAdmin />} />
                  <Route path="/admin/b2b-marketing-team" element={<B2BMarketingTeamManagement />} />
                  <Route path="/admin/b2b-marketing-team/:id/leads" element={<B2BMarketingMemberLeadsAdmin />} />
                  <Route path="/admin/b2b-marketing-team/:id/leads" element={<B2BMarketingMemberLeadsAdmin />} />
                  <Route path="/admin/settings" element={<Settings />} />
                  <Route path="/admin/profile" element={<AdminProfile />} />
                  <Route path="/admin/security" element={<AdminSecurity />} />

                </Route>
              </Route>

              {/* Counselor Routes */}
              <Route element={<ProtectedRoute allowedRoles={['counselor']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/counselor" element={<Navigate to="/counselor/dashboard" replace />} />
                  <Route path="/counselor/dashboard" element={<CounselorDashboard />} />
                  <Route path="/counselor/students" element={<StudentList />} />
                  <Route path="/counselor/students/:id" element={<StudentDetails />} />
                  <Route path="/counselor/documents" element={<Documents />} />
                  <Route path="/counselor/applications" element={<Applications />} />
                  <Route path="/counselor/universities" element={<UniversityList />} />
                  <Route path="/counselor/tasks" element={<Tasks />} />


                  <Route path="/counselor/profile" element={<Profile />} />
                  <Route path="/counselor/settings" element={<CounselorSettings />} />
                  <Route path="/counselor/security" element={<CounselorSecurity />} />
                  <Route path="/counselor/notifications" element={<CounselorNotifications />} />
                </Route>
              </Route>

              {/* Telecaller Routes */}
              <Route element={<ProtectedRoute allowedRoles={['telecaller']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/telecaller" element={<Navigate to="/telecaller/dashboard" replace />} />
                  <Route path="/telecaller/dashboard" element={<TelecallerDashboard />} />
                  <Route path="/telecaller/tasks" element={<TelecallerTasks />} />
                  <Route path="/telecaller/follow-ups" element={<TelecallerFollowUps />} />
                  <Route path="/telecaller/activity" element={<TelecallerActivityLog />} />
                  <Route path="/telecaller/communication" element={<TelecallerCommunication />} />
                  <Route path="/telecaller/exports" element={<TelecallerExports />} />
                  <Route path="/telecaller/notifications" element={<TelecallerNotifications />} />
                  <Route path="/telecaller/profile" element={<TelecallerProfile />} />
                  <Route path="/telecaller/settings" element={<TelecallerSettings />} />
                  <Route path="/telecaller/security" element={<TelecallerSecurity />} />
                </Route>
              </Route>

              {/* Marketing Team Routes */}
              <Route element={<ProtectedRoute allowedRoles={['marketing']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/marketing" element={<Navigate to="/marketing/dashboard" replace />} />
                  <Route path="/marketing/dashboard" element={<MarketingDashboard />} />
                  <Route path="/marketing/leads" element={<MarketingLeads />} />
                  <Route path="/marketing/activities" element={<MarketingActivities />} />
                  <Route path="/marketing/reports" element={<MarketingReports />} />
                  <Route path="/marketing/communication" element={<MarketingCommunication />} />
                  <Route path="/marketing/notifications" element={<MarketingNotifications />} />
                  <Route path="/marketing/profile" element={<MarketingProfile />} />
                  <Route path="/marketing/settings" element={<MarketingSettings />} />
                  <Route path="/marketing/security" element={<MarketingSecurity />} />
                </Route>
              </Route>

              {/* B2B Marketing Team Routes */}
              <Route element={<ProtectedRoute allowedRoles={['b2b_marketing']} />}>
                <Route element={<DashboardLayout />}>
                  <Route path="/b2b-marketing" element={<Navigate to="/b2b-marketing/dashboard" replace />} />
                  <Route path="/b2b-marketing/dashboard" element={<MarketingDashboard />} />
                  <Route path="/b2b-marketing/leads" element={<MarketingLeads />} />
                  <Route path="/b2b-marketing/activities" element={<MarketingActivities />} />
                  <Route path="/b2b-marketing/reports" element={<MarketingReports />} />
                  <Route path="/b2b-marketing/communication" element={<MarketingCommunication />} />
                  <Route path="/b2b-marketing/notifications" element={<MarketingNotifications />} />
                  <Route path="/b2b-marketing/profile" element={<B2BMarketingProfile />} />
                  <Route path="/b2b-marketing/settings" element={<B2BMarketingSettings />} />
                  <Route path="/b2b-marketing/security" element={<B2BMarketingSecurity />} />
                </Route>
              </Route>

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ModalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;