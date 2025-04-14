/**
 * Assignments.tsx (Faculty)
 * 
 * Author: Marc Laurence Lapating
 * Date: April 8, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Faculty assignment management page for creating, editing,
 * and grading student assignments.
 */

import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  useTheme,
  alpha,
  Tooltip
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Grading,
  Assignment as AssignmentIcon,
  CalendarToday,
  CheckCircle,
  Schedule,
  Warning,
  Edit,
  Delete,
  CloudUpload,
  Download,
  Assessment,
  FilterList,
  People
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facultyService, { Assignment, Course } from '../../services/FacultyService';
import { format } from 'date-fns';
import GridItem from '../../components/common/GridItem';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

// Assignment status interface
interface StatusOption {
  value: string;
  label: string;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const statusOptions: StatusOption[] = [
  { value: 'all', label: 'All', color: 'default' },
  { value: 'active', label: 'Active', color: 'primary' },
  { value: 'upcoming', label: 'Upcoming', color: 'info' },
  { value: 'past', label: 'Past', color: 'secondary' },
  { value: 'graded', label: 'Graded', color: 'success' },
  { value: 'pending', label: 'Pending', color: 'warning' }
];

const Assignments: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState<number | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Assignment form state
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    courseId: '',
    dueDate: '',
    points: '',
    description: '',
    instructions: '',
    allowLateSubmission: false,
    maxAttempts: 1,
    attachment: null as File | null,
    attachmentUrl: '',
    attachmentType: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Edit assignment modal state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date(),
    points: 100,
    file: null as File | null,
    currentFileName: '',
  });
  const [editingLoading, setEditingLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  
  // Fetch assignments and courses on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First fetch courses
        console.log('Fetching faculty courses for assignments...');
        const fetchedCourses = await facultyService.getMyCourses();
        setCourses(fetchedCourses);
        
        // Then fetch all assignments for all courses
        console.log('Fetching assignments for courses...');
        let allAssignments: Assignment[] = [];
        for (const course of fetchedCourses) {
          const courseAssignments = await facultyService.getCourseAssignments(course.id);
          allAssignments = [...allAssignments, ...courseAssignments];
        }
        
        setAssignments(allAssignments);
        setFilteredAssignments(allAssignments);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load assignments. Please try again later.');
        
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
        
        const mockAssignments: Assignment[] = [
          {
            id: 1,
            courseId: 1,
            title: 'Introduction to Programming',
            description: 'Write a simple program in Python to calculate factorial',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            points: 100,
            createdAt: new Date().toISOString(),
            submissions_count: 15,
            graded_count: 8,
            submissions: [
              {
                id: 1,
                assignmentId: 1,
                studentId: 1,
                studentName: 'Student 1',
                submittedAt: new Date().toISOString(),
                status: 'submitted'
              },
              {
                id: 2,
                assignmentId: 1,
                studentId: 2,
                studentName: 'Student 2',
                submittedAt: new Date().toISOString(),
                status: 'graded',
                grade: 85
              }
            ]
          },
          {
            id: 2,
            courseId: 2,
            title: 'Linked List Implementation',
            description: 'Implement a doubly linked list with insert, delete and search operations',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            points: 150,
            createdAt: new Date().toISOString(),
            submissions_count: 0,
            graded_count: 0,
            submissions: []
          }
        ];
        
        setCourses(mockCourses);
        setAssignments(mockAssignments);
        setFilteredAssignments(mockAssignments);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter assignments based on search query, status filter, and course filter
  useEffect(() => {
    let filtered = [...assignments];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const now = new Date();
      
      switch (statusFilter) {
        case 'active':
          filtered = filtered.filter(a => {
            try {
              const dueDate = new Date(a.dueDate);
              return !isNaN(dueDate.getTime()) && dueDate >= now;
            } catch {
              return false;
            }
          });
          break;
        case 'upcoming':
          const oneWeekFromNow = new Date(now);
          oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
          filtered = filtered.filter(a => {
            try {
              const dueDate = new Date(a.dueDate);
              return !isNaN(dueDate.getTime()) && 
                     dueDate >= now && 
                     dueDate <= oneWeekFromNow;
            } catch {
              return false;
            }
          });
          break;
        case 'past':
          filtered = filtered.filter(a => {
            try {
              const dueDate = new Date(a.dueDate);
              return !isNaN(dueDate.getTime()) && dueDate < now;
            } catch {
              return false;
            }
          });
          break;
        case 'graded':
          filtered = filtered.filter(a => (a.graded_count || 0) > 0);
          break;
        case 'pending':
          filtered = filtered.filter(a => ((a.submissions_count || 0) - (a.graded_count || 0)) > 0);
          break;
      }
    }
    
    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(a => a.courseId === courseFilter);
    }
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredAssignments(filtered);
  }, [searchQuery, statusFilter, courseFilter, assignments]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusFilterChange = (e: React.SyntheticEvent, newValue: string) => {
    setStatusFilter(newValue);
  };
  
  const handleCourseFilterChange = (e: SelectChangeEvent<string>) => {
    setCourseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
  };
  
  const handleTabChange = (e: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCreateAssignment = () => {
    setShowCreateDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    // Reset form fields
    setNewAssignment({
      title: '',
      courseId: '',
      dueDate: '',
      points: '',
      description: '',
      instructions: '',
      allowLateSubmission: false,
      maxAttempts: 1,
      attachment: null,
      attachmentUrl: '',
      attachmentType: ''
    });
    setFormError(null);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAssignment(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCourseInputChange = (e: SelectChangeEvent<string>) => {
    setNewAssignment(prev => ({
      ...prev,
      courseId: e.target.value
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewAssignment(prev => ({
        ...prev,
        attachment: file
      }));
    }
  };
  
  const handleSubmitAssignment = async () => {
    // Validate form
    if (!newAssignment.title || !newAssignment.courseId || !newAssignment.dueDate || !newAssignment.points) {
      setFormError("Please fill all required fields");
      return;
    }
    
    try {
      // Validate date format
      const dueDate = new Date(newAssignment.dueDate);
      if (isNaN(dueDate.getTime())) {
        setFormError("Invalid date format");
        return;
      }
      
      setIsSubmitting(true);
      setFormError(null);
      
      let attachmentUrl = '';
      let attachmentType = '';
      
      // Upload file if present
      if (newAssignment.attachment) {
        const uploadResult = await facultyService.uploadAssignmentAttachment(newAssignment.attachment);
        if (uploadResult) {
          attachmentUrl = uploadResult.url;
          attachmentType = uploadResult.type;
        }
      }
      
      // Format date as MySQL-compatible format
      const formattedDueDate = dueDate.toISOString().slice(0, 19).replace('T', ' ');
      
      // Create assignment
      const assignment = await facultyService.createAssignment({
        courseId: parseInt(newAssignment.courseId),
        title: newAssignment.title,
        description: newAssignment.description,
        instructions: newAssignment.instructions || '',
        dueDate: formattedDueDate,
        points: parseInt(newAssignment.points),
        maxAttempts: newAssignment.maxAttempts,
        allowLateSubmission: newAssignment.allowLateSubmission,
        visibility: 'published',
        attachmentUrl,
        attachmentType
      });
      
      if (assignment) {
        // Add the new assignment to the list
        setAssignments(prev => [assignment, ...prev]);
        
        // Close dialog
        handleCloseDialog();
      } else {
        throw new Error("Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      setFormError("Failed to create assignment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assignmentId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedAssignmentId(assignmentId);
    console.log(`Menu opened for assignment ID: ${assignmentId}`);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't reset selectedAssignmentId here, we need it for delete operation
  };
  
  const handleEditAssignment = async () => {
    handleMenuClose();
    if (selectedAssignmentId) {
      try {
        setEditingLoading(true);
        const assignment = await facultyService.getAssignment(selectedAssignmentId);
        
        if (assignment) {
          setEditingAssignment(assignment);
          setEditFormData({
            title: assignment.title,
            description: assignment.description,
            dueDate: new Date(assignment.dueDate),
            points: assignment.points,
            file: null,
            currentFileName: assignment.attachmentUrl || '',
          });
          setShowEditDialog(true);
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        // Show error message
      } finally {
        setEditingLoading(false);
      }
    }
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };

  const handleEditDateChange = (date: Date | null) => {
    if (date) {
      setEditFormData({
        ...editFormData,
        dueDate: date,
      });
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditFormData({
        ...editFormData,
        file: e.target.files[0],
        currentFileName: e.target.files[0].name,
      });
    }
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditingAssignment(null);
    setEditError(null);
  };

  const handleSubmitEditAssignment = async () => {
    if (!editingAssignment) return;
    
    try {
      setEditingLoading(true);
      setEditError(null);
      
      // Create assignment data for submission
      const assignmentData = {
        title: editFormData.title,
        description: editFormData.description,
        dueDate: editFormData.dueDate.toISOString(),
        points: editFormData.points,
      };
      
      // Handle file upload separately if needed
      if (editFormData.file) {
        // This is a simplified approach - you may need to adjust based on your API
        const formData = new FormData();
        formData.append("file", editFormData.file);
        
        // Upload file first
        // await facultyService.uploadAssignmentFile(editingAssignment.id, formData);
      }
      
      // Update assignment data
      await facultyService.updateAssignment(editingAssignment.id, assignmentData);
      
      // Close dialog
      handleCloseEditDialog();
      
      // Refresh assignments list
      const fetchedCourses = await facultyService.getMyCourses();
      let allAssignments: Assignment[] = [];
      for (const course of fetchedCourses) {
        const courseAssignments = await facultyService.getCourseAssignments(course.id);
        allAssignments = [...allAssignments, ...courseAssignments];
      }
      setAssignments(allAssignments);
      
      // Success message (you can add a snackbar/toast here)
    } catch (error) {
      console.error('Error updating assignment:', error);
      setEditError('Failed to update assignment. Please try again.');
    } finally {
      setEditingLoading(false);
    }
  };
  
  const handleViewSubmissions = () => {
    handleMenuClose();
    if (selectedAssignmentId) {
      navigate(`/faculty/assignments/${selectedAssignmentId}/submissions`);
    }
  };
  
  const handleDeleteAssignment = () => {
    console.log(`Delete triggered for assignment ID: ${selectedAssignmentId}`);
    setAnchorEl(null); // Close menu but keep the selected ID
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAssignmentId) {
      console.error("No assignment selected for deletion");
      setDeleteError("No assignment selected for deletion");
      return;
    }
    
    console.log(`Confirming delete for assignment ID: ${selectedAssignmentId}`);
    setDeleteInProgress(true);
    setDeleteError(null);
    
    try {
      // Store ID locally to prevent any state issues
      const idToDelete = selectedAssignmentId;
      console.log(`Attempting to delete assignment with ID: ${idToDelete}`);
      
      const success = await facultyService.deleteAssignment(idToDelete);
      
      console.log(`Delete result: ${success ? 'success' : 'failed'}`);
      
      if (success) {
        // Remove the deleted assignment from the state
        setAssignments(prev => prev.filter(a => a.id !== idToDelete));
        setFilteredAssignments(prev => prev.filter(a => a.id !== idToDelete));
        setDeleteDialogOpen(false);
        
        // Force a UI refresh
        console.log('Removing assignment from UI');
        
        // If we're in development mode without a real backend, simulate reload after a delay
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode detected, refreshing assignments...');
          // Force a UI refresh by creating a new array reference
          setTimeout(() => {
            setAssignments([...assignments.filter(a => a.id !== idToDelete)]);
            setFilteredAssignments([...filteredAssignments.filter(a => a.id !== idToDelete)]);
          }, 300);
        }
      } else {
        console.error(`Server returned failure for delete operation on ID: ${idToDelete}`);
        setDeleteError('Failed to delete assignment. Please try again.');
        
        // For development environment, simulate success
        if (process.env.NODE_ENV === 'development') {
          console.log('Simulating successful delete in development mode despite server error');
          setAssignments(prev => prev.filter(a => a.id !== idToDelete));
          setFilteredAssignments(prev => prev.filter(a => a.id !== idToDelete));
          setDeleteDialogOpen(false);
        }
      }
    } catch (err) {
      console.error('Error deleting assignment:', err);
      setDeleteError('An error occurred while deleting the assignment.');
      
      // For development/demo purposes, simulate successful deletion even if API fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Simulating successful delete in development mode');
        const idToDelete = selectedAssignmentId;
        setAssignments(prev => prev.filter(a => a.id !== idToDelete));
        setFilteredAssignments(prev => prev.filter(a => a.id !== idToDelete));
        setDeleteDialogOpen(false);
      }
    } finally {
      setDeleteInProgress(false);
    }
  };
  
  const handleAssignmentClick = (assignmentId: number) => {
    navigate(`/faculty/assignments/${assignmentId}/submissions`);
  };
  
  const getStatusColor = (dueDate: string) => {
    try {
    const due = new Date(dueDate);
      if (isNaN(due.getTime())) {
        return 'error'; // Return error color for invalid dates
      }
      
      const now = new Date();
    
    if (due < now) {
      return 'error';
    } else {
      const oneWeek = new Date();
      oneWeek.setDate(oneWeek.getDate() + 7);
      
      if (due <= oneWeek) {
        return 'warning';
      } else {
        return 'success';
      }
      }
    } catch (error) {
      console.error('Error in getStatusColor:', error);
      return 'error'; // Default to error for any exception
    }
  };
  
  const getAssignmentStatus = (dueDate: string): string => {
    try {
    const due = new Date(dueDate);
      if (isNaN(due.getTime())) {
        return 'Unknown';  // Return unknown for invalid dates
      }
      
      const now = new Date();
    
    if (due < now) {
      return 'Past Due';
    } else {
      const oneWeek = new Date();
      oneWeek.setDate(oneWeek.getDate() + 7);
      
      if (due <= oneWeek) {
        return 'Due Soon';
      } else {
        return 'Upcoming';
      }
      }
    } catch (error) {
      console.error('Error in getAssignmentStatus:', error);
      return 'Unknown'; // Default to unknown for any exception
    }
  };
  
  const getCourseNameById = (courseId: number): string => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };
  
  return (
    <FacultyLayout title="Assignments">
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
              Assignments
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Create, manage, and grade assignments for your courses
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            width: { xs: '100%', md: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              placeholder="Search assignments..."
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
              onClick={handleCreateAssignment}
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
              Create Assignment
            </Button>
          </Box>
        </Box>
        
        {/* Filters */}
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' }
        }}>
          <Tabs
            value={statusFilter}
            onChange={handleStatusFilterChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 'auto',
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem',
                fontWeight: 500,
                p: '6px 16px',
                '&.Mui-selected': {
                  color: '#fff',
                }
              }
            }}
          >
            {statusOptions.map((option) => (
              <Tab 
                key={option.value} 
                label={option.label} 
                value={option.value}
                icon={
                  option.value === 'active' ? <CheckCircle fontSize="small" /> :
                  option.value === 'upcoming' ? <Schedule fontSize="small" /> :
                  option.value === 'past' ? <Warning fontSize="small" /> :
                  option.value === 'graded' ? <Grading fontSize="small" /> :
                  option.value === 'pending' ? <AssignmentIcon fontSize="small" /> :
                  <FilterList fontSize="small" />
                }
                iconPosition="start"
              />
            ))}
          </Tabs>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 200,
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
              '& .MuiSelect-icon': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          >
            <InputLabel id="course-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Filter by Course
            </InputLabel>
            <Select
              labelId="course-filter-label"
              value={courseFilter.toString()}
              label="Filter by Course"
              onChange={handleCourseFilterChange}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <MenuItem value="all">All Courses</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id.toString()}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
        ) : filteredAssignments.length === 0 ? (
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
            <AssignmentIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              No assignments found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              {searchQuery 
                ? 'No assignments match your search criteria.' 
                : statusFilter !== 'all' 
                  ? `No assignments with status "${statusOptions.find(o => o.value === statusFilter)?.label}" found.`
                  : courseFilter !== 'all'
                    ? `No assignments for the selected course found.`
                    : 'You have not created any assignments yet.'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleCreateAssignment}
            >
              Create New Assignment
            </Button>
          </Paper>
        ) : (
          <TableContainer 
            component={Paper}
            sx={{
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiTableCell-root': {
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff'
              },
              '& .MuiTableCell-head': {
                fontWeight: 600,
                backgroundColor: 'rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Points</TableCell>
                  <TableCell>Submissions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow 
                    key={assignment.id}
                    hover
                    onClick={() => handleAssignmentClick(assignment.id)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)'
                      },
                      position: 'relative',
                      '&:hover::after': {
                        content: '"View submissions"',
                        position: 'absolute',
                        right: '3rem',
                        color: theme.palette.primary.main,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        opacity: 0.9
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="body2" fontWeight={500}>
                          {assignment.title}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getCourseNameById(assignment.courseId)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                        {(() => {
                          try {
                            const dueDate = new Date(assignment.dueDate);
                            // Check if the date is valid
                            if (isNaN(dueDate.getTime())) {
                              return 'Invalid date';
                            }
                            return format(dueDate, 'MMM d, yyyy');
                          } catch (error) {
                            console.error('Error formatting date:', error);
                            return 'Invalid date';
                          }
                        })()}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={getAssignmentStatus(assignment.dueDate)} 
                        size="small"
                        color={getStatusColor(assignment.dueDate) as any}
                        sx={{ 
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          height: 24
                        }}
                      />
                    </TableCell>
                    <TableCell>{assignment.points} pts</TableCell>
                    <TableCell>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          '&:hover': {
                            color: theme.palette.primary.main
                          }
                        }}
                      >
                        <People sx={{ fontSize: 16, mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                        {(() => {
                          const submissionCount = assignment.submissions_count || 0;
                          const totalStudents = courses.find(c => c.id === assignment.courseId)?.enrolledStudents || 0;
                          return (
                            <Tooltip title={`${submissionCount} out of ${totalStudents} students have submitted. Click to view details.`}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {submissionCount} / {totalStudents}
                              </Typography>
                            </Tooltip>
                          );
                        })()}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="View Submissions">
                          <IconButton 
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/faculty/assignments/${assignment.id}/submissions`);
                            }}
                            sx={{ color: 'rgba(255, 255, 255, 0.7)', mr: 1 }}
                          >
                            <Grading fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuOpen(e, assignment.id)}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        {/* Assignment Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: '#1c2e4a',
              backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
              minWidth: 180,
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem'
              }
            }
          }}
        >
          <MenuItem onClick={handleViewSubmissions}>
            <Grading sx={{ mr: 1, fontSize: 20 }} />
            View Submissions
          </MenuItem>
          <MenuItem onClick={handleEditAssignment}>
            <Edit sx={{ mr: 1, fontSize: 20 }} />
            Edit Assignment
          </MenuItem>
          <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
          <MenuItem 
            onClick={handleDeleteAssignment}
            sx={{ color: theme.palette.error.main }}
          >
            <Delete sx={{ mr: 1, fontSize: 20 }} />
            Delete
          </MenuItem>
        </Menu>
        
        {/* Create Assignment Dialog */}
        <Dialog 
          open={showCreateDialog} 
          onClose={handleCloseDialog}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: { 
              backgroundColor: '#1c2e4a',
              backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>Create New Assignment</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Create a new assignment for your students. Provide details and set a due date.
            </DialogContentText>
            
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <GridItem xs={12}>
                <TextField
                  name="title"
                  label="Assignment Title"
                  fullWidth
                  margin="dense"
                  value={newAssignment.title}
                  onChange={handleInputChange}
                  required
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <FormControl 
                  fullWidth
                  margin="dense"
                  required
                  sx={{ 
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
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  <InputLabel id="course-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Course
                  </InputLabel>
                  <Select
                    labelId="course-label"
                    label="Course"
                    name="courseId"
                    value={newAssignment.courseId}
                    onChange={handleCourseInputChange}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <TextField
                  name="dueDate"
                  label="Due Date"
                  type="datetime-local"
                  fullWidth
                  margin="dense"
                  required
                  value={newAssignment.dueDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ 
                    shrink: true,
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <TextField
                  name="points"
                  label="Points"
                  type="number"
                  fullWidth
                  margin="dense"
                  required
                  value={newAssignment.points}
                  onChange={handleInputChange}
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{
                    mt: 2,
                    py: 1.5,
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  {newAssignment.attachment ? newAssignment.attachment.name : 'Upload Attachment'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </GridItem>
              
              <GridItem xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  margin="dense"
                  value={newAssignment.description}
                  onChange={handleInputChange}
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12}>
                <TextField
                  name="instructions"
                  label="Instructions (Optional)"
                  fullWidth
                  multiline
                  rows={2}
                  margin="dense"
                  value={newAssignment.instructions}
                  onChange={handleInputChange}
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmitAssignment}
              disabled={isSubmitting}
              sx={{
                bgcolor: theme.palette.secondary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.8)
                }
              }}
            >
              {isSubmitting ? 'Creating...' : 'Create Assignment'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Edit Assignment Dialog */}
        <Dialog 
          open={showEditDialog} 
          onClose={handleCloseEditDialog}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: { 
              backgroundColor: '#1c2e4a',
              backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>Edit Assignment</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Modify the assignment details below.
            </DialogContentText>
            
            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editError}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <GridItem xs={12}>
                <TextField
                  name="title"
                  label="Assignment Title"
                  fullWidth
                  margin="dense"
                  value={editFormData.title}
                  onChange={handleEditInputChange}
                  required
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  margin="dense"
                  multiline
                  rows={4}
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  required
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Due Date"
                    value={editFormData.dueDate}
                    onChange={handleEditDateChange}
                    sx={{
                      width: '100%',
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
                      }
                    }}
                  />
                </LocalizationProvider>
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <TextField
                  name="points"
                  label="Total Points"
                  type="number"
                  fullWidth
                  margin="dense"
                  value={editFormData.points}
                  onChange={handleEditInputChange}
                  required
                  InputProps={{ 
                    inputProps: { min: 0, max: 100 },
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                />
              </GridItem>
              
              <GridItem xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    sx={{ 
                      mr: 2,
                      color: theme.palette.primary.main,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        backgroundColor: 'rgba(25, 118, 210, 0.08)'
                      }
                    }}
                  >
                    Upload File
                    <input
                      type="file"
                      hidden
                      onChange={handleEditFileChange}
                    />
                  </Button>
                  {editFormData.currentFileName && (
                    <Typography variant="body2" sx={{ color: theme.palette.primary.main }}>
                      {editFormData.currentFileName}
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {editFormData.file ? "New file selected" : editFormData.currentFileName ? "Current file will be kept" : "No file attached"}
                </Typography>
              </GridItem>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={handleCloseEditDialog}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: '#fff' }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEditAssignment}
              variant="contained"
              disabled={editingLoading}
              sx={{ 
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: theme.palette.primary.dark }
              }}
            >
              {editingLoading ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onClose={handleCloseDeleteDialog} 
          maxWidth="xs" 
          fullWidth
          PaperProps={{
            sx: { 
              backgroundColor: '#1c2e4a',
              backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Are you sure you want to delete this assignment? This action cannot be undone and will remove all associated student submissions.
            </DialogContentText>
            {deleteError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {deleteError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button 
              onClick={handleCloseDeleteDialog} 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: '#fff' }
              }}
              disabled={deleteInProgress}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              color="error"
              variant="contained"
              disabled={deleteInProgress}
              sx={{
                fontWeight: 500
              }}
            >
              {deleteInProgress ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </FacultyLayout>
  );
};

export default Assignments; 