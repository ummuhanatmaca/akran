import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './layouts/ProtectedRoute';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Tutors } from './pages/Tutors';
import { UserDetail } from './pages/UserDetail';
import { SupportCreate } from './pages/SupportCreate';
import { SupportRequests } from './pages/SupportRequests';
import { SupportSessions } from './pages/SupportSessions';
import { Materials } from './pages/Materials';
import { MaterialUpload } from './pages/MaterialUpload';
import { StudyGroups } from './pages/StudyGroups';
import { LearningGoals } from './pages/LearningGoals';
import { Opportunities } from './pages/Opportunities';
import { Guides } from './pages/Guides';
import { TeamFinder } from './pages/TeamFinder';
import { Pomodoro } from './pages/Pomodoro';
import { Notifications } from './pages/Notifications';
import { AdminDashboard } from './pages/AdminDashboard';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="pomodoro" element={<Pomodoro />} />
            <Route path="tutors" element={<Tutors />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="materials" element={<Materials />} />
            <Route path="study-groups" element={<StudyGroups />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="guides" element={<Guides />} />
            <Route path="team-finder" element={<TeamFinder />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />

            {/* Authenticated Student Routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="support/create"
              element={
                <ProtectedRoute>
                  <SupportCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="support-requests"
              element={
                <ProtectedRoute>
                  <SupportRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="sessions"
              element={
                <ProtectedRoute>
                  <SupportSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="materials/upload"
              element={
                <ProtectedRoute>
                  <MaterialUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="goals"
              element={
                <ProtectedRoute>
                  <LearningGoals />
                </ProtectedRoute>
              }
            />
            <Route
              path="notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
