/**
 * Courses.tsx (Faculty)
 * 
 * Author: Marc Laurence Lapating
 * Date: April 7, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Faculty course management page for creating, editing,
 * and managing course content and enrollments.
 */

import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Grid,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  LinearProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search,
  Add,
  Person,
  Book,
  Timer,
  LocationOn,
  MoreVert,
  Edit,
  Delete,
  Grade,
  Assignment,
  VideoCall,
  School,
  LocalOffer as TagIcon,
  Pending,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facultyService, { Course } from '../../services/FacultyService';
import GridItem from '../../components/common/GridItem';

// Interface for faculty profile
interface FacultyProfile {
  id: number;
  email: string;
  full_name: string;
  campus: string;
  profile_image?: string;
  settings?: any;
}

const tabOptions = [
  { value: "available", label: "Available" },
  { value: "pending", label: "Pending Requests" },
  { value: "archived", label: "Archived" }
];

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [tabValue, setTabValue] = useState<string>("available");
  const [courseRequestDialogOpen, setCourseRequestDialogOpen] = useState<boolean>(false);
  const [facultyProfile, setFacultyProfile] = useState<FacultyProfile | null>(null);
  const [courseRequest, setCourseRequest] = useState({
    code: '',
    title: '',
    description: '',
    credits: 3,
    maxStudents: 30,
    campus: '',
    department: ''
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  
  // New state variables for course detail modal
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [archivingCourse, setArchivingCourse] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);

  useEffect(() => {
    fetchFacultyProfile();
    fetchCourses();
  }, []);

  useEffect(() => {
    // Filter courses based on search query
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCourses(
        courses.filter(
          course =>
            course.title?.toLowerCase().includes(query) ||
            course.code?.toLowerCase().includes(query) ||
            course.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, courses]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesData = await facultyService.getMyCourses();
      
      // Separate active courses from pending requests
      const active = coursesData.filter(course => 
        !course.request_status || course.request_status === 'approved'
      );
      
      const pending = coursesData.filter(course => 
        course.request_status === 'pending' || course.request_status === 'rejected'
      );
      
      setCourses(active);
      setFilteredCourses(active);
      setPendingCourses(pending);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch faculty profile
  const fetchFacultyProfile = async () => {
    try {
      const profile = await facultyService.getProfile();
      setFacultyProfile(profile);
      
      // Update the course request with faculty's campus
      setCourseRequest(prev => ({
        ...prev,
        campus: profile.campus
      }));
    } catch (err) {
      console.error('Error fetching faculty profile:', err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setDetailModalOpen(true);
    setArchiveSuccess(false);
    setArchiveError(null);
  };

  const handleCreateDialogOpen = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setTabValue(newValue);
  };

  const handleCourseRequestDialogOpen = () => {
    // Ensure we have the faculty's campus
    if (facultyProfile) {
      setCourseRequest(prev => ({
        ...prev,
        campus: facultyProfile.campus
      }));
    }
    setCourseRequestDialogOpen(true);
    setRequestSuccess(false);
    setRequestError(null);
  };

  const handleCourseRequestDialogClose = () => {
    setCourseRequestDialogOpen(false);
    setCourseRequest({
      code: '',
      title: '',
      description: '',
      credits: 3,
      maxStudents: 30,
      campus: '',
      department: ''
    });
    setRequestSuccess(false);
    setRequestError(null);
  };
  
  const handleCourseRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Don't allow changing the campus field
    if (name === 'campus') return;
    
    setCourseRequest(prev => ({
      ...prev,
      [name]: name === 'credits' || name === 'maxStudents' ? Number(value) : value
    }));
  };
  
  const handleCourseRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestSubmitting(true);
    setRequestError(null);
    
    try {
      await facultyService.requestCourse(courseRequest);
      setRequestSuccess(true);
      
      // Refresh the pending courses list
      const coursesData = await facultyService.getMyCourses();
      const pending = coursesData.filter(course => 
        course.request_status === 'pending' || course.request_status === 'rejected'
      );
      setPendingCourses(pending);
      
      // Switch to pending tab to show the new request
      setTabValue('pending');
      
      setTimeout(() => {
        handleCourseRequestDialogClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting course request:', err);
      setRequestError('Failed to submit course request. Please try again.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Add a function to close the detail modal
  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setSelectedCourse(null);
  };

  // Add a function to handle course archiving
  const handleArchiveCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setArchivingCourse(true);
      setArchiveError(null);
      
      // Call the service to archive the course
      const response = await facultyService.archiveCourse(selectedCourse.id);
      
      // Update the courses list
      setCourses(prevCourses => 
        prevCourses.filter(course => course.id !== selectedCourse.id)
      );
      setFilteredCourses(prevCourses => 
        prevCourses.filter(course => course.id !== selectedCourse.id)
      );
      
      setArchiveSuccess(true);
      
      // Close the modal after a delay
      setTimeout(() => {
        setDetailModalOpen(false);
        setSelectedCourse(null);
      }, 2000);
      
    } catch (error) {
      console.error("Error archiving course:", error);
      setArchiveError("Failed to archive course. Please try again.");
    } finally {
      setArchivingCourse(false);
    }
  };

  const renderContent = () => {
    if (loading) {
  return (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
            </Box>
      );
    }
    
    if (error) {
      return (
        <Alert severity="error" sx={{ my: 3 }}>
          {error}
        </Alert>
      );
    }
    
    if (tabValue === 'pending') {
      return renderPendingCourses();
    } else if (tabValue === 'available') {
      return renderAvailableCourses();
    } else {
      return renderArchivedCourses();
    }
  };
  
  const renderAvailableCourses = () => {
    if (filteredCourses.length === 0) {
      return (
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
              <School sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
              <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
                No courses found
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                {searchQuery.trim() !== '' 
                  ? 'Try adjusting your search criteria'
                  : 'You have not been assigned any courses yet'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCourseRequestDialogOpen}
              >
                Request New Course
              </Button>
            </Paper>
      );
    }
    
    return (
            <Grid container spacing={3}>
              {filteredCourses.map((course) => (
                <GridItem xs={12} sm={6} md={4} key={course.id}>
                  <Card
                    onClick={() => handleCourseClick(course)}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 20px rgba(0, 0, 0, 0.2)',
                      },
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Box
                      sx={{
                        p: 2,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Chip
                        label={course.code}
                        size="small"
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: '#fff',
                          fontWeight: 500
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}
                      >
                        <Timer fontSize="inherit" /> Next class: {new Date(course.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        gutterBottom
                        sx={{ 
                          fontWeight: 600,
                          color: '#fff',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3,
                        }}
                      >
                        {course.title}
                      </Typography>
                      
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          mb: 2,
                          color: 'rgba(255, 255, 255, 0.6)',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          height: '3.6em'
                        }}
                      >
                        {course.description}
                      </Typography>
                      
                      <Box sx={{ mt: 'auto' }}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mb: 0.5
                        }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            <Grade fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} /> 
                            {course.credits} Credits
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            <LocationOn fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} /> 
                            {course.campus}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mt: 1.5
                        }}>
                          <Typography variant="body2" sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: 'rgba(255, 255, 255, 0.7)'
                          }}>
                            <Person fontSize="inherit" sx={{ mr: 0.5 }} /> 
                            {course.enrolledStudents || 0} / {course.maxStudents}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                              {course.progress || 0}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={course.progress || 0}
                              sx={{
                                width: 60,
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: 'primary.main',
                                }
                              }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </GridItem>
              ))}
            </Grid>
    );
  };
  
  const renderPendingCourses = () => {
    if (pendingCourses.length === 0) {
      return (
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
          <Pending sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
            No pending course requests
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
            You haven't submitted any course requests yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCourseRequestDialogOpen}
          >
            Request New Course
          </Button>
        </Paper>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {pendingCourses.map((course) => (
          <GridItem xs={12} sm={6} md={4} key={course.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Chip
                  label={course.code}
                  size="small"
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: '#fff',
                    fontWeight: 500
                  }}
                />
                <Chip 
                  icon={course.request_status === 'pending' ? <Pending fontSize="small" /> : <Cancel fontSize="small" />}
                  label={course.request_status === 'pending' ? 'Pending Approval' : 'Rejected'} 
                  color={course.request_status === 'pending' ? 'warning' : 'error'}
                  size="small"
                />
              </Box>
              
              <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  gutterBottom
                  sx={{ 
                    fontWeight: 600,
                    color: '#fff',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                >
                  {course.title}
                </Typography>
                
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    mb: 2,
                    color: 'rgba(255, 255, 255, 0.6)',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    height: '3.6em'
                  }}
                >
                  {course.description}
                </Typography>
                
                {course.request_status === 'rejected' && course.request_notes && (
                  <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>Feedback:</Typography>
                    <Typography variant="body2">{course.request_notes}</Typography>
                  </Alert>
                )}
                
                <Box sx={{ mt: 'auto' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    mb: 0.5
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      <Grade fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} /> 
                      {course.credits} Credits
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      <LocationOn fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} /> 
                      {course.campus}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        display: 'block',
                        textAlign: 'center'
                      }}
                    >
                      {course.request_status === 'pending' 
                        ? 'Your request is being reviewed by the administrator'
                        : 'Your request was rejected. See feedback above.'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </GridItem>
        ))}
      </Grid>
    );
  };
  
  const renderArchivedCourses = () => {
    return (
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
        <School sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
        <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
          No archived courses
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          You don't have any archived courses
        </Typography>
      </Paper>
    );
  };

  return (
    <FacultyLayout title="Courses">
      {/* Header Section */}
      <Box 
        sx={{
          width: '100%',
          background: 'linear-gradient(135deg, #0a1128 0%, #1c2a56 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          py: 4,
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" color="white" fontWeight="bold" gutterBottom>
                Your Courses
              </Typography>
              <Typography variant="subtitle1" color="rgba(255, 255, 255, 0.7)">
                Manage your courses and teaching materials
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleCourseRequestDialogOpen}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                Request New Course
              </Button>
            </Box>
          </Box>
          
          {/* Search & Filter Controls */}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <TextField
              placeholder="Search courses..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <Search sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }} />,
                sx: {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 1,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.1)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  },
                  color: 'white'
                }
              }}
              variant="outlined"
              fullWidth
              size="small"
            />
            
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="inherit"
              sx={{
                minWidth: 300,
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ffffff'
                },
                '& .MuiTab-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    color: '#ffffff'
                  }
                }
              }}
            >
              {tabOptions.map((option) => (
                <Tab key={option.value} label={option.label} value={option.value} />
              ))}
            </Tabs>
          </Box>
        </Container>
      </Box>
        
      {/* Main content */}
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, bgcolor: '#0a1128', width: '100%' }}>
        <Container maxWidth="xl">
          {renderContent()}
        </Container>
      </Box>
          
          {/* Create Course Dialog */}
          <Dialog
            open={createDialogOpen}
            onClose={handleCreateDialogClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 24,
              }
            }}
          >
            <DialogTitle>Request New Course Assignment</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <GridItem xs={12}>
                  <TextField
                    label="Course Title"
                    fullWidth
                    margin="dense"
                    required
                  />
                </GridItem>
                
                <GridItem xs={12} sm={6}>
                  <TextField
                    label="Course Code"
                    fullWidth
                    margin="dense"
                    required
                  />
                </GridItem>
                
                <GridItem xs={12} sm={6}>
                  <TextField
                    label="Credits"
                    fullWidth
                    margin="dense"
                    type="number"
                    inputProps={{ min: 1, max: 6 }}
                    required
                  />
                </GridItem>
                
                <GridItem xs={12} sm={6}>
                  <TextField
                    label="Max Students"
                    fullWidth
                    margin="dense"
                    type="number"
                    inputProps={{ min: 5, max: 200 }}
                    required
                  />
                </GridItem>
                
                <GridItem xs={12} sm={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Campus</InputLabel>
                    <Select
                      label="Campus"
                      defaultValue="Main Campus"
                    >
                      <MenuItem value="Main Campus">Main Campus</MenuItem>
                      <MenuItem value="East Wing">East Wing</MenuItem>
                      <MenuItem value="West Wing">West Wing</MenuItem>
                      <MenuItem value="Online">Online</MenuItem>
                    </Select>
                  </FormControl>
                </GridItem>
                
                <GridItem xs={12}>
                  <TextField
                    label="Course Description"
                    fullWidth
                    margin="dense"
                    multiline
                    rows={4}
                    required
                  />
                </GridItem>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCreateDialogClose}>Cancel</Button>
              <Button variant="contained" color="primary">
                Submit Request
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Course Request Dialog */}
          <Dialog open={courseRequestDialogOpen} onClose={handleCourseRequestDialogClose} maxWidth="md" fullWidth>
            <DialogTitle>
              Request New Course
            </DialogTitle>
            <form onSubmit={handleCourseRequestSubmit}>
              <DialogContent>
                {requestSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Course request submitted successfully! It will be reviewed by an administrator.
                  </Alert>
                )}
                {requestError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {requestError}
                  </Alert>
                )}
                
                <Grid container spacing={2}>
                  <GridItem item xs={12} sm={6}>
                    <TextField
                      label="Course Code"
                      name="code"
                      value={courseRequest.code}
                      onChange={handleCourseRequestChange}
                      fullWidth
                      required
                      margin="normal"
                      variant="outlined"
                      placeholder="e.g., CS101"
                    />
                  </GridItem>
                  <GridItem item xs={12} sm={6}>
                    <TextField
                      label="Department"
                      name="department"
                      value={courseRequest.department}
                      onChange={handleCourseRequestChange}
                      fullWidth
                      required
                      margin="normal"
                      variant="outlined"
                      placeholder="e.g., Computer Science"
                    />
                  </GridItem>
                  <GridItem item xs={12}>
                    <TextField
                      label="Course Title"
                      name="title"
                      value={courseRequest.title}
                      onChange={handleCourseRequestChange}
                      fullWidth
                      required
                      margin="normal"
                      variant="outlined"
                      placeholder="e.g., Introduction to Programming"
                    />
                  </GridItem>
                  <GridItem item xs={12}>
                    <TextField
                      label="Description"
                      name="description"
                      value={courseRequest.description}
                      onChange={handleCourseRequestChange}
                      fullWidth
                      required
                      multiline
                      rows={4}
                      margin="normal"
                      variant="outlined"
                      placeholder="Provide a detailed description of the course"
                    />
                  </GridItem>
                  <GridItem item xs={12} sm={4}>
                    <TextField
                      label="Credit Hours"
                      name="credits"
                      type="number"
                      value={courseRequest.credits}
                      onChange={handleCourseRequestChange}
                      fullWidth
                      required
                      margin="normal"
                      variant="outlined"
                      InputProps={{ inputProps: { min: 1, max: 6 } }}
                    />
                  </GridItem>
                  <GridItem item xs={12} sm={4}>
                    <TextField
                      label="Max Students"
                      name="maxStudents"
                      type="number"
                      value={courseRequest.maxStudents}
                      onChange={handleCourseRequestChange}
                      fullWidth
                      required
                      margin="normal"
                      variant="outlined"
                      InputProps={{ inputProps: { min: 5, max: 200 } }}
                    />
                  </GridItem>
                  <GridItem item xs={12} sm={4}>
                    <TextField
                      label="Campus"
                      name="campus"
                      value={courseRequest.campus}
                      onChange={handleCourseRequestChange}
                      fullWidth
                      required
                      margin="normal"
                      variant="outlined"
                  InputProps={{ readOnly: true }}
                />
                  </GridItem>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCourseRequestDialogClose} disabled={requestSubmitting}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  disabled={requestSubmitting}
                  startIcon={requestSubmitting ? <CircularProgress size={20} /> : null}
                >
                  {requestSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
          
          {/* Course Detail Modal */}
          <Dialog
            open={detailModalOpen}
            onClose={handleDetailModalClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
              sx: {
                backgroundColor: 'rgba(30, 40, 60, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                color: '#fff'
              }
            }}
          >
            {selectedCourse && (
              <>
                <DialogTitle sx={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  px: 3,
                  py: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={selectedCourse.code}
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.main',
                        color: '#fff',
                        fontWeight: 500,
                        mr: 2
                      }}
                    />
                    <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
                      {selectedCourse.title}
                    </Typography>
                  </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3, py: 3 }}>
                  {archiveSuccess && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                      Course archived successfully!
                    </Alert>
                  )}
                  
                  {archiveError && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {archiveError}
                    </Alert>
                  )}
                  
                  <Grid container spacing={3}>
                    <GridItem xs={12} md={8}>
                      <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                        Description
                      </Typography>
                      <Typography variant="body1" paragraph sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                        {selectedCourse.description}
                      </Typography>
                      
                      <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                          Course Details
                        </Typography>
                        <Grid container spacing={2}>
                          <GridItem xs={6}>
                            <Paper sx={{ 
                              p: 2, 
                              bgcolor: 'rgba(255, 255, 255, 0.05)', 
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <Grade sx={{ mr: 1.5, color: 'primary.main' }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Credits
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#fff' }}>
                                  {selectedCourse.credits}
                                </Typography>
                              </Box>
                            </Paper>
                          </GridItem>
                          <GridItem xs={6}>
                            <Paper sx={{ 
                              p: 2, 
                              bgcolor: 'rgba(255, 255, 255, 0.05)', 
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <Person sx={{ mr: 1.5, color: 'primary.main' }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Enrollment
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#fff' }}>
                                  {selectedCourse.enrolledStudents || 0} / {selectedCourse.maxStudents}
                                </Typography>
                              </Box>
                            </Paper>
                          </GridItem>
                          <GridItem xs={6}>
                            <Paper sx={{ 
                              p: 2, 
                              bgcolor: 'rgba(255, 255, 255, 0.05)', 
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <LocationOn sx={{ mr: 1.5, color: 'primary.main' }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Campus
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#fff' }}>
                                  {selectedCourse.campus}
                                </Typography>
                              </Box>
                            </Paper>
                          </GridItem>
                          <GridItem xs={6}>
                            <Paper sx={{ 
                              p: 2, 
                              bgcolor: 'rgba(255, 255, 255, 0.05)', 
                              borderRadius: 1,
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <School sx={{ mr: 1.5, color: 'primary.main' }} />
                              <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  Progress
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#fff' }}>
                                  {selectedCourse.progress || 0}%
                                </Typography>
                              </Box>
                            </Paper>
                          </GridItem>
                        </Grid>
                      </Box>
                    </GridItem>
                    
                    <GridItem xs={12} md={4}>
                      <Paper sx={{ 
                        p: 2.5, 
                        bgcolor: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: 2,
                        mb: 2
                      }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                          Quick Actions
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Button 
                            variant="contained" 
                            startIcon={<Assignment />}
                            fullWidth
                            onClick={() => navigate(`/faculty/assignments?courseId=${selectedCourse.id}`)}
                            sx={{ justifyContent: 'flex-start' }}
                          >
                            Assignments
                          </Button>
                          <Button 
                            variant="contained" 
                            startIcon={<VideoCall />}
                            fullWidth
                            color="secondary"
                            onClick={() => navigate(`/faculty/materials?courseId=${selectedCourse.id}`)}
                            sx={{ justifyContent: 'flex-start' }}
                          >
                            Materials
                          </Button>
                          <Button 
                            variant="contained" 
                            startIcon={<Person />}
                            fullWidth
                            color="info"
                            onClick={() => navigate(`/faculty/students?courseId=${selectedCourse.id}`)}
                            sx={{ justifyContent: 'flex-start' }}
                          >
                            Students
                          </Button>
                          <Button 
                            variant="outlined" 
                            startIcon={<Delete />}
                            fullWidth
                            color="error"
                            onClick={handleArchiveCourse}
                            disabled={archivingCourse || archiveSuccess}
                            sx={{ 
                              justifyContent: 'flex-start',
                              borderColor: 'rgba(244, 67, 54, 0.5)',
                              '&:hover': {
                                borderColor: 'error.main',
                                backgroundColor: 'rgba(244, 67, 54, 0.08)'
                              }
                            }}
                          >
                            {archivingCourse ? 'Archiving...' : 'Archive Course'}
                          </Button>
                        </Box>
                      </Paper>
                    </GridItem>
                  </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Button 
                    onClick={handleDetailModalClose} 
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    Close
                  </Button>
                  <Button 
                    variant="contained"
                    onClick={() => navigate(`/faculty/courses/${selectedCourse.id}`)}
                  >
                    Open Course Page
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
    </FacultyLayout>
  );
};

export default Courses; 