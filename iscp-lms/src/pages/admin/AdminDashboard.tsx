/**
 * AdminDashboard.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 11, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator dashboard with system statistics, user metrics,
 * course information, and system health monitoring.
 */

import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent, Divider, useTheme, alpha, CircularProgress } from '@mui/material';
import AdminLayout from '../../components/AdminLayout';
import { 
  PeopleAlt, 
  LibraryBooks, 
  Announcement, 
  Storage, 
  Speed, 
  School, 
  Settings, 
  NotificationsActive,
  Assessment,
  Forum
} from '@mui/icons-material';
import adminService from '../../services/AdminService';
import { useNavigate } from 'react-router-dom';

// Interface for dashboard metrics
interface DashboardMetrics {
  activeUsers: number;
  activeCourses: number;
  totalAnnouncements: number;
  pendingRequests: number;
  unreadNotifications: number;
  storageUsed: string;
  serverLoad: string;
  averageResponseTime: string;
  usersByRole?: {
    students: number;
    teachers: number;
    admins: number;
  };
  coursesByDepartment?: Record<string, number>;
  coursesByStatus?: {
    active: number;
    inactive: number;
  };
  recentUsers?: any[];
  recentCourses?: any[];
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeUsers: 0,
    activeCourses: 0,
    totalAnnouncements: 0,
    pendingRequests: 0,
    unreadNotifications: 0,
    storageUsed: '0 GB',
    serverLoad: '0%',
    averageResponseTime: '0ms'
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // Load user profile
        const userSettings = await adminService.getUserSettings();
        if (userSettings) {
          setFirstName(userSettings.firstName);
        }
        
        // Load dashboard metrics
        const dashboardStats = await adminService.getDashboardStats();
        setMetrics(dashboardStats);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Listen for user profile updates
  useEffect(() => {
    const handleUserUpdated = () => {
      console.log('User update event received in Admin Dashboard');
      // Reload user profile when it's updated
      adminService.getUserSettings().then(settings => {
        if (settings) setFirstName(settings.firstName);
      });
    };

    // Add event listener
    window.addEventListener('user-updated', handleUserUpdated);
    
    // Clean up
    return () => {
      window.removeEventListener('user-updated', handleUserUpdated);
    };
  }, []);

  // Navigation handlers
  const handleNavigateToUsers = () => {
    navigate('/admin/users');
  };

  const handleNavigateToCourses = () => {
    navigate('/admin/courses');
  };

  const handleNavigateToAnnouncements = () => {
    navigate('/admin/announcements');
  };

  const handleNavigateToArchives = () => {
    navigate('/admin/archives');
  };

  const handleNavigateToSystemMonitor = () => {
    navigate('/admin/system');
  };

  const handleNavigateToMessages = () => {
    navigate('/admin/messages');
  };

  const handleNavigateToSettings = () => {
    navigate('/admin/settings');
  };

  return (
    <AdminLayout title="Dashboard">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" color="white" mb={3}>
          Welcome, {firstName}
        </Typography>
        <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" mb={4}>
          Manage users, courses, and system-wide settings across all ISCP campuses.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Quick Stats */}
            <Grid container spacing={3} mb={4}>
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' }, width: '100%', px: 1.5 }}>
                <Paper sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <PeopleAlt sx={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" color="white" fontWeight="bold">
                        {metrics.activeUsers}
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Active Users
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
              
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' }, width: '100%', px: 1.5 }}>
                <Paper sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <LibraryBooks sx={{ color: theme.palette.success.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" color="white" fontWeight="bold">
                        {metrics.activeCourses}
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Active Courses
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
              
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' }, width: '100%', px: 1.5 }}>
                <Paper sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.info.main, 0.1), 
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <Announcement sx={{ color: theme.palette.info.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" color="white" fontWeight="bold">
                        {metrics.totalAnnouncements}
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Announcements
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Grid>

            {/* Additional metrics row */}
            <Grid container spacing={3} mb={4}>
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' }, width: '100%', px: 1.5 }}>
                <Paper sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <Assessment sx={{ color: theme.palette.warning.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" color="white" fontWeight="bold">
                        {metrics.pendingRequests}
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Pending Requests
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
              
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' }, width: '100%', px: 1.5 }}>
                <Paper sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.error.main, 0.1), 
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <NotificationsActive sx={{ color: theme.palette.error.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" color="white" fontWeight="bold">
                        {metrics.unreadNotifications}
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Unread Notifications
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
              
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' }, width: '100%', px: 1.5 }}>
                <Paper sx={{ 
                  p: 2, 
                  height: '100%',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                      borderRadius: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      mr: 2
                    }}>
                      <Speed sx={{ color: theme.palette.secondary.main }} />
                    </Box>
                    <Box>
                      <Typography variant="h5" color="white" fontWeight="bold">
                        {metrics.serverLoad}
                      </Typography>
                      <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                        Server Load
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Grid>

            {/* Quick Links */}
            <Box mb={3}>
              <Typography variant="h6" color="white" mb={1}>
                Quick Actions
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Grid container spacing={2}>
                  <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 4', md: 'span 3' }, width: '100%', px: 1 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={handleNavigateToUsers}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          borderRadius: '50%',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <PeopleAlt sx={{ color: theme.palette.primary.main, fontSize: '1.2rem' }} />
                        </Box>
                        <Typography variant="subtitle1" color="white">
                          User Management
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  
                  <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 4', md: 'span 3' }, width: '100%', px: 1 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={handleNavigateToCourses}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.success.main, 0.1), 
                          borderRadius: '50%',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <LibraryBooks sx={{ color: theme.palette.success.main, fontSize: '1.2rem' }} />
                        </Box>
                        <Typography variant="subtitle1" color="white">
                          Course Management
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  
                  <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 4', md: 'span 3' }, width: '100%', px: 1 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={handleNavigateToAnnouncements}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.warning.main, 0.1), 
                          borderRadius: '50%',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <Announcement sx={{ color: theme.palette.warning.main, fontSize: '1.2rem' }} />
                        </Box>
                        <Typography variant="subtitle1" color="white">
                          Announcements
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                  
                  <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 4', md: 'span 3' }, width: '100%', px: 1 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={handleNavigateToMessages}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.info.main, 0.1), 
                          borderRadius: '50%',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <Forum sx={{ color: theme.palette.info.main, fontSize: '1.2rem' }} />
                        </Box>
                        <Typography variant="subtitle1" color="white">
                          Messages
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>

                  {/* Second row for additional quick action cards */}
                  <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 4', md: 'span 3' }, width: '100%', px: 1 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={handleNavigateToArchives}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                          borderRadius: '50%',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <School sx={{ color: theme.palette.secondary.main, fontSize: '1.2rem' }} />
                        </Box>
                        <Typography variant="subtitle1" color="white">
                          Academic Archives
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 4', md: 'span 3' }, width: '100%', px: 1 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={handleNavigateToSystemMonitor}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.error.main, 0.1), 
                          borderRadius: '50%',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <Storage sx={{ color: theme.palette.error.main, fontSize: '1.2rem' }} />
                        </Box>
                        <Typography variant="subtitle1" color="white">
                          System Monitor
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>

                  <Box sx={{ gridColumn: { xs: 'span 6', sm: 'span 4', md: 'span 3' }, width: '100%', px: 1 }}>
                    <Card 
                      sx={{ 
                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        height: '100%',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.3)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)'
                        },
                        cursor: 'pointer'
                      }}
                      onClick={handleNavigateToSettings}
                    >
                      <CardContent sx={{ textAlign: 'center', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Box sx={{ 
                          p: 1, 
                          bgcolor: alpha(theme.palette.primary.light, 0.1), 
                          borderRadius: '50%',
                          display: 'inline-flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          mb: 0.5
                        }}>
                          <Settings sx={{ color: theme.palette.primary.light, fontSize: '1.2rem' }} />
                        </Box>
                        <Typography variant="subtitle1" color="white">
                          Settings
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AdminDashboard; 