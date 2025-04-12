import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  LinearProgress,
  ListItemAvatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { 
  ArrowForward,
  Assignment,
  LibraryBooks,
  Grade,
  Email,
  ChevronRight,
  Campaign,
  AccessTime
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Link as RouterLink } from 'react-router-dom';
import studentService, { Assignment as StudentAssignment, Announcement, Grade as StudentGrade } from '../services/StudentService';
import StudentLayout from '../components/StudentLayout';

interface Assignment extends StudentAssignment {
  progress?: number;
}

// Define custom announcement interface - rename to avoid conflicts
interface CampusAnnouncement {
  id: string | number;
  title: string;
  content: string;
  date: string;
  campus: string;
  important: boolean;
  read: boolean;
}

const Dashboard: React.FC = () => {
  const { authState } = useAuth();
  const { user } = authState;
  const theme = useTheme();
  const { language, t } = useLanguage();

  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>([]);
  const [gpa, setGpa] = useState(0);
  const [courseCount, setCourseCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [firstName, setFirstName] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Function to check if a URL is a data URL
  const isDataUrl = (url: string): boolean => {
    return url?.startsWith('data:image/');
  };

  // Function to format profile image URL
  const formatProfileUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    
    // If it's already a data URL or an absolute URL, return as is
    if (isDataUrl(url) || url.startsWith('http')) {
      return url;
    }
    
    // Otherwise, prepend the API base URL
    return `http://localhost:5000${url}`;
  };

  // Get real assignment progress data
  const getAssignmentProgress = async () => {
    try {
      const allAssignments = await studentService.getAssignmentsFromAPI();
      
      // Get only pending assignments
      const pendingAssignments = allAssignments
        .filter(a => a.status === 'pending')
        .map(a => ({
          ...a,
          // Calculate progress (in a real app this would come from the API)
          progress: a.submissionText || a.submissionFile ? 75 : 0
        }))
        .slice(0, 3); // Get only 3 for display
      
      setUpcomingAssignments(pendingAssignments);
      setAssignmentCount(allAssignments.filter(a => a.status === 'pending').length);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setUpcomingAssignments([]);
      setAssignmentCount(0);
    }
  };

  // Get real course count data
  const getCourseCount = async () => {
    try {
      const courses = await studentService.getEnrolledCourses();
      setCourseCount(courses.length);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourseCount(0);
    }
  };

  // Get real GPA data
  const getGpaData = async () => {
    try {
      const grades = await studentService.getGradesFromAPI();
      // If API call succeeds, use calculated GPA
      const gpaValue = studentService.calculateGPA();
      setGpa(gpaValue);
    } catch (error) {
      console.error('Error fetching GPA:', error);
      setGpa(0);
    }
  };

  // Get real announcements
  const getAnnouncementData = async () => {
    try {
      const announcementData = await studentService.getAnnouncements();
      
      // Map to our campus announcement format
      const campusAnnouncements = announcementData.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.date ? new Date(a.date).toLocaleDateString() : 'N/A',
        campus: a.campus || 'All Campuses',
        important: a.important || false,
        read: a.read || false
      }));
      
      setAnnouncements(campusAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    }
  };

  // Get unread message count
  const getUnreadMessageCount = async () => {
    try {
      const count = await studentService.getUnreadMessageCount();
      setUnreadMessageCount(count);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      setUnreadMessageCount(0);
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      try {
        // Load user settings to get the first name
        const settings = await studentService.getUserSettings();
        if (settings && settings.first_name) {
          setFirstName(settings.first_name);
        } else if (user?.fullName) {
          // Fallback to the first part of the full name
          setFirstName(user.fullName.split(' ')[0]);
        }
        
        // Set profile image URL if available
        if (settings && settings.profile_picture) {
          setProfileImageUrl(formatProfileUrl(settings.profile_picture));
        } else if (user?.profileImage) {
          setProfileImageUrl(formatProfileUrl(user.profileImage));
        }
        
        // Load all data in parallel
        await Promise.all([
          getAssignmentProgress(),
          getCourseCount(),
          getGpaData(),
          getAnnouncementData(),
          getUnreadMessageCount()
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // Listen for user update events
    const handleUserUpdate = () => {
      console.log('User update event received in Dashboard');
      loadDashboardData();
    };

    // Listen for new message events
    const handleNewMessage = () => {
      console.log('New message event received in Dashboard');
      getUnreadMessageCount();
    };

    window.addEventListener('user-updated', handleUserUpdate);
    window.addEventListener('message-received', handleNewMessage);
    window.addEventListener('message-read', handleNewMessage);
    
    // Poll for new messages every 30 seconds
    const messagePollingInterval = setInterval(() => {
      getUnreadMessageCount();
    }, 30000);
    
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
      window.removeEventListener('message-received', handleNewMessage);
      window.removeEventListener('message-read', handleNewMessage);
      clearInterval(messagePollingInterval);
    };
  }, [user]);

  return (
    <StudentLayout title={t('dashboard')}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" mb={3}>
          {language === 'English' ? 
            `Welcome, ${firstName || 'Student'}` : 
            `Maligayang pagdating, ${firstName || 'Estudyante'}`}
        </Typography>
        
        {/* Quick Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' }, width: '100%' }}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <LibraryBooks sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" color="white">
                  {language === 'English' ? 'Courses' : 'Mga Kurso'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold" color="white">
                {courseCount}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/courses"
                  size="small"
                  endIcon={<ChevronRight />}
                  sx={{ textTransform: 'none', ml: 'auto' }}
                >
                  {language === 'English' ? 'View all' : 'Tingnan lahat'}
                </Button>
              </Box>
            </Paper>
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' }, width: '100%' }}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Assignment sx={{ color: theme.palette.error.main, mr: 1 }} />
                <Typography variant="h6" color="white">
                  {language === 'English' ? 'Assignments' : 'Mga Takdang-aralin'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold" color="white">
                {assignmentCount}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/assignments"
                  size="small"
                  endIcon={<ChevronRight />}
                  sx={{ textTransform: 'none', ml: 'auto' }}
                >
                  {language === 'English' ? 'View all' : 'Tingnan lahat'}
                </Button>
              </Box>
            </Paper>
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' }, width: '100%' }}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Grade sx={{ color: theme.palette.success.main, mr: 1 }} />
                <Typography variant="h6" color="white">
                  {language === 'English' ? 'GPA' : 'GPA'}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold" color="white">
                {gpa.toFixed(2)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/grades"
                  size="small"
                  endIcon={<ChevronRight />}
                  sx={{ textTransform: 'none', ml: 'auto' }}
                >
                  {language === 'English' ? 'Details' : 'Mga Detalye'}
                </Button>
              </Box>
            </Paper>
          </Box>
          
          <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 3' }, width: '100%' }}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email sx={{ color: theme.palette.warning.main, mr: 1 }} />
                <Typography variant="h6" color="white">
                  {language === 'English' ? 'Messages' : 'Mga Mensahe'}
                </Typography>
                {unreadMessageCount > 0 && (
                  <Box
                    sx={{
                      ml: 1,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: theme.palette.error.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: unreadMessageCount > 0 ? 'pulse 1.5s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': {
                          boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                        },
                        '70%': {
                          boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                        },
                        '100%': {
                          boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                        },
                      },
                    }}
                  />
                )}
              </Box>
              <Typography 
                variant="h4" 
                component="div" 
                fontWeight="bold" 
                color="white"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {unreadMessageCount}
                {unreadMessageCount > 0 && (
                  <Typography
                    variant="subtitle2"
                    component="span"
                    sx={{
                      ml: 1,
                      color: theme.palette.error.main,
                      fontSize: '0.875rem',
                      backgroundColor: alpha(theme.palette.error.main, 0.1),
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                    }}
                  >
                    {language === 'English' ? 'New' : 'Bago'}
                  </Typography>
                )}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/messages"
                  size="small"
                  endIcon={<ChevronRight />}
                  sx={{ 
                    textTransform: 'none', 
                    ml: 'auto',
                    color: unreadMessageCount > 0 ? theme.palette.error.main : undefined,
                    fontWeight: unreadMessageCount > 0 ? 'bold' : 'normal',
                  }}
                >
                  {language === 'English' ? 'Open inbox' : 'Buksan ang inbox'}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
        
        {/* Main content */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
          {/* Upcoming Assignments */}
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
            <Typography variant="h6" component="h2" fontWeight="bold" mb={2} color="white">
              {language === 'English' ? 'Upcoming Assignments' : 'Darating na Mga Takdang-aralin'}
            </Typography>
            <Paper
              sx={{
                p: 0,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                mb: 4
              }}
            >
              {upcomingAssignments.length > 0 ? (
                <List sx={{ width: '100%', bgcolor: 'transparent', p: 0 }}>
                  {upcomingAssignments.map((assignment, index) => (
                    <React.Fragment key={assignment.id}>
                      <ListItem 
                        alignItems="flex-start"
                        component={RouterLink}
                        to={`/assignments/${assignment.id}`}
                        sx={{ 
                          display: 'block',
                          p: 2,
                          color: 'white',
                          textDecoration: 'none',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.05)'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', mb: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {assignment.title}
                          </Typography>
                          <Chip 
                            label={language === 'English' ? `Due ${assignment.dueDate}` : `Hanggang ${assignment.dueDate}`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                            icon={<AccessTime sx={{ fontSize: '1rem !important' }} />}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                          {assignment.courseName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={assignment.progress || 0} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 5,
                                backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: theme.palette.primary.main
                                }
                              }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {`${assignment.progress || 0}%`}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < upcomingAssignments.length - 1 && (
                        <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {language === 'English' ? 'No upcoming assignments' : 'Walang darating na mga takdang-aralin'}
                  </Typography>
                </Box>
              )}
            </Paper>
            
            {/* Announcements */}
            <Typography variant="h6" component="h2" fontWeight="bold" mb={2} color="white">
              {language === 'English' ? 'Announcements' : 'Mga Anunsyo'}
            </Typography>
            <Paper
              sx={{
                p: 0,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}
            >
              {announcements.length > 0 ? (
                <List sx={{ width: '100%', bgcolor: 'transparent', p: 0 }}>
                  {announcements.slice(0, 3).map((announcement, index) => (
                    <React.Fragment key={announcement.id}>
                      <ListItem 
                        alignItems="flex-start"
                        sx={{ 
                          p: 2,
                          color: 'white',
                          bgcolor: announcement.important ? alpha(theme.palette.warning.main, 0.1) : 'transparent'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: announcement.important ? theme.palette.warning.main : theme.palette.grey[700] }}>
                            <Campaign />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                                {announcement.title}
                              </Typography>
                              {announcement.important && (
                                <Chip 
                                  label={language === 'English' ? 'Important' : 'Mahalaga'} 
                                  size="small" 
                                  color="warning"
                                  sx={{ ml: 1 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'inline' }}
                              >
                                {announcement.content.length > 120 
                                  ? `${announcement.content.substring(0, 120)}...` 
                                  : announcement.content}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                  {announcement.date} • {announcement.campus}
                                </Typography>
                                <Button size="small" sx={{ ml: 'auto', textTransform: 'none' }}>
                                  {language === 'English' ? 'Read more' : 'Magbasa pa'}
                                </Button>
                              </Box>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      {index < announcements.length - 1 && (
                        <Divider component="li" sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="textSecondary" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {language === 'English' ? 'No announcements' : 'Walang mga anunsyo'}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>
          
          {/* Profile Card */}
          <Box sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <Card
              sx={{
                p: 0,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                mb: 3
              }}
            >
              <Box
                sx={{
                  height: 100,
                  backgroundColor: theme.palette.primary.main,
                  backgroundImage: 'linear-gradient(to right, rgba(25, 118, 210, 0.8), rgba(25, 118, 210, 0.6))'
                }}
              />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 3,
                  mt: -6
                }}
              >
                <Avatar
                  alt={user?.fullName || 'User'}
                  src={profileImageUrl}
                  sx={{
                    width: 100,
                    height: 100,
                    border: '4px solid rgba(255, 255, 255, 0.2)',
                    mb: 2
                  }}
                >
                  {!profileImageUrl && user?.fullName && user.fullName.charAt(0)}
                </Avatar>
                <Typography variant="h6" component="div" fontWeight="bold" align="center" gutterBottom>
                  {user?.fullName || 'Student'}
                </Typography>
                <Typography color="textSecondary" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                  {user?.email || 'student@iscp.edu'}
                </Typography>
                <Chip 
                  label={user?.campus || 'Campus'}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="outlined"
                  component={RouterLink}
                  to="/settings"
                  sx={{ textTransform: 'none', width: '100%', mt: 2 }}
                >
                  {language === 'English' ? 'Edit Profile' : 'I-edit ang Profile'}
                </Button>
              </Box>
            </Card>
            
            {/* Quick Links */}
            <Paper
              sx={{
                p: 2,
                bgcolor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden'
              }}
            >
              <Typography variant="h6" component="h2" fontWeight="bold" mb={2} color="white">
                {language === 'English' ? 'Quick Links' : 'Mabilisang Links'}
              </Typography>
              <List>
                <ListItem component={RouterLink} to="/courses" sx={{ p: 1, borderRadius: 1, color: 'white', textDecoration: 'none', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                  <ListItemText primary={language === 'English' ? "My Courses" : "Mga Kurso Ko"} />
                  <ChevronRight sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </ListItem>
                <ListItem component={RouterLink} to="/grades" sx={{ p: 1, borderRadius: 1, color: 'white', textDecoration: 'none', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                  <ListItemText primary={language === 'English' ? "Grade Report" : "Ulat ng Grado"} />
                  <ChevronRight sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </ListItem>
                <ListItem component={RouterLink} to="/materials" sx={{ p: 1, borderRadius: 1, color: 'white', textDecoration: 'none', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                  <ListItemText primary={language === 'English' ? "Learning Materials" : "Mga Materyales sa Pag-aaral"} />
                  <ChevronRight sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </ListItem>
                <ListItem component={RouterLink} to="/settings" sx={{ p: 1, borderRadius: 1, color: 'white', textDecoration: 'none', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' } }}>
                  <ListItemText primary={language === 'English' ? "Account Settings" : "Mga Setting ng Account"} />
                  <ChevronRight sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                </ListItem>
              </List>
            </Paper>
          </Box>
        </Box>
      </Box>
    </StudentLayout>
  );
};

export default Dashboard; 