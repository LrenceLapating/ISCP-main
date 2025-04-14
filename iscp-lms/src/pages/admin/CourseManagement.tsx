/**
 * CourseManagement.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 12, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator course management interface for overseeing
 * all courses, approving new courses, and managing departments.
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, MenuItem, FormControl, InputLabel,
  Select, Chip, Avatar, SelectChangeEvent, Tooltip, useTheme, alpha,
  Grid as MuiGrid, Tabs, Tab, CircularProgress, Alert, Container, FormHelperText
} from '@mui/material';
import {
  Add as AddIcon, Edit, Delete, Refresh, FilterList,
  Check, Block, LibraryBooks, Search, ThumbUp, ThumbDown,
  School, LocationOn, Person, Grade
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/AdminService';

// Create custom Grid components to avoid TypeScript errors
const Grid = MuiGrid;
const GridItem = (props: any) => <MuiGrid item {...props} />;

// List of available campuses
const campuses = [
  'Main Campus: Undisclosed location, Philippines',
  'Biringan Campus',
  'Sun and Moon Campus',
  'Galactic Campus',
  'Atlantis Campus'
];

// Course interface
interface Course {
  id: number;
  code: string;
  title: string;
  department: string;
  campus: string;
  instructor: string;
  status: 'active' | 'inactive';
  request_status?: 'pending' | 'approved' | 'rejected';
  request_notes?: string;
  description?: string;
  credits?: number;
  credit_hours?: number;
  maxStudents?: number;
  teacherId?: number;
}

const CourseManagement: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState('All Campuses');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [availableCampuses, setAvailableCampuses] = useState<string[]>(['All Campuses', ...campuses]);
  const [instructors, setInstructors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({
    code: '',
    title: '',
    department: '',
    campus: 'Main Campus: Undisclosed location, Philippines',
    instructor: '',
    status: 'active'
  });
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  
  // Pending courses
  const [pendingCourses, setPendingCourses] = useState<Course[]>([]);
  const [selectedTab, setSelectedTab] = useState<number>(0);
  const [reviewDialogOpen, setReviewDialogOpen] = useState<boolean>(false);
  const [courseToReview, setCourseToReview] = useState<Course | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all approved courses and metadata
  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Fetch all approved courses
      const coursesResponse = await adminService.getApprovedCourses();
      setCourses(coursesResponse);
      setFilteredCourses(coursesResponse);
      
      // Extract unique departments and instructors from the courses
      const uniqueDepartments: string[] = [];
      const uniqueInstructors: string[] = [];
      
      // Extract unique values
      coursesResponse.forEach(course => {
        if (course.department && !uniqueDepartments.includes(course.department)) {
          uniqueDepartments.push(course.department);
        }
        
        if (course.instructor && !uniqueInstructors.includes(course.instructor)) {
          uniqueInstructors.push(course.instructor);
        }
      });
      
      setDepartments(uniqueDepartments);
      setInstructors(uniqueInstructors);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all data on component mount
  useEffect(() => {
    fetchCourses();
    fetchPendingCourseRequests();
  }, []);
  
  // Filter courses based on search and filters
  useEffect(() => {
    let result = [...courses];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        course => 
          course.code.toLowerCase().includes(query) ||
          course.title.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query)
      );
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      result = result.filter(course => course.department === departmentFilter);
    }
    
    // Apply campus filter
    if (campusFilter !== 'All Campuses') {
      result = result.filter(course => course.campus === campusFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(course => course.status === statusFilter);
    }
    
    setFilteredCourses(result);
  }, [courses, searchQuery, departmentFilter, campusFilter, statusFilter]);
  
  // Fetch pending course requests
  const fetchPendingCourseRequests = async () => {
    try {
      // Call the API service to get pending course requests
      const pendingRequests = await adminService.getPendingCourseRequests();
      setPendingCourses(pendingRequests);
    } catch (error) {
      console.error('Error fetching pending course requests:', error);
      setPendingCourses([]);
    }
  };
  
  // Open dialog to create a new course
  const handleCreateCourse = () => {
    setIsEditing(false);
    setCurrentCourse({
      code: '',
      title: '',
      department: '',
      campus: 'Main Campus: Undisclosed location, Philippines',
      instructor: '',
      status: 'active'
    });
    setDialogOpen(true);
  };
  
  // Open dialog to edit a course
  const handleEditCourse = (course: Course) => {
    setIsEditing(true);
    setCurrentCourse({ ...course });
    setDialogOpen(true);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCourse(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCurrentCourse(prev => ({ ...prev, [name]: value }));
  };
  
  // Save course (create or update)
  const handleSaveCourse = async () => {
    try {
      setError(null);
      
      // Validate required fields
      if (!currentCourse.code || !currentCourse.title || !currentCourse.department || !currentCourse.instructor) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (isEditing && currentCourse.id) {
        // Update existing course
        const updatedCourse = await adminService.updateCourse(currentCourse as Course);
        
        // Update state
        setCourses(prev => 
          prev.map(c => c.id === updatedCourse.id ? updatedCourse : c)
        );
        
        // Close dialog
        setDialogOpen(false);
      } else {
        // Create new course
        const newCourse = await adminService.createCourse(currentCourse as Course);
        
        // Update state
        setCourses(prev => [...prev, newCourse]);
      
      // Close dialog
      setDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error saving course:', error);
      
      // Extract error message if available
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to save course. Please try again.';
      
      setError(errorMessage);
    }
  };
  
  // Open delete dialog
  const handleOpenDeleteDialog = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };
  
  // Close delete dialog
  const handleCloseDeleteDialog = () => {
    setCourseToDelete(null);
    setDeleteDialogOpen(false);
  };
  
  // Delete course
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      setError(null);
      await adminService.deleteCourse(courseToDelete.id);
      setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      setFilteredCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete course. Please try again.';
      setError(errorMessage);
      
      // Keep the dialog open so the user can see the error
      setTimeout(() => {
        setDeleteDialogOpen(false);
        
        // Show the error for a bit after closing the dialog
        setTimeout(() => {
          setError(null);
        }, 3000);
      }, 2000);
    }
  };
  
  // Toggle course status
  const handleToggleStatus = async (course: Course) => {
    const newStatus = course.status === 'active' ? 'inactive' : 'active';
    
    try {
      const updatedCourse = await adminService.updateCourseStatus(course.id, newStatus);
      setCourses(prev => 
        prev.map(c => c.id === updatedCourse.id ? updatedCourse : c)
      );
    } catch (error) {
      console.error('Error updating course status:', error);
      alert('Failed to update course status. Please try again.');
    }
  };
  
  // Open review dialog
  const handleOpenReviewDialog = (course: Course) => {
    setCourseToReview(course);
    setReviewNotes('');
    setReviewDialogOpen(true);
  };
  
  // Close review dialog
  const handleCloseReviewDialog = () => {
    setCourseToReview(null);
    setReviewNotes('');
    setReviewDialogOpen(false);
  };
  
  // Approve course request
  const handleApproveCourse = async () => {
    if (!courseToReview) return;
    
    setReviewLoading(true);
    try {
      // Call the API to update the course status
      const approvedCourse = await adminService.updateCourseRequestStatus(
        courseToReview.id, 
        'approved', 
        reviewNotes
      );
      
      // Remove from pending courses
      setPendingCourses(prev => prev.filter(c => c.id !== courseToReview.id));
      
      // Add to active courses with status active
      setCourses(prev => [...prev, approvedCourse]);
      
      // Close dialog
      setReviewDialogOpen(false);
      
      // Show success message
      setError("Course has been approved successfully.");
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error approving course request:', error);
      setError('Failed to approve course request. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };
  
  // Reject course request
  const handleRejectCourse = async () => {
    if (!courseToReview) return;
    
    setReviewLoading(true);
    try {
      // Call the API to reject the course
      await adminService.updateCourseRequestStatus(
        courseToReview.id, 
        'rejected', 
        reviewNotes
      );
      
      // Remove from pending courses list
      setPendingCourses(prev => prev.filter(c => c.id !== courseToReview.id));
      
      // Close dialog
      setReviewDialogOpen(false);
      
      // Show success message
      setError("Course has been rejected.");
      setTimeout(() => setError(null), 3000);
    } catch (error) {
      console.error('Error rejecting course request:', error);
      setError('Failed to reject course request. Please try again.');
    } finally {
      setReviewLoading(false);
    }
  };
  
  // Handle tab change
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  
  return (
    <AdminLayout title="Course Management">
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
              Course Management
            </Typography>
              <Typography variant="subtitle1" color="rgba(255, 255, 255, 0.7)">
                Manage courses, review requests, and update course information
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleCreateCourse}
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
                Add New Course
              </Button>
              <Button
                variant="outlined"
                        color="primary"
                startIcon={<Refresh />}
                onClick={() => {
                  fetchCourses();
                  fetchPendingCourseRequests();
                }}
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 'bold',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          {/* Search & Filter Controls */}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                      <TextField
              placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
              value={selectedTab} 
              onChange={handleChangeTab}
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
              <Tab label="All Courses" value={0} />
              <Tab label="Pending Requests" value={1} />
            </Tabs>
          </Box>

          {/* Filters Row */}
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '& .MuiSelect-select': {
                  color: 'white'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)'
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              <InputLabel id="department-filter-label">Department</InputLabel>
                        <Select
                labelId="department-filter-label"
                id="department-filter"
                          value={departmentFilter}
                          label="Department"
                          onChange={(e) => setDepartmentFilter(e.target.value)}
                        >
                          <MenuItem value="all">All Departments</MenuItem>
                {departments.map(dept => (
                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
            
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '& .MuiSelect-select': {
                  color: 'white'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)'
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              <InputLabel id="campus-filter-label">Campus</InputLabel>
                        <Select
                labelId="campus-filter-label"
                id="campus-filter"
                          value={campusFilter}
                          label="Campus"
                          onChange={(e) => setCampusFilter(e.target.value)}
                        >
                <MenuItem value="All Campuses">All Campuses</MenuItem>
                {campuses.map(campus => (
                            <MenuItem key={campus} value={campus}>{campus}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
            
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 1,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.2)'
                },
                '& .MuiSelect-select': {
                  color: 'white'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)'
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255, 255, 255, 0.7)'
                }
              }}
            >
              <InputLabel id="status-filter-label">Status</InputLabel>
                        <Select
                labelId="status-filter-label"
                id="status-filter"
                          value={statusFilter}
                          label="Status"
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <MenuItem value="all">All Statuses</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="inactive">Inactive</MenuItem>
                        </Select>
                      </FormControl>
          </Box>
        </Container>
      </Box>
        
      {/* Main content */}
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, bgcolor: '#0a1128', width: '100%', minHeight: 'calc(100vh - 200px)' }}>
        <Container maxWidth="xl">
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
              <CircularProgress sx={{ color: 'white' }} />
            </Box>
          ) : (
            <>
              {selectedTab === 0 && (
                <>
                  {filteredCourses.length === 0 ? (
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
                        {searchQuery || departmentFilter !== 'all' || campusFilter !== 'All Campuses' || statusFilter !== 'all' ? 
                          'Try adjusting your search filters' : 
                          'Click Add New Course to create your first course'
                        }
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleCreateCourse}
                      >
                        Add New Course
                      </Button>
                </Paper>
                  ) : (
                    <Grid container spacing={3}>
                      {filteredCourses.map((course) => (
                        <GridItem xs={12} sm={6} md={4} key={course.id}>
                          <Paper
                            sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
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
                                <Chip 
                                  label={course.status} 
                                  color={course.status === 'active' ? 'success' : 'default'}
                                  size="small"
                                />
                            </Box>
                            
                            <Box sx={{ p: 2.5, flexGrow: 1 }}>
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
                                sx={{
                                  mb: 2,
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  height: '2.4em'
                                }}
                              >
                                {course.department}
                              </Typography>
                              
                              <Box sx={{ mt: 'auto' }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  mb: 0.5
                                }}>
                                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    <Person fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} /> 
                                    {course.instructor}
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
                                  mt: 2
                                }}>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Edit">
                                  <IconButton 
                                    size="small" 
                                        sx={{ 
                                          color: 'primary.main',
                                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                                        }}
                                    onClick={() => handleEditCourse(course)}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton 
                                    size="small" 
                                        sx={{ 
                                          color: 'error.main', 
                                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
                                        }}
                                    onClick={() => handleOpenDeleteDialog(course)}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                  </Box>
                                  
                                  <Tooltip title={course.status === 'active' ? 'Deactivate' : 'Activate'}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color={course.status === 'active' ? 'error' : 'success'}
                                      onClick={() => handleToggleStatus(course)}
                                      startIcon={course.status === 'active' ? <Block fontSize="small" /> : <Check fontSize="small" />}
                                      sx={{
                                        borderColor: course.status === 'active' ? 'error.main' : 'success.main',
                                        '&:hover': {
                                          borderColor: course.status === 'active' ? 'error.dark' : 'success.dark',
                                          bgcolor: course.status === 'active' ? 'rgba(244, 67, 54, 0.08)' : 'rgba(76, 175, 80, 0.08)'
                                        }
                                      }}
                                    >
                                      {course.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </Button>
                                  </Tooltip>
                              </Box>
              </Box>
                            </Box>
                          </Paper>
                        </GridItem>
                      ))}
                    </Grid>
                  )}
                </>
            )}
            
            {selectedTab === 1 && (
                <>
                  {pendingCourses.length === 0 ? (
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
                        No pending course requests
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
                        There are no course requests pending review at this time
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchPendingCourseRequests}
                        sx={{
                          color: 'white',
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          '&:hover': {
                            borderColor: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.05)'
                          }
                        }}
                      >
                        Refresh
                      </Button>
                    </Paper>
                  ) : (
                    <Grid container spacing={3}>
                      {pendingCourses.map((course) => (
                        <GridItem xs={12} sm={6} md={4} key={course.id}>
                          <Paper
                            sx={{
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
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
                              <Chip 
                                label="Pending Review" 
                                color="warning"
                                size="small"
                              />
                            </Box>
                            
                            <Box sx={{ p: 2.5, flexGrow: 1 }}>
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
                                sx={{
                                  mb: 2,
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  height: '2.4em'
                                }}
                              >
                                {course.department}
                              </Typography>
                              
                              <Box sx={{ mt: 'auto' }}>
                                <Box sx={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between',
                                  mb: 0.5
                                }}>
                                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    <Person fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} /> 
                                    {course.instructor}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    <LocationOn fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'text-bottom' }} /> 
                                    {course.campus}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ mt: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                  color="primary"
                                  onClick={() => handleOpenReviewDialog(course)}
                                    sx={{ mt: 1 }}
                                >
                                    Review Request
                                </Button>
                            </Box>
              </Box>
                            </Box>
                          </Paper>
          </GridItem>
                      ))}
        </Grid>
                  )}
                </>
              )}
            </>
          )}
      
      {/* Course Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Course' : 'Add New Course'}</DialogTitle>
        <DialogContent>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2, mt: 1 }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <GridItem item xs={12} sm={6}>
              <TextField
                name="code"
                label="Course Code"
                value={currentCourse.code || ''}
                onChange={handleInputChange}
                fullWidth
                required
                    error={!currentCourse.code}
                    helperText={!currentCourse.code ? "Code is required" : ""}
              />
            </GridItem>
            <GridItem item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={currentCourse.status || 'active'}
                  label="Status"
                  onChange={handleSelectChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem item xs={12}>
              <TextField
                name="title"
                label="Course Title"
                value={currentCourse.title || ''}
                onChange={handleInputChange}
                fullWidth
                required
                    error={!currentCourse.title}
                    helperText={!currentCourse.title ? "Title is required" : ""}
              />
            </GridItem>
            <GridItem item xs={12} sm={6}>
                  <FormControl fullWidth required error={!currentCourse.department}>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={currentCourse.department || ''}
                  label="Department"
                  onChange={handleSelectChange}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
                    {!currentCourse.department && (
                      <FormHelperText>Department is required</FormHelperText>
                    )}
              </FormControl>
            </GridItem>
            <GridItem item xs={12} sm={6}>
              <FormControl fullWidth required error={!currentCourse.campus}>
                <InputLabel>Campus</InputLabel>
                <Select
                  name="campus"
                  value={currentCourse.campus || ''}
                  onChange={handleSelectChange}
                  label="Campus"
                >
                  {campuses.map((campus) => (
                    <MenuItem key={campus} value={campus}>
                      {campus}
                    </MenuItem>
                  ))}
                </Select>
                {!currentCourse.campus && (
                  <FormHelperText>Campus is required</FormHelperText>
                )}
              </FormControl>
            </GridItem>
            <GridItem item xs={12}>
                  <FormControl fullWidth required error={!currentCourse.instructor}>
                <InputLabel>Instructor</InputLabel>
                <Select
                  name="instructor"
                  value={currentCourse.instructor || ''}
                  label="Instructor"
                  onChange={handleSelectChange}
                >
                  {instructors.map((instructor) => (
                    <MenuItem key={instructor} value={instructor}>{instructor}</MenuItem>
                  ))}
                </Select>
                    {!currentCourse.instructor && (
                      <FormHelperText>Instructor is required</FormHelperText>
                    )}
              </FormControl>
            </GridItem>
            <GridItem item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={currentCourse.description || ''}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </GridItem>
            <GridItem item xs={12} sm={6}>
              <TextField
                name="credits"
                label="Credits"
                value={currentCourse.credits || ''}
                onChange={handleInputChange}
                fullWidth
                type="number"
              />
            </GridItem>
            <GridItem item xs={12} sm={6}>
              <TextField
                name="maxStudents"
                label="Max Students"
                value={currentCourse.maxStudents || ''}
                onChange={handleInputChange}
                fullWidth
                type="number"
              />
            </GridItem>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveCourse} variant="contained" color="primary">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
              {error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : (
          <Typography>
            Are you sure you want to delete the course <strong>{courseToDelete?.title}</strong>?
                  This action cannot be undone and will remove all associated data including:
          </Typography>
              )}
              {!error && (
                <Box component="ul" sx={{ mt: 1, pl: 2 }}>
                  <Typography component="li">Student enrollments</Typography>
                  <Typography component="li">Assignments and submissions</Typography>
                  <Typography component="li">Course materials</Typography>
                  <Typography component="li">Discussions and announcements</Typography>
                  <Typography component="li">Grades and progress records</Typography>
                </Box>
              )}
        </DialogContent>
        <DialogActions>
              <Button onClick={handleCloseDeleteDialog} disabled={!!error}>Cancel</Button>
              <Button 
                onClick={handleConfirmDelete} 
                variant="contained" 
                color="error"
                disabled={!!error}
                startIcon={error ? <CircularProgress size={20} /> : null}
              >
                {error ? 'Processing...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Course Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Review Course Request</DialogTitle>
        <DialogContent>
          {courseToReview && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <GridItem item xs={12}>
                <Typography variant="h6">{courseToReview.title} ({courseToReview.code})</Typography>
              </GridItem>
              <GridItem item xs={12} sm={6}>
                <Typography variant="subtitle2">Department</Typography>
                <Typography variant="body1">{courseToReview.department}</Typography>
              </GridItem>
              <GridItem item xs={12} sm={6}>
                <Typography variant="subtitle2">Campus</Typography>
                <Typography variant="body1">{courseToReview.campus}</Typography>
              </GridItem>
              <GridItem item xs={12} sm={6}>
                <Typography variant="subtitle2">Instructor</Typography>
                <Typography variant="body1">{courseToReview.instructor}</Typography>
              </GridItem>
              <GridItem item xs={12} sm={6}>
                <Typography variant="subtitle2">Credits</Typography>
                <Typography variant="body1">{courseToReview.credits}</Typography>
              </GridItem>
              <GridItem item xs={12}>
                <Typography variant="subtitle2">Description</Typography>
                <Typography variant="body1">{courseToReview.description}</Typography>
              </GridItem>
              <GridItem item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Review Notes</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes or feedback about this course request..."
                />
              </GridItem>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReviewDialog} disabled={reviewLoading}>Cancel</Button>
          <Button 
            onClick={handleRejectCourse} 
            variant="outlined" 
            color="error" 
            disabled={reviewLoading}
            startIcon={reviewLoading ? <CircularProgress size={20} /> : <ThumbDown />}
          >
            Reject
          </Button>
          <Button 
            onClick={handleApproveCourse} 
            variant="contained" 
            color="success"
            disabled={reviewLoading}
            startIcon={reviewLoading ? <CircularProgress size={20} /> : <ThumbUp />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
      </Box>
    </AdminLayout>
  );
};

export default CourseManagement; 