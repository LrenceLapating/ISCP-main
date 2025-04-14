/**
 * Discussions.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 10, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Faculty discussion board management page for creating
 * and moderating course discussions.
 */

import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container, Typography, Box, Grid, Paper, Button, IconButton,
  Card, CardContent, CardActions, CircularProgress, Alert,
  TextField, InputAdornment, Divider, Chip, Avatar, Badge,
  useTheme, alpha
} from '@mui/material';
import {
  Search, Add, Forum, Comment, Message, QuestionAnswer,
  Group, Visibility, MoreVert, Reply
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facultyService, { Course, Discussion } from '../../services/FacultyService';
import GridItem from '../../components/common/GridItem';

interface DiscussionThread {
  id: number;
  title: string;
  course: string;
  courseId: number;
  participants: number;
  replies: number;
  lastActive: string;
  createdBy: string;
  createdAt: string;
  isAnnouncement: boolean;
  isLocked: boolean;
  isPinned: boolean;
  unread: boolean;
}

const Discussions: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [discussions, setDiscussions] = useState<DiscussionThread[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Simulated discussion data
  const sampleDiscussions: DiscussionThread[] = [
    {
      id: 1,
      title: "Welcome to the course! Introductions",
      course: "Introduction to Computer Science",
      courseId: 1,
      participants: 24,
      replies: 35,
      lastActive: "2 hours ago",
      createdBy: "Dr. Jane Smith",
      createdAt: "2023-09-01",
      isAnnouncement: true,
      isLocked: false,
      isPinned: true,
      unread: true
    },
    {
      id: 2,
      title: "Assignment #2 Questions Thread",
      course: "Web Development Fundamentals",
      courseId: 2,
      participants: 16,
      replies: 28,
      lastActive: "1 day ago",
      createdBy: "Dr. John Doe",
      createdAt: "2023-09-15",
      isAnnouncement: false,
      isLocked: false,
      isPinned: false,
      unread: false
    },
    {
      id: 3,
      title: "Study Group for Final Project",
      course: "Database Systems",
      courseId: 3,
      participants: 12,
      replies: 19,
      lastActive: "3 days ago",
      createdBy: "Student: James Wilson",
      createdAt: "2023-09-20",
      isAnnouncement: false,
      isLocked: false,
      isPinned: false,
      unread: false
    },
    {
      id: 4,
      title: "Important: Midterm Exam Information",
      course: "Introduction to Computer Science",
      courseId: 1,
      participants: 32,
      replies: 15,
      lastActive: "6 hours ago",
      createdBy: "Dr. Jane Smith",
      createdAt: "2023-09-25",
      isAnnouncement: true,
      isLocked: true,
      isPinned: true,
      unread: true
    },
    {
      id: 5,
      title: "Help with Java Exception Handling",
      course: "Object-Oriented Programming",
      courseId: 4,
      participants: 8,
      replies: 12,
      lastActive: "2 days ago",
      createdBy: "Student: Maria Garcia",
      createdAt: "2023-09-28",
      isAnnouncement: false,
      isLocked: false,
      isPinned: false,
      unread: false
    }
  ];
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchDiscussions = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching faculty courses for discussions...');
        const fetchedCourses = await facultyService.getMyCourses();
        setCourses(fetchedCourses);
        
        console.log('Fetching discussions for courses...');
        const allDiscussionThreads: DiscussionThread[] = [];
        
        for (const course of fetchedCourses) {
          const courseDiscussions = await facultyService.getCourseDiscussions(course.id);
          
          // Map API discussions to DiscussionThread format
          const discussionThreads = courseDiscussions.map(discussion => ({
            id: discussion.id,
            title: discussion.title,
            course: course.title,
            courseId: course.id,
            participants: discussion.participants || 0,
            replies: discussion.replies || 0,
            lastActive: discussion.lastActive || discussion.updatedAt || discussion.createdAt,
            createdBy: `Faculty ID: ${discussion.createdBy}`, // This would need to be replaced with actual names
            createdAt: discussion.createdAt,
            isAnnouncement: discussion.isAnnouncement || false,
            isLocked: discussion.isLocked || false,
            isPinned: discussion.isPinned || false,
            unread: false // This would need to be determined by comparing with last read timestamps
          }));
          
          allDiscussionThreads.push(...discussionThreads);
        }
        
        setDiscussions(allDiscussionThreads);
      } catch (err) {
        console.error('Error fetching discussions:', err);
        setError('Failed to load discussions. Please try again later.');
        
        // Fallback to mock data if API calls fail
        const mockCourses: Course[] = [
          {
            id: 1,
            code: 'CS101',
            title: 'Introduction to Computer Science',
            description: 'An introductory course to computer science principles',
            teacherId: 1,
            credits: 3,
            maxStudents: 30,
            campus: 'Main Campus',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            enrolledStudents: 25,
            progress: 60
          },
          {
            id: 2,
            code: 'CS202',
            title: 'Data Structures & Algorithms',
            description: 'Study of data structures and algorithms analysis',
            teacherId: 1,
            credits: 4,
            maxStudents: 25,
            campus: 'Main Campus',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            enrolledStudents: 20,
            progress: 45
          }
        ];
        
        // Mock discussion threads
        const mockDiscussionThreads: DiscussionThread[] = [
          {
            id: 1,
            title: 'Welcome to CS101',
            course: 'Introduction to Computer Science',
            courseId: 1,
            participants: 25,
            replies: 20,
            lastActive: new Date().toISOString(),
            createdBy: 'Dr. Jane Smith',
            createdAt: new Date().toISOString(),
            isAnnouncement: true,
            isLocked: false,
            isPinned: true,
            unread: true
          },
          {
            id: 2,
            title: 'Final Project Discussion',
            course: 'Introduction to Computer Science',
            courseId: 1,
            participants: 15,
            replies: 12,
            lastActive: new Date().toISOString(),
            createdBy: 'Dr. Jane Smith',
            createdAt: new Date().toISOString(),
            isAnnouncement: false,
            isLocked: false,
            isPinned: false,
            unread: false
          },
          {
            id: 3,
            title: 'Midterm Exam Information',
            course: 'Data Structures & Algorithms',
            courseId: 2,
            participants: 18,
            replies: 10,
            lastActive: new Date().toISOString(),
            createdBy: 'Dr. John Doe',
            createdAt: new Date().toISOString(),
            isAnnouncement: true,
            isLocked: false,
            isPinned: true,
            unread: true
          },
          {
            id: 4,
            title: 'Binary Trees vs. Binary Search Trees',
            course: 'Data Structures & Algorithms',
            courseId: 2,
            participants: 10,
            replies: 8,
            lastActive: new Date().toISOString(),
            createdBy: 'Dr. John Doe',
            createdAt: new Date().toISOString(),
            isAnnouncement: false,
            isLocked: false,
            isPinned: false,
            unread: false
          }
        ];
        
        setCourses(mockCourses);
        setDiscussions(mockDiscussionThreads);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscussions();
  }, []);
  
  // Filter discussions based on search query
  const filteredDiscussions = discussions.filter(thread => 
    thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    thread.course.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleCreateDiscussion = () => {
    navigate('/faculty/discussions/create');
  };
  
  const handleDiscussionClick = (discussionId: number) => {
    navigate(`/faculty/discussions/${discussionId}`);
  };
  
  return (
    <FacultyLayout title="Discussions">
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header with controls */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 3,
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: '#fff',
                mb: 1
              }}
            >
              Course Discussions
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Manage and participate in discussion forums for your courses
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            width: { xs: '100%', md: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{
                width: { xs: '100%', sm: '250px' },
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderRadius: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateDiscussion}
              sx={{
                borderRadius: 1,
                textTransform: 'none',
                fontWeight: 500,
                bgcolor: theme.palette.secondary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.8)
                }
              }}
            >
              New Discussion
            </Button>
          </Box>
        </Box>
        
        {/* Main content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 3 }}>
            {error}
          </Alert>
        ) : filteredDiscussions.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Forum sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              No discussions found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              {searchQuery 
                ? 'No discussions match your search criteria.'
                : 'You have not created any discussions yet.'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateDiscussion}
            >
              Create New Discussion
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredDiscussions.map((thread) => (
              <GridItem xs={12} key={thread.id}>
                <Card 
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderLeft: thread.isPinned ? `4px solid ${theme.palette.primary.main}` : undefined,
                    transition: 'transform 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                  onClick={() => handleDiscussionClick(thread.id)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box 
                        sx={{ 
                          p: 1.5,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(
                            thread.isAnnouncement 
                              ? theme.palette.warning.main 
                              : theme.palette.primary.main,
                            0.1
                          ),
                          color: thread.isAnnouncement 
                            ? theme.palette.warning.main 
                            : theme.palette.primary.main
                        }}
                      >
                        {thread.isAnnouncement ? <Message /> : <Forum />}
                      </Box>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography 
                            variant="body1" 
                            component="h3" 
                            sx={{ 
                              fontWeight: thread.unread ? 700 : 500,
                              color: '#fff',
                              mr: 1
                            }}
                          >
                            {thread.title}
                          </Typography>
                          
                          {thread.unread && (
                            <Chip 
                              label="New" 
                              size="small" 
                              color="primary"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem',
                                fontWeight: 600
                              }} 
                            />
                          )}
                          
                          {thread.isLocked && (
                            <Chip 
                              label="Locked" 
                              size="small" 
                              color="error"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                ml: 1
                              }} 
                            />
                          )}
                          
                          {thread.isPinned && (
                            <Chip 
                              label="Pinned" 
                              size="small" 
                              color="secondary"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                ml: 1
                              }} 
                            />
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.5)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            Course: {thread.course}
                          </Typography>
                        </Box>
                        
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: { xs: 1, sm: 2 }
                          }}
                        >
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Group sx={{ fontSize: 16, mr: 0.5 }} />
                            {thread.participants} Participants
                          </Typography>
                          
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Comment sx={{ fontSize: 16, mr: 0.5 }} />
                            {thread.replies} Replies
                          </Typography>
                          
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <QuestionAnswer sx={{ fontSize: 16, mr: 0.5 }} />
                            Last Active: {thread.lastActive}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ ml: 2 }}>
                        <IconButton 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.7)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // handle actions
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: 2, pt: 0, pb: 2 }}>
                    <Button 
                      size="small" 
                      variant="text"
                      startIcon={<Reply />}
                      sx={{ 
                        color: theme.palette.primary.main,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDiscussionClick(thread.id);
                      }}
                    >
                      View Discussion
                    </Button>
                  </CardActions>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}
      </Container>
    </FacultyLayout>
  );
};

export default Discussions; 