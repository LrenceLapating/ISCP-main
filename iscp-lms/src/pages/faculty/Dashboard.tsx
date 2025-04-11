import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  IconButton,
  Tabs,
  Tab,
  Card,
  CardContent,
  LinearProgress,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  ButtonBase,
  Theme
} from '@mui/material';
import { SxProps } from '@mui/system';
import {
  ArrowUpward,
  Person,
  School,
  Assignment,
  QuestionAnswer,
  AccessTime,
  Notifications,
  Upload,
  MoreVert,
  Check,
  Send
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import facultyService, { Notification } from '../../services/FacultyService';
import GridItem from '../../components/common/GridItem';
import { format, formatDistanceToNow } from 'date-fns';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { authState } = useAuth();
  const { user } = authState;
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    courses: 0,
    totalStudents: 0,
    pendingTasks: 0,
    inquiries: 0,
    creditHours: 0,
    newStudents: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch notifications
        const notificationData = await facultyService.getNotifications();
        setNotifications(notificationData.slice(0, 5)); // Only show the 5 most recent
        
        // Fetch courses data
        const coursesData = await facultyService.getMyCourses();
        setCourses(coursesData);
        
        // Calculate stats from real data
        const totalStudents = coursesData.reduce((total, course) => total + (course.enrolledStudents || 0), 0);
        const creditHours = coursesData.reduce((total, course) => total + (course.credits || 0), 0);
        
        // Fetch pending tasks (assignments that need grading)
        let pendingTasks = 0;
        for (const course of coursesData) {
          const assignments = await facultyService.getCourseAssignments(course.id);
          pendingTasks += assignments.reduce((count, assignment) => {
            const ungraded = (assignment.submissions_count || 0) - (assignment.graded_count || 0);
            return count + ungraded;
          }, 0);
        }
        
        // Save calculated stats
        setStats({
          courses: coursesData.length,
          totalStudents,
          pendingTasks,
          inquiries: 12, // This could be fetched from a messages API
          creditHours,
          newStudents: 15 // Could be calculated based on enrollment dates
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Fallback to mock data if API fails
        setStats({
          courses: 4,
          totalStudents: 129,
          pendingTasks: 8,
          inquiries: 12,
          creditHours: 12,
          newStudents: 15
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUploadMaterials = () => {
    navigate('/faculty/materials');
  };

  const handleNavigateToCourses = () => {
    navigate('/faculty/courses');
  };

  const handleNavigateToAssignments = () => {
    navigate('/faculty/assignments');
  };

  const handleNavigateToStudents = () => {
    navigate('/faculty/students');
  };

  const handleNavigateToMessages = () => {
    navigate('/faculty/messages');
  };

  // Summary card component
  const StatCard = ({ title, value, subtitle, icon, color }: { title: string, value: React.ReactNode, subtitle?: string, icon?: React.ReactNode, color?: string }) => (
    <Card sx={{ 
      height: '100%', 
      bgcolor: '#1c2a56', 
      borderRadius: 2,
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
            {title}
          </Typography>
          {icon && (
            <Box sx={{ 
              p: 1, 
              bgcolor: `${color || '#212c62'}`, 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </Box>
          )}
        </Box>
        
        <Typography variant="h3" component="div" sx={{ mb: 1, fontWeight: 700, color: '#fff' }}>
          {value}
        </Typography>
        
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center' }}>
            {subtitle.includes('new') && <ArrowUpward fontSize="small" sx={{ color: '#4caf50', mr: 0.5 }} />}
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Add notification functions
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If within the last hour, show minutes ago
    if (now.getTime() - date.getTime() < 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // If today, show time
    if (now.toDateString() === date.toDateString()) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    
    // Within the last day, show "Yesterday at time"
    if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    
    // Older
    return format(date, 'MMM d, yyyy');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Assignment sx={{ color: '#1976d2' }} />;
      case 'submission':
        return <Send sx={{ color: '#f44336' }} />;
      case 'grade':
        return <Assignment sx={{ color: '#4caf50' }} />;
      case 'course':
        return <School sx={{ color: '#2196f3' }} />;
      case 'message':
        return <QuestionAnswer sx={{ color: '#ff9800' }} />;
      default:
        return <Notifications sx={{ color: '#9e9e9e' }} />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await facultyService.markNotificationAsRead(notification.id);
      
      // Navigate based on notification type
      if (notification.related_id) {
        switch (notification.type) {
          case 'assignment':
            navigate(`/faculty/assignments/${notification.related_id}`);
            break;
          case 'submission':
            navigate(`/faculty/assignments/${notification.related_id}/submissions`);
            break;
          case 'course':
            navigate(`/faculty/courses/${notification.related_id}`);
            break;
          case 'message':
            navigate('/faculty/messages');
            break;
          default:
            navigate('/faculty/dashboard');
            break;
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await facultyService.markAllNotificationsAsRead();
      setNotifications(prevNotifications =>
        prevNotifications.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Add notification panel component
  const NotificationPanel = () => (
    <Card sx={{ 
      height: '100%', 
      bgcolor: '#1c2a56', 
      borderRadius: 2,
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            Notifications
          </Typography>
          {notifications.some(n => !n.is_read) && (
            <Button 
              size="small" 
              startIcon={<Check />} 
              onClick={handleMarkAllAsRead}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                textTransform: 'none', 
                '&:hover': { color: '#fff' } 
              }}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              No new notifications
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem 
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 2,
                    px: 2,
                    borderLeft: '4px solid',
                    borderLeftColor: notification.is_read 
                      ? 'transparent' 
                      : notification.type === 'submission' 
                        ? '#f44336' 
                        : '#1976d2',
                    bgcolor: notification.is_read 
                      ? 'transparent' 
                      : 'rgba(25, 118, 210, 0.08)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: notification.is_read ? 'rgba(255, 255, 255, 0.7)' : '#fff',
                          fontWeight: notification.is_read ? 400 : 600,
                          mb: 0.5
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        {notification.type === 'submission' && notification.message.includes(' has submitted') && (
                          <Typography 
                            component="span" 
                            variant="body2" 
                            sx={{ 
                              color: '#f44336',
                              fontWeight: 500,
                              fontSize: '0.8rem',
                              display: 'block',
                              mb: 0.5
                            }}
                          >
                            {notification.message.split(' has submitted')[0]}
                            <Typography 
                              component="span" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)', 
                                fontWeight: 400
                              }}
                            >
                              {' has submitted'}
                            </Typography>
                          </Typography>
                        )}
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.5)', 
                            fontSize: '0.75rem',
                            display: 'block',
                            whiteSpace: 'normal', 
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {notification.type === 'submission' && notification.message.includes(' has submitted')
                            ? notification.message.split(' has submitted')[1]
                            : notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.4)', 
                            fontSize: '0.7rem',
                            display: 'block',
                            mt: 0.5
                          }}
                        >
                          {formatNotificationDate(notification.created_at)}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  {!notification.is_read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: notification.type === 'submission' ? '#f44336' : 'primary.main',
                      }}
                    />
                  )}
                </ListItem>
                <Divider 
                  sx={{ 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    m: 0
                  }}
                />
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  return (
    <FacultyLayout title="Dashboard">
      {/* Main Content Section */}
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, bgcolor: '#0a1128', width: '100%' }}>
        <Container maxWidth="xl">
          {/* Header Section */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ fontWeight: 700, mb: 1, color: '#fff' }}
              >
                Welcome, Professor {user?.fullName?.split(' ')[0] || 'Lorsss'}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Manage your courses and help shape the future of interdimensional education.
              </Typography>
            </Box>

            {/* Action buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              flexWrap: 'wrap'
            }}>
              <Button 
                variant="contained" 
                startIcon={<Upload />}
                sx={{ 
                  bgcolor: '#1976d2', 
                  '&:hover': { bgcolor: '#1565c0' },
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3
                }}
                onClick={handleUploadMaterials}
              >
                Upload Materials
              </Button>
            </Box>
          </Box>
          
          {/* Statistics and Notifications Grid */}
          <Grid container spacing={3} sx={{ mb: 5 }}>
            <GridItem xs={12} sm={6} md={3}>
              <StatCard 
                title="Active Courses" 
                value={stats.courses}
                subtitle={`${stats.creditHours} credit hours total`}
                icon={<School sx={{ color: '#fff' }} />}
                color="#c62828"
              />
            </GridItem>
            <GridItem xs={12} sm={6} md={3}>
              <StatCard 
                title="Total Students" 
                value={stats.totalStudents}
                subtitle={`${stats.newStudents} new this semester`}
                icon={<Person sx={{ color: '#fff' }} />}
                color="#2e7d32"
              />
            </GridItem>
            <GridItem xs={12} sm={6} md={3}>
              <StatCard 
                title="Pending Tasks" 
                value={stats.pendingTasks}
                subtitle="3 due today"
                icon={<Assignment sx={{ color: '#fff' }} />}
                color="#ff9800"
              />
            </GridItem>
            <GridItem xs={12} sm={6} md={3}>
              <StatCard 
                title="Student Inquiries" 
                value={stats.inquiries}
                subtitle="5 unresponded"
                icon={<QuestionAnswer sx={{ color: '#fff' }} />}
                color="#0277bd"
              />
            </GridItem>
            
            {/* Add Notifications Panel */}
            <GridItem xs={12} md={6}>
              <NotificationPanel />
            </GridItem>
            
            {/* Add Quick Actions Panel */}
            <GridItem xs={12} md={6}>
              <Card sx={{ 
                height: '100%', 
                bgcolor: '#1c2a56', 
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<School />}
                      onClick={handleNavigateToCourses}
                      sx={{ 
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.3)', 
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        py: 1.5,
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    >
                      My Courses
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={handleNavigateToAssignments}
                      sx={{ 
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.3)', 
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        py: 1.5,
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    >
                      Assignments
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Person />}
                      onClick={handleNavigateToStudents}
                      sx={{ 
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.3)', 
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        py: 1.5,
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    >
                      Students
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<QuestionAnswer />}
                      onClick={handleNavigateToMessages}
                      sx={{ 
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.3)', 
                        textTransform: 'none',
                        justifyContent: 'flex-start',
                        py: 1.5,
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.05)',
                          borderColor: 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    >
                      Messages
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>
          
          {/* Tab navigation for secondary content */}
          <Box sx={{ mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 500,
                  textTransform: 'none',
                  minWidth: 120,
                  '&.Mui-selected': {
                    color: '#fff',
                    fontWeight: 700
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme => theme.palette.primary.main,
                  height: 3
                }
              }}
            >
              <Tab label="My Courses" />
              <Tab label="Pending Actions" />
              <Tab label="Student Inquiries" />
              <Tab label="Announcements" />
              <Tab label="Discussions" />
              <Tab label="Content Moderation" />
            </Tabs>
          </Box>
          
          {/* Tab content */}
          <Box sx={{ p: 1 }}>
            {tabValue === 0 && (
              <Box sx={{ minHeight: 200 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : courses.length > 0 ? (
                  <Grid container spacing={2}>
                    {courses.map(course => (
                      <GridItem xs={12} md={6} lg={4} key={course.id}>
                        <Card 
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 2,
                            transition: 'transform 0.2s, box-shadow 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                              cursor: 'pointer'
                            }
                          }}
                          onClick={() => navigate(`/faculty/courses/${course.id}`)}
                        >
                          <CardContent>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                              {course.code}
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                              {course.title}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {course.enrolledStudents || 0} students
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                {course.credits} credits
                              </Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={course.progress || 0} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 4,
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: theme => theme.palette.primary.main
                                }
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)', 
                                display: 'block',
                                textAlign: 'right',
                                mt: 0.5
                              }}
                            >
                              {course.progress || 0}% complete
                            </Typography>
                          </CardContent>
                        </Card>
                      </GridItem>
                    ))}
                  </Grid>
                ) : (
                  <Typography align="center" color="rgba(255, 255, 255, 0.7)">
                    No courses found. Click on "My Courses" in the sidebar to add courses.
                  </Typography>
                )}
              </Box>
            )}
            {tabValue === 1 && (
              <Box sx={{ minHeight: 200 }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Typography align="center" color="rgba(255, 255, 255, 0.7)">
                    Pending actions will appear here. Go to Assignments to grade submissions.
                  </Typography>
                )}
              </Box>
            )}
            {tabValue === 2 && <Box sx={{ minHeight: 200 }}><Typography align="center" color="rgba(255, 255, 255, 0.7)">Student inquiries will appear here.</Typography></Box>}
            {tabValue === 3 && <Box sx={{ minHeight: 200 }}><Typography align="center" color="rgba(255, 255, 255, 0.7)">Announcements will appear here.</Typography></Box>}
            {tabValue === 4 && <Box sx={{ minHeight: 200 }}><Typography align="center" color="rgba(255, 255, 255, 0.7)">Discussion threads will appear here.</Typography></Box>}
            {tabValue === 5 && <Box sx={{ minHeight: 200 }}><Typography align="center" color="rgba(255, 255, 255, 0.7)">Content moderation tasks will appear here.</Typography></Box>}
          </Box>
        </Container>
      </Box>
    </FacultyLayout>
  );
};

export default Dashboard; 