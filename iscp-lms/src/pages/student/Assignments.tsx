/**
 * Assignments.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 4, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Student assignments page for viewing, submitting, and managing
 * course assignments with deadline tracking.
 */

import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Link,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import GridItem from '../../components/common/GridItem';
import {
  Assignment as AssignmentIcon,
  Today,
  AccessTime,
  AttachFile,
  Upload,
  Description,
  CloudUpload,
  Close,
  Search,
  FilterList,
  SortByAlpha,
  Check,
  Book,
  School,
  InsertDriveFile
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import studentService, { Assignment as StudentAssignment } from '../../services/StudentService';
import { format, isAfter, parseISO } from 'date-fns';

// Update the Assignment interface to include all needed properties and status types
interface Assignment extends StudentAssignment {
  progress?: number;
  grade?: number;
  attachments?: Array<{name: string; url: string}>;
  color?: string;
  status: 'pending' | 'submitted' | 'late' | 'graded';
}

// Function to calculate days remaining
const getDaysRemaining = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Function to get status color
const getStatusColor = (assignment: Assignment) => {
  if (assignment.status === 'submitted' || assignment.status === 'graded') {
    return '#4caf50';
  }
  
  const daysRemaining = getDaysRemaining(assignment.dueDate);
  
  if (daysRemaining < 0) {
    return '#f44336';
  } else if (daysRemaining <= 1) {
    return '#ff9800';
  } else {
    return '#1976d2';
  }
};

// Function to get status label
const getStatusLabel = (assignment: Assignment) => {
  if (assignment.status === 'submitted') {
    return 'Submitted';
  } else if (assignment.status === 'graded') {
    return `Graded: ${assignment.score}/${assignment.maxPoints}`;
  }
  
  const daysRemaining = getDaysRemaining(assignment.dueDate);
  
  if (daysRemaining < 0) {
    return 'Overdue';
  } else if (daysRemaining === 0) {
    return 'Due Today';
  } else if (daysRemaining === 1) {
    return 'Due Tomorrow';
  } else {
    return `Due in ${daysRemaining} days`;
  }
};

const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), 'MMMM d, yyyy');
  } catch (error) {
    return dateString;
  }
};

const Assignments: React.FC = () => {
  const { authState } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        // Load assignments from the API
        const apiAssignments = await studentService.getAssignmentsFromAPI();
        
        // Extend assignments with UI properties
        const extendedAssignments = apiAssignments.map(assignment => {
          let progress = 0;
          
          switch (assignment.status) {
            case 'pending':
              progress = Math.floor(Math.random() * 50); // 0-50%
              break;
            case 'submitted':
            case 'graded':
              progress = 100; // 100% complete
              break;
            case 'late':
              progress = Math.floor(Math.random() * 90); // 0-90%
              break;
          }
          
          return {
            ...assignment,
            progress,
            color: ['#1976d2', '#e91e63', '#9c27b0', '#ff9800'][Math.floor(Math.random() * 4)],
            attachments: assignment.attachmentUrl ? 
              [{ name: 'Assignment File', url: assignment.attachmentUrl }] : 
              []
          };
        });
        
        setAssignments(extendedAssignments);
        
        // Initialize filtered assignments based on current tab
        // For "All Assignments" tab, exclude graded ones
        if (tabValue === 0) {
          setFilteredAssignments(extendedAssignments.filter(a => a.status !== 'graded'));
        } else if (tabValue === 1) {
          setFilteredAssignments(extendedAssignments.filter(a => 
            getDaysRemaining(a.dueDate) <= 0 && a.status === 'pending'
          ));
        } else if (tabValue === 2) {
          setFilteredAssignments(extendedAssignments.filter(a => 
            a.status === 'submitted' || a.status === 'graded'
          ));
        } else {
        setFilteredAssignments(extendedAssignments);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load assignments. Please try again later.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssignments();
  }, [tabValue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Filter assignments based on the new tab
    if (newValue === 0) { // All Assignments
      setFilteredAssignments(assignments.filter(a => a.status !== 'graded'));
    } else if (newValue === 1) { // Past Due
      setFilteredAssignments(assignments.filter(a => 
        getDaysRemaining(a.dueDate) <= 0 && a.status === 'pending'
      ));
    } else if (newValue === 2) { // Completed
      setFilteredAssignments(assignments.filter(a => 
        a.status === 'submitted' || a.status === 'graded'
      ));
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = event.target.value.toLowerCase();
    setSearchText(searchTerm);
    
    // Apply search term with current tab and filter
    if (searchTerm === '') {
      // If search is empty, just apply the current filter and tab
      if (filter === 'all') {
        if (tabValue === 0) { // All Assignments
          setFilteredAssignments(assignments.filter(a => a.status !== 'graded'));
        } else if (tabValue === 1) { // Past Due
          setFilteredAssignments(assignments.filter(a => 
            getDaysRemaining(a.dueDate) <= 0 && a.status === 'pending'
          ));
        } else if (tabValue === 2) { // Completed
          setFilteredAssignments(assignments.filter(a => 
            a.status === 'submitted' || a.status === 'graded'
          ));
        }
      } else {
        // Apply filter and tab
        setFilteredAssignments(assignments.filter(assignment => {
          const matchesFilter = assignment.status === filter;
          
          // Apply tab filter
          if (tabValue === 0) { // All Assignments
            return matchesFilter && assignment.status !== 'graded';
          } else if (tabValue === 1) { // Past Due
            return matchesFilter && getDaysRemaining(assignment.dueDate) <= 0 && assignment.status === 'pending';
          } else if (tabValue === 2) { // Completed
            return matchesFilter && (assignment.status === 'submitted' || assignment.status === 'graded');
          }
          
          return matchesFilter;
        }));
      }
    } else {
      // Apply search, filter, and tab
      setFilteredAssignments(
        assignments.filter(assignment => {
          const matchesFilter = filter === 'all' || assignment.status === filter;
          const matchesSearch = 
            assignment.title.toLowerCase().includes(searchTerm) || 
            assignment.courseName.toLowerCase().includes(searchTerm) ||
            assignment.courseCode.toLowerCase().includes(searchTerm);
          
          // Apply tab filter
          if (tabValue === 0) { // All Assignments
            return matchesFilter && matchesSearch && assignment.status !== 'graded';
          } else if (tabValue === 1) { // Past Due
            return matchesFilter && matchesSearch && getDaysRemaining(assignment.dueDate) <= 0 && assignment.status === 'pending';
          } else if (tabValue === 2) { // Completed
            return matchesFilter && matchesSearch && (assignment.status === 'submitted' || assignment.status === 'graded');
          }
          
          return matchesFilter && matchesSearch;
        })
      );
    }
  };

  const handleSubmitClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmitDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSubmitDialogOpen(false);
    setFileInput(null);
    setSubmissionText('');
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFileInput(event.target.files[0]);
    }
  };

  const handleSubmissionTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubmissionText(event.target.value);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    
    // Apply the new filter with current tab
    if (newFilter === 'all') {
      if (tabValue === 0) { // All Assignments
        setFilteredAssignments(assignments.filter(a => a.status !== 'graded'));
      } else if (tabValue === 1) { // Past Due
        setFilteredAssignments(assignments.filter(a => 
          getDaysRemaining(a.dueDate) <= 0 && a.status === 'pending'
        ));
      } else if (tabValue === 2) { // Completed
        setFilteredAssignments(assignments.filter(a => 
          a.status === 'submitted' || a.status === 'graded'
        ));
      }
    } else {
      setFilteredAssignments(assignments.filter(assignment => {
        const matchesFilter = assignment.status === newFilter;
        
        // Apply tab filter
        if (tabValue === 0) { // All Assignments
          return matchesFilter && assignment.status !== 'graded';
        } else if (tabValue === 1) { // Past Due
          return matchesFilter && getDaysRemaining(assignment.dueDate) <= 0 && assignment.status === 'pending';
        } else if (tabValue === 2) { // Completed
          return matchesFilter && (assignment.status === 'submitted' || assignment.status === 'graded');
        }
        
        return matchesFilter;
      }));
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;
    
    try {
      setLoading(true);
      
      // Validate that either text or file is provided
      if (!submissionText && !fileInput) {
        setSnackbar({
          open: true,
          message: 'Please provide either submission text or a file upload.',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      let fileUrl = '';
      let fileType = '';
      
      // If a file was selected, upload it first
      if (fileInput) {
        try {
          fileUrl = await studentService.uploadAssignmentFile(fileInput);
          fileType = fileInput.type;
          
          if (!fileUrl) {
            throw new Error('File upload failed');
          }
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          setSnackbar({
            open: true,
            message: 'File upload failed. Please try again.',
            severity: 'error'
          });
          setLoading(false);
          return;
        }
      }
      
      // Ensure we have at least one submission type
      if (!submissionText && !fileUrl) {
        setSnackbar({
          open: true,
          message: 'Please provide either text or a file for your submission.',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Submit the assignment
      const result = await studentService.submitAssignmentToAPI(
        selectedAssignment.id, 
        {
          submissionText: submissionText || undefined,
          fileUrl: fileUrl || undefined,
          fileType: fileType || undefined
        }
      );
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to submit assignment');
      }
      
      // Close the dialog
      handleCloseDialog();
      
      // Refresh the assignments list
      const refreshedAssignments = await studentService.getAssignmentsFromAPI();
      
      // Process assignments
      const extendedAssignments = refreshedAssignments.map(assignment => {
        const existingAssignment = assignments.find(a => a.id === assignment.id);
        
        return {
          ...assignment,
          progress: assignment.status === 'submitted' || assignment.status === 'graded' ? 100 : (existingAssignment?.progress || 0),
          color: existingAssignment?.color || ['#1976d2', '#e91e63', '#9c27b0', '#ff9800'][Math.floor(Math.random() * 4)],
          attachments: assignment.attachmentUrl ? 
            [{ name: 'Assignment File', url: assignment.attachmentUrl }] : 
            []
        };
      });
      
      setAssignments(extendedAssignments);
      
      // Apply filter
      if (filter === 'all') {
        setFilteredAssignments(extendedAssignments);
      } else {
        setFilteredAssignments(extendedAssignments.filter(a => a.status === filter));
      }
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Assignment submitted successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit assignment. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Group assignments by course
  const assignmentsByCourse = filteredAssignments.reduce((groups: Record<string, Assignment[]>, assignment) => {
    const course = assignment.courseName;
    if (!groups[course]) {
      groups[course] = [];
    }
    groups[course].push(assignment);
    return groups;
  }, {});

  return (
    <StudentLayout title="Assignments">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ color: '#fff', fontWeight: 600 }}>
            My Assignments
          </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 0.5 }}>
              View, submit, and track your assignments
            </Typography>
          </Box>
        </Box>
        
        <Paper sx={{ 
          p: 2, 
          mb: 3, 
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 2
        }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search assignments..."
              variant="outlined"
              size="small"
              value={searchText}
              onChange={handleSearchChange}
              sx={{ 
                mb: 1, 
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#1976d2',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiInputBase-input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.5)',
                  opacity: 1,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button 
                startIcon={<FilterList />} 
                onClick={() => handleFilterChange('all')}
                variant={filter === 'all' ? 'contained' : 'outlined'}
                size="small"
                sx={{ 
                  color: filter === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: '#fff',
                    backgroundColor: filter === 'all' ? undefined : 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                All
              </Button>
              <Button 
                startIcon={<AccessTime />} 
                onClick={() => handleFilterChange('pending')}
                variant={filter === 'pending' ? 'contained' : 'outlined'}
                size="small"
                sx={{ 
                  color: filter === 'pending' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: '#fff',
                    backgroundColor: filter === 'pending' ? undefined : 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Pending
              </Button>
              <Button 
                startIcon={<Check />} 
                onClick={() => handleFilterChange('submitted')}
                variant={filter === 'submitted' ? 'contained' : 'outlined'}
                size="small"
                sx={{ 
                  color: filter === 'submitted' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: '#fff',
                    backgroundColor: filter === 'submitted' ? undefined : 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Submitted
              </Button>
              <Button 
                startIcon={<School />}
                onClick={() => handleFilterChange('graded')}
                variant={filter === 'graded' ? 'contained' : 'outlined'}
                size="small"
                sx={{ 
                  color: filter === 'graded' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    borderColor: '#fff',
                    backgroundColor: filter === 'graded' ? undefined : 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Graded
              </Button>
            </Box>
          </Box>
          
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              mt: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 500,
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                '&.Mui-selected': {
                  color: '#fff'
                },
                '&:hover': {
                  color: '#fff',
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#1976d2',
                height: 3
              }
            }}
          >
            <Tab label="All Assignments" />
            <Tab label="Past Due" />
            <Tab label="Completed" />
          </Tabs>
        </Paper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#fff' }} />
          </Box>
        ) : filteredAssignments.length === 0 ? (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2 
          }}>
            <Typography variant="h6" sx={{ color: '#fff' }}>No assignments found</Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {filter !== 'all' 
                ? 'Try changing the filter to see more assignments' 
                : 'You don\'t have any assignments yet'}
            </Typography>
          </Paper>
        ) : (
          tabValue === 0 ? (
            // Group by course view - exclude graded assignments
            Object.entries(assignmentsByCourse).map(([courseName, courseAssignments]) => (
              <Box key={courseName} sx={{ mb: 4 }}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ 
                  px: 2, 
                  py: 1, 
                  bgcolor: 'rgba(25, 118, 210, 0.8)', 
                  color: 'white',
                  borderRadius: 1,
                  fontWeight: 500
                }}>
                  {courseName}
                </Typography>
                <Grid container spacing={3}>
                  {courseAssignments
                    .filter(assignment => assignment.status !== 'graded')
                    .map((assignment) => (
                    <GridItem key={assignment.id} xs={12} md={6} lg={4}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          borderLeft: `4px solid ${getStatusColor(assignment)}`,
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 2,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                            backgroundColor: 'rgba(255, 255, 255, 0.12)'
                          }
                        }}
                      >
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#fff' }}>
                            {assignment.title}
                          </Typography>
                          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              label={assignment.courseCode} 
                              size="small" 
                              sx={{ mr: 1, bgcolor: assignment.color, color: 'white' }} 
                            />
                            <Chip 
                              label={getStatusLabel(assignment)}
                              size="small"
                              color={
                                assignment.status === 'submitted' || assignment.status === 'graded' 
                                  ? 'success' 
                                  : getDaysRemaining(assignment.dueDate) < 0 
                                    ? 'error' 
                                    : getDaysRemaining(assignment.dueDate) <= 1 
                                      ? 'warning' 
                                      : 'primary'
                              }
                            />
                          </Box>
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            <Today fontSize="small" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Due: {formatDate(assignment.dueDate)}
                            </Typography>
                          </Box>
                          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Worth: {assignment.maxPoints} points
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.9)' }}>
                            {assignment.description.length > 120 
                              ? `${assignment.description.substring(0, 120)}...` 
                              : assignment.description}
                          </Typography>
                          
                          {assignment.attachmentUrl && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>
                                Attachment:
                              </Typography>
                              <Button
                                startIcon={<AttachFile />}
                                variant="outlined"
                                size="small"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  '&:hover': {
                                    borderColor: '#fff',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                  }
                                }}
                                onClick={() => {
                                  if (!assignment.attachmentUrl) return;
                                  
                                  // Handle file download through API
                                  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                                  const downloadUrl = assignment.attachmentUrl.startsWith('http') 
                                    ? assignment.attachmentUrl
                                    : `${apiUrl}${assignment.attachmentUrl}`;
                                  
                                  // Create a download using fetch to properly handle content type
                                  fetch(downloadUrl, {
                                    method: 'GET',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                  })
                                  .then(response => {
                                    if (!response.ok) throw new Error('Download failed');
                                    return response.blob();
                                  })
                                  .then(blob => {
                                    if (!assignment.attachmentUrl) return;
                                    
                                    // Create a file name from the URL or use a default
                                    const urlParts = assignment.attachmentUrl.split('/');
                                    let fileName = urlParts[urlParts.length - 1];
                                    
                                    // If no filename is detected, create one based on assignment title
                                    if (!fileName || fileName === '') {
                                      fileName = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attachment`;
                                      
                                      // Add extension based on content type if available
                                      if (assignment.attachmentType) {
                                        const ext = assignment.attachmentType.split('/')[1];
                                        if (ext) fileName += `.${ext}`;
                                      }
                                    }
                                    
                                    // Create download link and trigger it
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.style.display = 'none';
                                    a.href = url;
                                    a.download = fileName;
                                    document.body.appendChild(a);
                                    a.click();
                                    
                                    // Clean up
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                  })
                                  .catch(error => {
                                    console.error('Error downloading file:', error);
                                    alert('Failed to download attachment. Please try again.');
                                  });
                                }}
                              >
                                Download
                              </Button>
                            </Box>
                          )}
                          
                          {(assignment.status === 'submitted' || assignment.status === 'graded') && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>
                                Your Submission:
                              </Typography>
                              {assignment.submissionFile && (
                                <Button
                                  startIcon={<AttachFile />}
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    borderColor: 'rgba(255, 255, 255, 0.3)',
                                    '&:hover': {
                                      borderColor: '#fff',
                                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                    }
                                  }}
                                  onClick={() => {
                                    if (!assignment.submissionFile) return;
                                    
                                    // Handle file download through API
                                    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                                    const downloadUrl = assignment.submissionFile.startsWith('http') 
                                      ? assignment.submissionFile
                                      : `${apiUrl}${assignment.submissionFile}`;
                                    
                                    // Create a download using fetch to properly handle content type
                                    fetch(downloadUrl, {
                                      method: 'GET',
                                      headers: {
                                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                                      }
                                    })
                                    .then(response => {
                                      if (!response.ok) throw new Error('Download failed');
                                      return response.blob();
                                    })
                                    .then(blob => {
                                      if (!assignment.submissionFile) return;
                                      
                                      // Create a file name from the URL or use a default
                                      const urlParts = assignment.submissionFile.split('/');
                                      let fileName = urlParts[urlParts.length - 1];
                                      
                                      // If no filename is detected, create one based on assignment title
                                      if (!fileName || fileName === '') {
                                        fileName = `${assignment.title}_submission`;
                                      }
                                      
                                      // Create download link and trigger it
                                      const url = window.URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.style.display = 'none';
                                      a.href = url;
                                      a.download = fileName;
                                      document.body.appendChild(a);
                                      a.click();
                                      
                                      // Clean up
                                      window.URL.revokeObjectURL(url);
                                      document.body.removeChild(a);
                                    })
                                    .catch(error => {
                                      console.error('Error downloading file:', error);
                                      alert('Failed to download submission. Please try again.');
                                    });
                                  }}
                                >
                                  View Submission
                                </Button>
                              )}
                              {assignment.status === 'graded' && (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                    Grade: <strong style={{ color: '#fff' }}>{assignment.score}/{assignment.maxPoints}</strong>
                                  </Typography>
                                  {assignment.feedback && (
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                      Feedback: {assignment.feedback}
                                    </Typography>
                                  )}
                                </Box>
                              )}
                            </Box>
                          )}
                          
                          <Box sx={{ mt: 'auto' }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={assignment.progress || 0} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 5, 
                                mb: 1,
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: assignment.status === 'graded' 
                                    ? '#4caf50' 
                                    : assignment.status === 'submitted'
                                      ? '#1976d2'
                                      : getDaysRemaining(assignment.dueDate) < 0
                                        ? '#f44336'
                                        : '#ff9800'
                                }
                              }}
                            />
                            {assignment.status !== 'graded' && (
                              <Button
                                variant={getDaysRemaining(assignment.dueDate) < 0 ? 'outlined' : 'contained'}
                                color={getDaysRemaining(assignment.dueDate) < 0 ? 'error' : 'primary'}
                                startIcon={<CloudUpload />}
                                fullWidth
                                onClick={() => handleSubmitClick(assignment)}
                              >
                                {assignment.status === 'submitted' ? 'Resubmit' : 'Submit Assignment'}
                              </Button>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </GridItem>
                  ))}
                </Grid>
              </Box>
            ))
          ) : (
            // Filtered views based on tab
            <Grid container spacing={3}>
              {filteredAssignments
                .filter(assignment => {
                  if (tabValue === 1) { // Past Due
                    return getDaysRemaining(assignment.dueDate) <= 0 && assignment.status === 'pending';
                  } else if (tabValue === 2) { // Completed
                    return assignment.status === 'submitted' || assignment.status === 'graded';
                  }
                  return true;
                })
                .map(assignment => (
                  <GridItem key={assignment.id} xs={12} md={6} lg={4}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        borderLeft: `4px solid ${getStatusColor(assignment)}`,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                          backgroundColor: 'rgba(255, 255, 255, 0.12)'
                        }
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h3" gutterBottom sx={{ color: '#fff' }}>
                          {assignment.title}
                        </Typography>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={assignment.courseCode} 
                            size="small" 
                            sx={{ mr: 1, bgcolor: assignment.color, color: 'white' }} 
                          />
                          <Chip 
                            label={getStatusLabel(assignment)}
                            size="small"
                            color={
                              assignment.status === 'submitted' || assignment.status === 'graded' 
                                ? 'success' 
                                : getDaysRemaining(assignment.dueDate) < 0 
                                  ? 'error' 
                                  : getDaysRemaining(assignment.dueDate) <= 1 
                                    ? 'warning' 
                                    : 'primary'
                            }
                          />
                        </Box>
                        <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                          <Today fontSize="small" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Due: {formatDate(assignment.dueDate)}
                          </Typography>
                        </Box>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                          <AssignmentIcon fontSize="small" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Worth: {assignment.maxPoints} points
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.9)' }}>
                          {assignment.description.length > 120 
                            ? `${assignment.description.substring(0, 120)}...` 
                            : assignment.description}
                        </Typography>
                        
                        {assignment.attachmentUrl && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>
                              Attachment:
                            </Typography>
                            <Button
                              startIcon={<AttachFile />}
                              variant="outlined"
                              size="small"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                borderColor: 'rgba(255, 255, 255, 0.3)',
                                '&:hover': {
                                  borderColor: '#fff',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                }
                              }}
                              onClick={() => {
                                if (!assignment.attachmentUrl) return;
                                
                                // Handle file download through API
                                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                                const downloadUrl = assignment.attachmentUrl.startsWith('http') 
                                  ? assignment.attachmentUrl
                                  : `${apiUrl}${assignment.attachmentUrl}`;
                                
                                // Create a download using fetch to properly handle content type
                                fetch(downloadUrl, {
                                  method: 'GET',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                  }
                                })
                                .then(response => {
                                  if (!response.ok) throw new Error('Download failed');
                                  return response.blob();
                                })
                                .then(blob => {
                                  if (!assignment.attachmentUrl) return;
                                  
                                  // Create a file name from the URL or use a default
                                  const urlParts = assignment.attachmentUrl.split('/');
                                  let fileName = urlParts[urlParts.length - 1];
                                  
                                  // If no filename is detected, create one based on assignment title
                                  if (!fileName || fileName === '') {
                                    fileName = `${assignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attachment`;
                                    
                                    // Add extension based on content type if available
                                    if (assignment.attachmentType) {
                                      const ext = assignment.attachmentType.split('/')[1];
                                      if (ext) fileName += `.${ext}`;
                                    }
                                  }
                                  
                                  // Create download link and trigger it
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.style.display = 'none';
                                  a.href = url;
                                  a.download = fileName;
                                  document.body.appendChild(a);
                                  a.click();
                                  
                                  // Clean up
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                })
                                .catch(error => {
                                  console.error('Error downloading file:', error);
                                  alert('Failed to download attachment. Please try again.');
                                });
                              }}
                            >
                              Download
                            </Button>
                          </Box>
                        )}
                        
                        {(assignment.status === 'submitted' || assignment.status === 'graded') && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>
                              Your Submission:
                            </Typography>
                            {assignment.submissionFile && (
                              <Button
                                startIcon={<AttachFile />}
                                variant="outlined"
                                size="small"
                                sx={{
                                  color: 'rgba(255, 255, 255, 0.8)',
                                  borderColor: 'rgba(255, 255, 255, 0.3)',
                                  '&:hover': {
                                    borderColor: '#fff',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                  }
                                }}
                                onClick={() => {
                                  if (!assignment.submissionFile) return;
                                  
                                  // Handle file download through API
                                  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                                  const downloadUrl = assignment.submissionFile.startsWith('http') 
                                    ? assignment.submissionFile
                                    : `${apiUrl}${assignment.submissionFile}`;
                                  
                                  // Create a download using fetch to properly handle content type
                                  fetch(downloadUrl, {
                                    method: 'GET',
                                    headers: {
                                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                                    }
                                  })
                                  .then(response => {
                                    if (!response.ok) throw new Error('Download failed');
                                    return response.blob();
                                  })
                                  .then(blob => {
                                    if (!assignment.submissionFile) return;
                                    
                                    // Create a file name from the URL or use a default
                                    const urlParts = assignment.submissionFile.split('/');
                                    let fileName = urlParts[urlParts.length - 1];
                                    
                                    // If no filename is detected, create one based on assignment title
                                    if (!fileName || fileName === '') {
                                      fileName = `${assignment.title}_submission`;
                                    }
                                    
                                    // Create download link and trigger it
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.style.display = 'none';
                                    a.href = url;
                                    a.download = fileName;
                                    document.body.appendChild(a);
                                    a.click();
                                    
                                    // Clean up
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                  })
                                  .catch(error => {
                                    console.error('Error downloading file:', error);
                                    alert('Failed to download submission. Please try again.');
                                  });
                                }}
                              >
                                View Submission
                              </Button>
                            )}
                            {assignment.status === 'graded' && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                  Grade: <strong style={{ color: '#fff' }}>{assignment.score}/{assignment.maxPoints}</strong>
                                </Typography>
                                {assignment.feedback && (
                                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                                    Feedback: {assignment.feedback}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                        
                        <Box sx={{ mt: 'auto' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={assignment.progress || 0} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 5, 
                              mb: 1,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: assignment.status === 'graded' 
                                  ? '#4caf50' 
                                  : assignment.status === 'submitted'
                                    ? '#1976d2'
                                    : getDaysRemaining(assignment.dueDate) < 0
                                      ? '#f44336'
                                      : '#ff9800'
                              }
                            }}
                          />
                          {assignment.status !== 'graded' && (
                            <Button
                              variant={getDaysRemaining(assignment.dueDate) < 0 ? 'outlined' : 'contained'}
                              color={getDaysRemaining(assignment.dueDate) < 0 ? 'error' : 'primary'}
                              startIcon={<CloudUpload />}
                              fullWidth
                              onClick={() => handleSubmitClick(assignment)}
                            >
                              {assignment.status === 'submitted' ? 'Resubmit' : 'Submit Assignment'}
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </GridItem>
                ))
              }
            </Grid>
          )
        )}
        
        {/* Submit Assignment Dialog */}
        <Dialog 
          open={submitDialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
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
          <DialogTitle sx={{ color: '#fff' }}>
            Submit Assignment
            <IconButton
              aria-label="close"
              onClick={handleCloseDialog}
              sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {selectedAssignment && (
              <>
                <Typography variant="h6" sx={{ color: '#fff' }}>{selectedAssignment.title}</Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} gutterBottom>
                  {selectedAssignment.courseName} · Due: {formatDate(selectedAssignment.dueDate)}
                </Typography>
                
                <Typography variant="body1" paragraph sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {selectedAssignment.description}
                </Typography>
                
                {selectedAssignment.instructions && (
                  <>
                    <Typography variant="subtitle1" sx={{ color: '#fff' }}>Instructions:</Typography>
                    <Typography variant="body2" paragraph sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      {selectedAssignment.instructions}
                    </Typography>
                  </>
                )}
                
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>Your Submission</Typography>
                
                <TextField
                  label="Submission Text"
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                  value={submissionText}
                  onChange={handleSubmissionTextChange}
                  placeholder="Enter your answer or comments here (optional)"
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
                        borderColor: '#1976d2',
                      },
                    }
                  }}
                  InputLabelProps={{
                    sx: { color: 'rgba(255, 255, 255, 0.7)' }
                  }}
                />
                
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff' }}>
                    Upload File (optional)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<Upload />}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      '&:hover': {
                        borderColor: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    Select File
                    <input
                      type="file"
                      hidden
                      onChange={handleFileInputChange}
                    />
                  </Button>
                  {fileInput && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                      <InsertDriveFile sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {fileInput.name} ({(fileInput.size / 1024).toFixed(2)} KB)
                      </Typography>
                      <IconButton size="small" onClick={() => setFileInput(null)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cancel</Button>
            <Button 
              onClick={handleSubmitAssignment} 
              variant="contained" 
              color="primary"
              disabled={!fileInput && !submissionText}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{
            '& .MuiAlert-root': {
              backgroundColor: snackbar.severity === 'success' 
                ? 'rgba(76, 175, 80, 0.9)' 
                : snackbar.severity === 'error'
                  ? 'rgba(244, 67, 54, 0.9)'
                  : snackbar.severity === 'warning'
                    ? 'rgba(255, 152, 0, 0.9)'
                    : 'rgba(33, 150, 243, 0.9)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              fontWeight: 500,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }
          }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{
              borderColor: snackbar.severity === 'success' 
                ? 'rgba(76, 175, 80, 0.5)'
                : snackbar.severity === 'error'
                  ? 'rgba(244, 67, 54, 0.5)'
                  : snackbar.severity === 'warning'
                    ? 'rgba(255, 152, 0, 0.5)'
                    : 'rgba(33, 150, 243, 0.5)',
              border: '1px solid'
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </StudentLayout>
  );
};

export default Assignments; 