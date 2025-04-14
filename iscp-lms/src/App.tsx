/**
 * App.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: March 26, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Main application component that sets up routing, context providers,
 * and the overall application structure. Manages role-based navigation and protection.
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyDashboard from './pages/faculty/Dashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Courses from './pages/student/Courses';
import Assignments from './pages/student/Assignments';
import Grades from './pages/student/Grades';
import Messages from './pages/student/Messages';
import Settings from './pages/student/Settings';
import FacultySettings from './pages/faculty/Settings';
import FacultyCourses from './pages/faculty/Courses';
import FacultyAssignments from './pages/faculty/Assignments';
import AssignmentSubmissions from './pages/faculty/AssignmentSubmissions';
import FacultyMaterials from './pages/faculty/Materials';
import FacultyStudents from './pages/faculty/Students';
import FacultyDiscussions from './pages/faculty/Discussions';
import FacultyMessages from './pages/faculty/Messages';
import AdminSettings from './pages/admin/Settings';
import UserManagement from './pages/admin/UserManagement';
import CourseManagement from './pages/admin/CourseManagement';
import AnnouncementManagement from './pages/admin/AnnouncementManagement';
import SystemManagement from './pages/admin/SystemManagement';
import AcademicArchives from './pages/admin/AcademicArchives';
import AdminMessages from './pages/admin/Messages';
import Materials from './pages/student/Materials';
import OfflineModePage from './pages/student/OfflineMode';
import Students from './pages/faculty/Students';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Mock component for student assignments only
const MockAssignments = () => <div>Assignments Component (Mock)</div>;

// Protected route component
const ProtectedRoute = ({ children, allowedRoles = [] }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { authState } = useAuth();

  if (!authState.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && authState.user?.role && !allowedRoles.includes(authState.user.role)) {
    // Redirect based on role
    if (authState.user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (authState.user.role === 'teacher') {
      return <Navigate to="/faculty/dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
};

// Auth route component for login/register
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();

  if (authState.isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (authState.user?.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (authState.user?.role === 'teacher') {
      return <Navigate to="/faculty/dashboard" />;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CssBaseline />
        <Box sx={{ 
          display: 'flex', 
          minHeight: '100vh',
          width: '100%',
          overflow: 'hidden'
        }}>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/login" element={
                  <AuthRoute>
                    <Login />
                  </AuthRoute>
                } />
                <Route path="/register" element={
                  <AuthRoute>
                    <Register />
                  </AuthRoute>
                } />
                
                {/* Student Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/courses" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Courses />
                  </ProtectedRoute>
                } />
                <Route path="/assignments" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Assignments />
                  </ProtectedRoute>
                } />
                <Route path="/grades" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Grades />
                  </ProtectedRoute>
                } />
                <Route path="/messages" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Messages />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/materials" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <Materials />
                  </ProtectedRoute>
                } />
                <Route path="/offline-mode" element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <OfflineModePage />
                  </ProtectedRoute>
                } />
                
                {/* Faculty Routes */}
                <Route 
                  path="/faculty/dashboard" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <FacultyDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/faculty/courses" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <FacultyCourses />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/faculty/students" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <Students />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/faculty/messages" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <FacultyMessages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/faculty/assignments" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <FacultyAssignments />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/faculty/assignments/:assignmentId/submissions" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <AssignmentSubmissions />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/faculty/materials" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <FacultyMaterials />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/faculty/discussions" 
                  element={
                    <ProtectedRoute allowedRoles={['faculty', 'teacher']}>
                      <FacultyDiscussions />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/faculty/discussions/:discussionId" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <FacultyDiscussions />
                  </ProtectedRoute>
                } />
                <Route path="/faculty/discussions/create" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <FacultyDiscussions />
                  </ProtectedRoute>
                } />
                <Route path="/faculty/settings" element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <FacultySettings />
                  </ProtectedRoute>
                } />
                
                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/courses" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <CourseManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/messages" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminMessages />
                  </ProtectedRoute>
                } />
                <Route path="/admin/announcements" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AnnouncementManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/archives" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AcademicArchives />
                  </ProtectedRoute>
                } />
                <Route path="/admin/system" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SystemManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminSettings />
                  </ProtectedRoute>
                } />
                
                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="*" element={<Navigate to="/login" />} />
              </Routes>
            </Router>
          </AuthProvider>
        </Box>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
