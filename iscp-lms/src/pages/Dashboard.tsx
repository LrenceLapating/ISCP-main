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
          getAnnouncementData()
        ]);
        
        // Get unread message count
        const contacts = await studentService.getContacts();
        setUnreadMessageCount(contacts.reduce((total, contact) => total + contact.unread, 0));
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

    window.addEventListener('user-updated', handleUserUpdate);
    
    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, [user]);

  return (
    <StudentLayout title="Dashboard">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" mb={3}>
          Welcome, {firstName || 'Student'}
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
                  Courses
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
                  View all
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
                <Assignment sx={{ color: theme.palette.warning.main, mr: 1 }} />
                <Typography variant="h6" color="white">
                  Assignments
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
                  View all
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
                  GPA
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
                  View all
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
                <Email sx={{ color: theme.palette.info.main, mr: 1 }} />
                <Typography variant="h6" color="white">
                  Messages
                </Typography>
              </Box>
              <Typography variant="h4" component="div" fontWeight="bold" color="white">
                {unreadMessageCount}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Button
                  component={RouterLink}
                  to="/messages"
                  size="small"
                  endIcon={<ChevronRight />}
                  sx={{ textTransform: 'none', ml: 'auto' }}
                >
                  View all
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
        
        {/* Assignments */}
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Assignment Progress
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3, mb: 4 }}>
          {upcomingAssignments.length > 0 ? (
            upcomingAssignments.map((assignment, index) => (
              <Box sx={{ gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' }, width: '100%' }} key={index}>
                <Card
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="white">
                        {assignment.title}
                      </Typography>
                      <Chip
                        label={`Due ${new Date(assignment.dueDate).toLocaleDateString()}`}
                        size="small"
                        sx={{
                          bgcolor: alpha(theme.palette.warning.main, 0.1),
                          color: theme.palette.warning.main,
                          borderRadius: 1
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mb={2}>
                      {assignment.courseCode}: {assignment.courseName}
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          Progress
                        </Typography>
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          {assignment.progress}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={assignment.progress || 0}
                        sx={{
                          height: 6,
                          borderRadius: 1,
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: theme.palette.primary.main
                          }
                        }}
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2, borderColor: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                      component={RouterLink}
                      to={`/assignments/${assignment.id}`}
                    >
                      Continue
                    </Button>
                  </CardContent>
                </Card>
              </Box>
            ))
          ) : (
            <Box sx={{ gridColumn: 'span 12', width: '100%' }}>
              <Paper
                sx={{
                  p: 3,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" align="center">
                  No assignments due.
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>
        
        {/* Announcements */}
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Campus Announcements
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
          <List sx={{ p: 0 }}>
            {announcements.length > 0 ? (
              announcements.map((announcement, index) => (
                <React.Fragment key={announcement.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      px: 3,
                      py: 2,
                      bgcolor: announcement.important
                        ? alpha(theme.palette.error.main, 0.05)
                        : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.03)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: announcement.important
                            ? alpha(theme.palette.error.main, 0.1)
                            : alpha(theme.palette.primary.main, 0.1),
                          color: announcement.important
                            ? theme.palette.error.main
                            : theme.palette.primary.main
                        }}
                      >
                        <Campaign />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography
                            variant="subtitle1"
                            color="white"
                            fontWeight={announcement.read ? 400 : 600}
                            sx={{ mr: 1 }}
                          >
                            {announcement.title}
                          </Typography>
                          {announcement.important && (
                            <Chip
                              label="Important"
                              size="small"
                              sx={{
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: theme.palette.error.main,
                                height: 20,
                                fontSize: '0.7rem'
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            variant="body2"
                            color="rgba(255, 255, 255, 0.7)"
                            component="div"
                          >
                            {announcement.content}
                          </Typography>
                          <Box 
                            component="div" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mt: 1 
                            }}
                          >
                            <AccessTime
                              sx={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', mr: 0.5 }}
                            />
                            <Typography
                              variant="caption"
                              color="rgba(255, 255, 255, 0.5)"
                              component="span"
                            >
                              {announcement.date}
                            </Typography>
                            <Box
                              component="span"
                              sx={{
                                height: 4,
                                width: 4,
                                bgcolor: 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '50%',
                                mx: 1
                              }}
                            />
                            <Typography
                              variant="caption"
                              color="rgba(255, 255, 255, 0.5)"
                              component="span"
                            >
                              {announcement.campus}
                            </Typography>
                          </Box>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  {index < announcements.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" align="center">
                      No announcements available.
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
          {announcements.length > 0 && (
            <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Button
                endIcon={<ArrowForward />}
                sx={{ textTransform: 'none' }}
                component={RouterLink}
                to="/dashboard?view=announcements"
              >
                View all announcements
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </StudentLayout>
  );
};

export default Dashboard; 