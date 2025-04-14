/**
 * Schedule.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 6, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Student schedule page for viewing course timetables,
 * upcoming classes, and academic calendar.
 */

import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid as MuiGrid,
  Button,
  Chip,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Today,
  AccessTime,
  Room,
  VideoCameraFront,
  ChevronRight,
  CalendarMonth,
  CalendarToday,
  CalendarViewWeek,
  CalendarViewMonth,
  MoreVert,
  Person,
  School
} from '@mui/icons-material';
import studentService, { ClassSession } from '../../services/StudentService';

// Sample class data
const CLASSES = [
  {
    id: 1,
    title: 'Multiversal Diplomacy',
    code: 'MDI-501',
    date: 'Monday, April 15, 2023',
    startTime: '11:00 AM',
    endTime: '12:30 PM',
    location: 'Virtual Room 12A',
    instructor: 'Dr. Strange',
    meetingLink: 'https://iscp.edu/virtual-room/12A',
    status: 'upcoming',
    materials: ['Lecture Slides', 'Reading Material'],
    color: '#1976d2'
  },
  {
    id: 2,
    title: 'Time Travel Ethics',
    code: 'TTE-340',
    date: 'Monday, April 15, 2023',
    startTime: '2:00 PM',
    endTime: '3:30 PM',
    location: 'Quantum Hall 305',
    instructor: 'Prof. Paradox',
    status: 'upcoming',
    materials: ['Week 5 Notes', 'Case Study Documents'],
    color: '#e91e63'
  },
  {
    id: 3,
    title: 'Quantum Physics Lab',
    code: 'QPH-210',
    date: 'Tuesday, April 16, 2023',
    startTime: '9:00 AM',
    endTime: '11:00 AM',
    location: 'Science Lab 201',
    instructor: 'Dr. Nova',
    status: 'upcoming',
    materials: ['Lab Instructions', 'Safety Protocols'],
    color: '#9c27b0'
  },
  {
    id: 4,
    title: 'Astral Projection',
    code: 'AST-180',
    date: 'Tuesday, April 16, 2023',
    startTime: '1:00 PM',
    endTime: '2:30 PM',
    location: 'Meditation Hall',
    instructor: 'Prof. Astral',
    status: 'upcoming',
    materials: ['Meditation Guide'],
    color: '#ff9800'
  },
  {
    id: 5,
    title: 'Telepathic Communication',
    code: 'TRP-150',
    date: 'Wednesday, April 17, 2023',
    startTime: '1:00 PM',
    endTime: '2:30 PM',
    location: 'Mind Lab 101',
    instructor: 'Dr. Psyche',
    status: 'upcoming',
    materials: ['Practice Exercises'],
    color: '#4caf50'
  }
];

// Group classes by day
const groupClassesByDay = (classes: any[]) => {
  return classes.reduce((acc: any, curr: any) => {
    if (!acc[curr.date]) {
      acc[curr.date] = [];
    }
    acc[curr.date].push(curr);
    return acc;
  }, {});
};

// Custom time slot component
const TimeSlot = ({ classInfo }: { classInfo: any }) => {
  return (
    <Card 
      elevation={0} 
      sx={{ 
        mb: 2, 
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'transform 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      <Box sx={{ display: 'flex', borderLeft: `4px solid ${classInfo.color}` }}>
        <Box sx={{ 
          width: 110, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          p: 2,
          bgcolor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
            {classInfo.startTime}
          </Typography>
          <Box sx={{ 
            height: 40, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Box sx={{ 
              width: 2, 
              height: '100%', 
              bgcolor: 'rgba(255, 255, 255, 0.2)' 
            }} />
          </Box>
          <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
            {classInfo.endTime}
          </Typography>
        </Box>
        
        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" component="div" sx={{ color: '#fff', fontWeight: 500 }}>
                {classInfo.title}
              </Typography>
              <Chip 
                label={classInfo.code} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.1)', 
                  color: '#fff',
                  mt: 0.5
                }} 
              />
            </Box>
            <IconButton size="small" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              <MoreVert fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Room fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }} />
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                {classInfo.location}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Person fontSize="small" sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }} />
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                {classInfo.instructor}
              </Typography>
            </Box>
          </Box>
          
          {classInfo.meetingLink && (
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<VideoCameraFront />}
              sx={{ 
                mt: 2, 
                borderColor: 'rgba(255, 255, 255, 0.3)', 
                color: '#fff',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#fff',
                }
              }}
            >
              Join Virtual Class
            </Button>
          )}
        </CardContent>
      </Box>
    </Card>
  );
};

const DaySchedule = ({ date, classes }: { date: string, classes: any[] }) => {
  const dateParts = date.split(', ');
  const dayOfWeek = dateParts[0];
  const restOfDate = dateParts.slice(1).join(', ');
  
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        mb: 2, 
        pb: 1,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Avatar 
          sx={{ 
            bgcolor: 'primary.main', 
            width: 36, 
            height: 36, 
            mr: 1.5,
            fontSize: '0.875rem'
          }}
        >
          {dayOfWeek.substring(0, 2)}
        </Avatar>
        <Box>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              color: '#fff', 
              fontWeight: 600,
              lineHeight: 1.2
            }}
          >
            {dayOfWeek}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              display: 'block'
            }}
          >
            {restOfDate}
          </Typography>
        </Box>
      </Box>
      
      {classes.map((classInfo) => (
        <TimeSlot key={classInfo.id} classInfo={classInfo} />
      ))}
    </Box>
  );
};

const Schedule: React.FC = () => {
  const [view, setView] = useState(0);
  const [classSessions, setClassSessions] = useState<ClassSession[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleViewChange = (event: React.SyntheticEvent, newValue: number) => {
    setView(newValue);
  };

  useEffect(() => {
    // Load class sessions
    const sessions = studentService.getSchedule();
    setClassSessions(sessions);
  }, []);

  const handleMarkAttendance = (sessionId: number, attended: boolean) => {
    const success = studentService.markAttendance(sessionId, attended);
    
    if (success) {
      // Refresh the schedule
      const sessions = studentService.getSchedule();
      setClassSessions(sessions);
      
      setSnackbar({
        open: true,
        message: attended ? 'Marked as attended' : 'Marked as absent',
        severity: 'success'
      });
    }
  };

  return (
    <StudentLayout title="My Schedule">
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              color: '#fff',
              mb: 1
            }}
          >
            Class Schedule
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            View and manage your upcoming classes
          </Typography>
        </Box>
        
        {/* Schedule Controls */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 4, 
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { sm: 'center' },
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 2 }}>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ mb: 0.5 }}>
                Current Week
              </Typography>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                April 15 - April 21, 2023
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button 
                size="small" 
                variant="outlined"
                sx={{ 
                  minWidth: 0, 
                  p: 0.5,
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  }
                }}
              >
                &lt;
              </Button>
              <Button 
                size="small" 
                variant="outlined"
                sx={{ 
                  minWidth: 0, 
                  p: 0.5,
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  }
                }}
              >
                &gt;
              </Button>
            </Box>
          </Box>
          
          <Box>
            <Tabs
              value={view}
              onChange={handleViewChange}
              sx={{
                minHeight: 36,
                '& .MuiTab-root': {
                  minHeight: 36,
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#fff',
                  }
                }
              }}
            >
              <Tab 
                icon={<CalendarViewWeek fontSize="small" />} 
                iconPosition="start" 
                label="Weekly" 
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                icon={<CalendarViewMonth fontSize="small" />} 
                iconPosition="start" 
                label="Monthly" 
                sx={{ textTransform: 'none' }}
              />
              <Tab 
                icon={<CalendarToday fontSize="small" />} 
                iconPosition="start" 
                label="Today" 
                sx={{ textTransform: 'none' }}
              />
            </Tabs>
          </Box>
        </Paper>

        {/* Weekly Schedule View */}
        {view === 0 && (
          <MuiGrid container spacing={3}>
            <MuiGrid sx={{ gridColumn: { xs: 'span 12', md: 'span 8' } }}>
              {/* Schedule List View */}
              <Box>
                {Object.entries(groupClassesByDay(CLASSES)).map(([date, classes]) => (
                  <DaySchedule key={date} date={date} classes={classes as any[]} />
                ))}
              </Box>
            </MuiGrid>
            
            <MuiGrid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
              {/* Upcoming Classes Summary */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%'
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#fff', 
                    mb: 2,
                    pb: 1,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Today's Schedule
                </Typography>
                
                <List sx={{ px: 0 }}>
                  {CLASSES.filter(c => c.date.includes('April 15')).map((classInfo) => (
                    <ListItem 
                      key={classInfo.id}
                      disablePadding
                      sx={{ 
                        mb: 2,
                        pb: 2,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        '&:last-child': {
                          mb: 0,
                          pb: 0,
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: classInfo.color }}>
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500 }}>
                            {classInfo.title}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <AccessTime fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                              <Typography variant="caption">
                                {classInfo.startTime} - {classInfo.endTime}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <Room fontSize="small" sx={{ mr: 0.5, fontSize: 16 }} />
                              <Typography variant="caption">
                                {classInfo.location}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          <ChevronRight />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#fff', 
                    mb: 2,
                    pb: 1,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  Course Materials
                </Typography>
                
                <List sx={{ px: 0 }}>
                  {CLASSES.filter(c => c.date.includes('April 15')).map((classInfo) => (
                    classInfo.materials.map((material, index) => (
                      <ListItem 
                        key={`${classInfo.id}-${index}`}
                        sx={{ 
                          py: 0.75,
                          px: 0,
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          '&:last-child': {
                            borderBottom: 'none'
                          }
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Typography variant="body2" sx={{ color: '#fff' }}>
                              {material}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                              {classInfo.title}
                            </Typography>
                          }
                        />
                        <Button 
                          size="small" 
                          variant="text" 
                          sx={{ 
                            color: 'primary.main',
                            textTransform: 'none' 
                          }}
                        >
                          View
                        </Button>
                      </ListItem>
                    ))
                  ))}
                </List>
              </Paper>
            </MuiGrid>
          </MuiGrid>
        )}

        {/* Monthly View Placeholder */}
        {view === 1 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <CalendarMonth sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
              Monthly View Coming Soon
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              We're working on a monthly calendar view for better scheduling
            </Typography>
          </Paper>
        )}
        
        {/* Today View Placeholder */}
        {view === 2 && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'center'
            }}
          >
            <Today sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
              Today's Detail View Coming Soon
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              We're enhancing the daily view with more interactive features
            </Typography>
          </Paper>
        )}
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            minWidth: 200,
            boxShadow: 2,
            bgcolor: snackbar.severity === 'success' ? 'success.dark' : 'error.dark',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </StudentLayout>
  );
};

export default Schedule; 