import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container, Typography, Box, Paper, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, CircularProgress, Alert, TextField, InputAdornment,
  Avatar, Chip, Menu, MenuItem, Divider, FormControl,
  InputLabel, Select, Tabs, Tab, useTheme, alpha,
  Card, CardContent, CardHeader, Grid, LinearProgress, Badge,
  Tooltip, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Search, FilterList, MoreVert, Email,
  Message, Assessment, TrendingUp, PersonRemove,
  CheckCircle, Schedule, Warning, School, Grade,
  CalendarToday, Assignment, NotificationsActive, ContactMail,
  LibraryBooks, StarRate, FactCheck, Book
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facultyService, { Course, Student } from '../../services/FacultyService';
import GridItem from '../../components/common/GridItem';

// Student status interface
interface StatusOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

// Enhanced student interface with data from our improved API endpoint
interface EnhancedStudent extends Student {
  courseName?: string;
  courseId?: number;
  enrollment_date?: string;
  formatted_enrollment_date?: string;
  enrollment_status?: string;
  progress?: number;
  grade?: string;
  average_grade?: number;
  submissions_count?: number;
  total_assignments?: number;
  submission_rate?: string;
  attendance_count?: number;
  studentId?: string;
  enrolledCourses?: { id: number; title: string; code: string; progress: number }[];
}

const statusOptions: StatusOption[] = [
  { value: 'all', label: 'All Students', icon: <FilterList />, color: 'default' },
  { value: 'active', label: 'Active', icon: <CheckCircle />, color: 'success' },
  { value: 'at-risk', label: 'At Risk', icon: <Warning />, color: 'error' },
  { value: 'inactive', label: 'Inactive', icon: <Schedule />, color: 'warning' },
  { value: 'excellent', label: 'Excellent', icon: <Grade />, color: 'primary' }
];

// Add a function to generate consistent avatar colors based on user ID
const getAvatarBgColor = (id: number) => {
  const colors = [
    '#1976d2', // blue
    '#2e7d32', // green
    '#c62828', // red
    '#673ab7', // deep purple
    '#f57c00', // orange
    '#0097a7', // cyan
    '#d81b60', // pink
    '#5c6bc0', // indigo
    '#546e7a', // blue gray
    '#4527a0'  // deep purple
  ];
  
  return colors[id % colors.length];
};

const Students: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<EnhancedStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<EnhancedStudent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const isMenuOpen = Boolean(anchorEl);
  
  // Fetch students and courses on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First fetch courses for the filter dropdown
        console.log('Fetching faculty courses for students...');
        const fetchedCourses = await facultyService.getMyCourses();
        setCourses(fetchedCourses);
        
        if (fetchedCourses.length === 0) {
          setError('You have no courses assigned. Please create or request courses to be assigned to you.');
          setLoading(false);
          return;
        }
        
        // Fetch all students enrolled in faculty's courses
        console.log('Fetching all enrolled students...');
        const allStudents = await facultyService.getAllStudents();
        
        if (allStudents.length === 0) {
          setError('No students found enrolled in your courses. Students will appear here once they enroll in your courses.');
        } else {
          console.log('Students data:', allStudents);
          setStudents(allStudents);
          setFilteredStudents(allStudents);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(`Failed to load students: ${err.message || 'Unknown error'}`);
        
        // If in development, use mock data
        if (process.env.NODE_ENV === 'development') {
          setMockData();
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Function to set mock data in case of API error
  const setMockData = () => {
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
    
    const mockStudents: EnhancedStudent[] = [
      {
        id: 1,
        fullName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        campus: 'Main Campus',
        profileImage: 'https://ui-avatars.com/api/?name=John+Doe&background=random',
        status: 'active',
        studentId: 'ST2023001',
        courseName: 'Introduction to Computer Science',
        courseId: 1,
        enrollment_date: new Date().toISOString(),
        formatted_enrollment_date: 'Jan 15, 2023',
        enrollment_status: 'active',
        progress: 75,
        grade: '85.5',
        submissions_count: 8,
        total_assignments: 10,
        submission_rate: '80.0',
        attendance_count: 12,
        enrolledCourses: [
          {
            id: 1,
            title: 'Introduction to Computer Science',
            code: 'CS101',
            progress: 75
          }
        ]
      },
      {
        id: 2,
        fullName: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        campus: 'Main Campus',
        profileImage: 'https://ui-avatars.com/api/?name=Jane+Smith&background=random',
        status: 'excellent',
        studentId: 'ST2023002',
        courseName: 'Introduction to Computer Science',
        courseId: 1,
        enrollment_date: new Date().toISOString(),
        formatted_enrollment_date: 'Jan 15, 2023',
        enrollment_status: 'active',
        progress: 95,
        grade: '94.2',
        submissions_count: 10,
        total_assignments: 10,
        submission_rate: '100.0',
        attendance_count: 15,
        enrolledCourses: [
          {
            id: 1,
            title: 'Introduction to Computer Science',
            code: 'CS101',
            progress: 90
          },
          {
            id: 2,
            title: 'Data Structures & Algorithms',
            code: 'CS202',
            progress: 60
          }
        ]
      },
      {
        id: 3,
        fullName: 'Alex Johnson',
        firstName: 'Alex',
        lastName: 'Johnson',
        email: 'alex.johnson@example.com',
        campus: 'East Wing',
        profileImage: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random',
        status: 'at-risk',
        studentId: 'ST2023003',
        courseName: 'Data Structures & Algorithms',
        courseId: 2,
        enrollment_date: new Date().toISOString(),
        formatted_enrollment_date: 'Jan 20, 2023',
        enrollment_status: 'active',
        progress: 40,
        grade: '58.5',
        submissions_count: 3,
        total_assignments: 10,
        submission_rate: '30.0',
        attendance_count: 7,
        enrolledCourses: [
          {
            id: 2,
            title: 'Data Structures & Algorithms',
            code: 'CS202',
            progress: 40
          }
        ]
      }
    ];
    
    setCourses(mockCourses);
    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
  };
  
  // Filter students based on search query, status filter, and course filter
  useEffect(() => {
    if (students.length === 0) return;
    
    let filtered = [...students];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }
    
    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(s => 
        s.courseId === courseFilter || 
        s.enrolledCourses?.some(c => c.id === courseFilter)
      );
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.firstName?.toLowerCase().includes(query) ||
        s.lastName?.toLowerCase().includes(query) ||
        s.fullName?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.studentId?.toString().toLowerCase().includes(query)
      );
    }
    
    setFilteredStudents(filtered);
  }, [searchQuery, statusFilter, courseFilter, students]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleStatusFilterChange = (_: React.SyntheticEvent, newValue: string) => {
    setStatusFilter(newValue);
    filterStudents(searchQuery, newValue, courseFilter);
  };
  
  const handleCourseFilterChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setCourseFilter(e.target.value as (number | 'all'));
    filterStudents(searchQuery, statusFilter, e.target.value as (number | 'all'));
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, studentId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedStudentId(studentId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStudentId(null);
  };
  
  const handleEmailStudent = () => {
    handleMenuClose();
    
    if (selectedStudentId) {
    const student = students.find(s => s.id === selectedStudentId);
    if (student) {
        window.open(`mailto:${student.email}`, '_blank');
    }
    }
  };
  
  const handleViewProgress = () => {
    handleMenuClose();
    
    if (selectedStudentId) {
      const student = students.find(s => s.id === selectedStudentId);
      if (student && student.enrolledCourses && student.enrolledCourses.length > 0) {
        navigate(`/faculty/students/${selectedStudentId}/progress/${student.enrolledCourses[0].id}`);
      } else {
        // Show an error message that the student is not enrolled in any courses
        setError('This student is not enrolled in any courses.');
      }
    }
  };
  
  const handleViewGrades = () => {
    handleMenuClose();
    
    if (selectedStudentId) {
      navigate(`/faculty/students/${selectedStudentId}/grades`);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    handleMenuClose();
    
    if (selectedStudentId) {
      try {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        
        const success = await facultyService.updateStudentStatus(selectedStudentId, newStatus);
        
        if (success) {
          // Get student name
          const student = students.find(s => s.id === selectedStudentId);
          const studentName = student ? student.fullName : 'Student';
          
          // Update the student's status in the state
          setStudents(prevStudents => 
            prevStudents.map(student => 
              student.id === selectedStudentId 
                ? { ...student, status: newStatus } 
                : student
            )
          );
          
          // Also update the filtered students
          setFilteredStudents(prevFiltered => 
            prevFiltered.map(student => 
              student.id === selectedStudentId 
                ? { ...student, status: newStatus } 
                : student
            )
          );
          
          // Show success message
          setSuccessMessage(`${studentName}'s status has been updated to ${newStatus.replace('-', ' ')}.`);
          
          // Clear success message after a few seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 5000);
        } else {
          setError('Failed to update student status. Please try again.');
        }
      } catch (err: any) {
        console.error('Error updating student status:', err);
        setError(`Error: ${err.message || 'Failed to update student status'}`);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleStudentClick = (studentId: number) => {
    navigate(`/faculty/students/${studentId}`);
  };

  // Function to filter students based on search, status, and course
  const filterStudents = (search: string, status: string, course: number | 'all') => {
    let filtered = [...students];
    
    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(student => 
        student.fullName.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower) ||
        (student.studentId && student.studentId.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(student => student.status === status);
    }
    
    // Filter by course
    if (course !== 'all') {
      filtered = filtered.filter(student => 
        student.enrolledCourses?.some(c => c.id === course)
      );
    }
    
    setFilteredStudents(filtered);
  };
  
  const getStatusChipColor = (status: string): StatusOption['color'] => {
    const option = statusOptions.find(o => o.value === status);
    return option ? option.color : 'default';
  };
  
  const getStudentAvatar = (student: EnhancedStudent) => {
    return (
      <Avatar
        src={student.profilePicture || student.profileImage}
        alt={student.fullName}
        sx={{
          width: viewMode === 'grid' ? 70 : 40, 
          height: viewMode === 'grid' ? 70 : 40,
          bgcolor: student.profilePicture ? undefined : getAvatarBgColor(student.id)
        }}
      >
        {student.fullName?.charAt(0)}
      </Avatar>
    );
  };
  
  const getStudentCoursesCount = (student: EnhancedStudent): number => {
    return student.enrolledCourses?.length || 1;
  };
  
  const getStudentEnrollmentDate = (student: EnhancedStudent): string => {
    return student.formatted_enrollment_date || 
           new Date(student.enrollment_date || '').toLocaleDateString('en-US', {
             year: 'numeric',
             month: 'short',
             day: 'numeric'
           });
  };
  
  const getStudentStatus = (student: EnhancedStudent): string => {
    return student.status || 'active';
  };
  
  const renderGridView = () => (
    <Box>
    <Grid container spacing={3}>
      {filteredStudents.map(student => (
          <GridItem xs={12} sm={6} md={4} lg={3} key={student.id}>
            <Paper 
              elevation={0} 
              variant="outlined"
            sx={{ 
              height: '100%',
                transition: 'all 0.3s ease',
              '&:hover': {
                  boxShadow: 3,
                transform: 'translateY(-4px)',
                },
                cursor: 'pointer'
            }}
            onClick={() => handleStudentClick(student.id)}
          >
              <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={student.profilePicture || student.profileImage}
                    alt={student.fullName}
                    sx={{ width: 50, height: 50 }}
                  >
                    {student.fullName?.charAt(0)}
                  </Avatar>
                  <Box sx={{ ml: 1.5 }}>
                    <Typography variant="subtitle1" noWrap>{student.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                  {student.email}
                </Typography>
                </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMenuOpen(e, student.id);
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
              
              <Divider key={`divider-${student.id}`} sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                  <Chip 
                    label={getStudentStatus(student)} 
                    size="small" 
                    color={getStatusChipColor(student.status || 'active')} 
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    ID: {student.studentId || `ST${String(student.id).padStart(5, '0')}`}
                      </Typography>
                    </Box>
                    
                <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <School fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  {student.campus}
                      </Typography>
                
                <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                  <Book fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  {getStudentCoursesCount(student)} course{getStudentCoursesCount(student) !== 1 ? 's' : ''}
                      </Typography>
                
                <Typography variant="body2" sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <CalendarToday fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                  Enrolled: {getStudentEnrollmentDate(student)}
                      </Typography>
                
                {student.progress !== undefined && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">Progress</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {`${Math.round(student.progress || 0)}%`}
                  </Typography>
                    </Box>
                  <LinearProgress 
                    variant="determinate" 
                      value={student.progress} 
                    sx={{ 
                        height: 6,
                        borderRadius: 3
                      }}
                    />
                </Box>
                )}
              </Box>
            </Paper>
        </GridItem>
      ))}
    </Grid>
      
      {/* Student Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={handleEmailStudent}>
          <ListItemIcon>
            <Email fontSize="small" />
          </ListItemIcon>
          <ListItemText>Email Student</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleViewProgress}>
          <ListItemIcon>
            <TrendingUp fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Progress</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleViewGrades}>
          <ListItemIcon>
            <Assessment fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Grades</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary' }}>
          Change Status
        </Typography>
        
        <MenuItem onClick={() => handleChangeStatus('active')}>
          <ListItemIcon>
            <CheckCircle fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>Set as Active</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleChangeStatus('at-risk')}>
          <ListItemIcon>
            <Warning fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Mark At Risk</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleChangeStatus('excellent')}>
          <ListItemIcon>
            <StarRate fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText>Mark as Excellent</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleChangeStatus('inactive')}>
          <ListItemIcon>
            <Schedule fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>Set as Inactive</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
  
  const renderTableView = () => (
    <Paper elevation={0} variant="outlined">
      <TableContainer>
        <Table>
        <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Campus</TableCell>
              <TableCell>Enrolled</TableCell>
              <TableCell>Courses</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
            {filteredStudents.map(student => (
            <TableRow 
              key={student.id}
                hover 
                onClick={() => handleStudentClick(student.id)}
              sx={{ 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
              }}
            >
              <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      src={student.profilePicture || student.profileImage}
                      alt={student.fullName}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: student.profilePicture ? undefined : getAvatarBgColor(student.id)
                      }}
                    >
                      {student.fullName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ ml: 2 }}>
                      <Typography variant="body1">{student.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {student.email}
                      </Typography>
                  </Box>
                </Box>
              </TableCell>
                <TableCell>{student.studentId || `ST${String(student.id).padStart(5, '0')}`}</TableCell>
                <TableCell>
                  <Chip 
                    label={getStudentStatus(student)} 
                    size="small" 
                    color={getStatusChipColor(student.status || 'active')} 
                  />
                </TableCell>
                <TableCell>{student.campus}</TableCell>
                <TableCell>{getStudentEnrollmentDate(student)}</TableCell>
                <TableCell>{getStudentCoursesCount(student)}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 150 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={student.progress || 0} 
                      sx={{ 
                        width: '100%', 
                        height: 6, 
                        borderRadius: 3,
                        mr: 1
                      }}
                    />
                    <Typography variant="caption">
                      {`${Math.round(student.progress || 0)}%`}
                    </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <IconButton 
                  size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, student.id);
                    }}
                >
                  <MoreVert />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        
        {/* Student Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={isMenuOpen}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: { minWidth: 200 }
          }}
        >
          <MenuItem onClick={handleEmailStudent}>
            <ListItemIcon>
              <Email fontSize="small" />
            </ListItemIcon>
            <ListItemText>Email Student</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleViewProgress}>
            <ListItemIcon>
              <TrendingUp fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Progress</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleViewGrades}>
            <ListItemIcon>
              <Assessment fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Grades</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <Typography variant="caption" sx={{ px: 2, py: 0.5, display: 'block', color: 'text.secondary' }}>
            Change Status
          </Typography>
          
          <MenuItem onClick={() => handleChangeStatus('active')}>
            <ListItemIcon>
              <CheckCircle fontSize="small" color="success" />
            </ListItemIcon>
            <ListItemText>Set as Active</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleChangeStatus('at-risk')}>
            <ListItemIcon>
              <Warning fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Mark At Risk</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleChangeStatus('excellent')}>
            <ListItemIcon>
              <StarRate fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Mark as Excellent</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={() => handleChangeStatus('inactive')}>
            <ListItemIcon>
              <Schedule fontSize="small" color="warning" />
            </ListItemIcon>
            <ListItemText>Set as Inactive</ListItemText>
          </MenuItem>
        </Menu>
    </TableContainer>
    </Paper>
  );
  
  // Update student progress function
  const handleUpdateProgress = async (studentId: number, courseId: number, progress: number) => {
    try {
      // Close any open menu
      handleMenuClose();
      
      // If we have the student and course IDs, update progress
      if (studentId && courseId) {
        const success = await facultyService.updateStudentProgress(studentId, courseId, progress);
        
        if (success) {
          // Update the local state to reflect the change
          setStudents(prevStudents => 
            prevStudents.map(student => 
              student.id === studentId 
                ? { ...student, progress } 
                : student
            )
          );
          
          // Show a success message
          alert(`Progress for student ID ${studentId} has been updated to ${progress}%`);
        } else {
          // Show an error message
          alert('Failed to update student progress. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error updating student progress:', error);
      alert('An error occurred while updating student progress.');
    }
  };
  
  return (
    <FacultyLayout title="Students">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Students
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 4 }}>
            Manage and view all students enrolled in your courses.
          </Typography>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            placeholder="Search by name, email or ID..."
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              width: 300,
              '& .MuiOutlinedInput-root': { 
                color: 'rgba(255, 255, 255, 0.9)', 
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' }
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(255, 255, 255, 0.5)' }
            }}
          />
          
          <Box>
              <Button
                variant="outlined"
              startIcon={<Email />}
              onClick={() => window.open(`mailto:${filteredStudents.map(s => s.email).join(',')}`)}
              disabled={filteredStudents.length === 0}
                sx={{ 
                  mr: 1,
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
              Email All
              </Button>
            
            <Box component="span" sx={{ mr: 1 }}>
              <FormControl variant="outlined" size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="course-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Course</InputLabel>
                <Select
                  labelId="course-filter-label"
                  id="course-filter"
                  value={courseFilter}
                  onChange={handleCourseFilterChange as any}
                  label="Course"
                  sx={{ color: 'rgba(255, 255, 255, 0.9)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255, 255, 255, 0.3)' } }}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {courses.map(course => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
              
              <Button
                variant="contained"
              onClick={() => setViewMode('grid')}
              disabled={viewMode === 'grid'}
                sx={{
                mr: 1,
                bgcolor: viewMode === 'grid' ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': { bgcolor: viewMode === 'grid' ? 'primary.dark' : 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-disabled': { bgcolor: 'primary.main', color: 'white', opacity: 0.8 }
              }}
            >
              <LibraryBooks sx={{ mr: 0.5, fontSize: 20 }} /> Grid
              </Button>
            
            <Button
              variant="contained"
              onClick={() => setViewMode('list')}
              disabled={viewMode === 'list'}
              sx={{ 
                bgcolor: viewMode === 'list' ? 'primary.main' : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '&:hover': { bgcolor: viewMode === 'list' ? 'primary.dark' : 'rgba(255, 255, 255, 0.2)' },
                '&.Mui-disabled': { bgcolor: 'primary.main', color: 'white', opacity: 0.8 }
              }}
            >
              <FactCheck sx={{ mr: 0.5, fontSize: 20 }} /> List
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 3 }}>
              <Tabs
                value={statusFilter}
                onChange={handleStatusFilterChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="student status filter tabs"
                sx={{
                  '& .MuiTab-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .Mui-selected': { color: 'rgba(255, 255, 255, 0.95)' },
                  '& .MuiTabs-indicator': { backgroundColor: 'rgba(255, 255, 255, 0.9)' }
                }}
              >
                {statusOptions.map(option => (
                  <Tab
                    key={option.value}
                    value={option.value}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {option.icon}
                        <Box sx={{ ml: 1 }}>{option.label}</Box>
                      </Box>
                    }
                  />
                ))}
              </Tabs>
        </Box>
        
        {/* Students List */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </Box>
          ) : filteredStudents.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
              <School sx={{ fontSize: 60, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
              <Typography variant="h6" color="rgba(255, 255, 255, 0.7)" gutterBottom>
                No students found
              </Typography>
              <Typography variant="body2" color="rgba(255, 255, 255, 0.5)" align="center">
                {searchQuery || statusFilter !== 'all' || courseFilter !== 'all'
                  ? 'Try adjusting your filters to see more results'
                  : 'There are no students enrolled in your courses yet'}
              </Typography>
            </Box>
          ) : (
          viewMode === 'list' ? (
            <TableContainer sx={{ bgcolor: 'transparent' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Student</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>ID</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Status</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Campus</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Enrolled</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Courses</TableCell>
                    <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Progress</TableCell>
                    <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.7)', borderColor: 'rgba(255, 255, 255, 0.1)' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow 
                      key={student.id} 
                      hover 
                      onClick={() => handleStudentClick(student.id)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
                        '& .MuiTableCell-root': { 
                          color: 'rgba(255, 255, 255, 0.9)',
                          borderColor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar
                            src={student.profilePicture || student.profileImage}
                            alt={student.fullName}
                            sx={{ 
                              width: 40, 
                              height: 40,
                              bgcolor: student.profilePicture ? undefined : getAvatarBgColor(student.id)
                            }}
                          >
                            {student.fullName?.charAt(0)}
                          </Avatar>
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{student.fullName}</Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                              {student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{student.studentId || `ST${String(student.id).padStart(5, '0')}`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={getStudentStatus(student)} 
                          size="small" 
                          color={getStatusChipColor(student.status || 'active')} 
                        />
                      </TableCell>
                      <TableCell>{student.campus}</TableCell>
                      <TableCell>{getStudentEnrollmentDate(student)}</TableCell>
                      <TableCell>{getStudentCoursesCount(student)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 150 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={student.progress || 0} 
                            sx={{ 
                              width: '100%', 
                              height: 6, 
                              borderRadius: 3,
                              mr: 1,
                              bgcolor: 'rgba(255, 255, 255, 0.1)'
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {`${Math.round(student.progress || 0)}%`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuOpen(e, student.id);
                          }}
                          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
              {filteredStudents.map(student => (
                <Box 
                  key={student.id} 
                  sx={{ 
                    width: { xs: '100%', sm: '48%', md: '31.5%', lg: '23.5%' },
                    bgcolor: 'rgba(255, 255, 255, 0.05)', 
                    borderRadius: 1,
                    overflow: 'hidden',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 12px rgba(0,0,0,0.2)',
                      bgcolor: 'rgba(255, 255, 255, 0.08)'
                    }
                  }}
                  onClick={() => handleStudentClick(student.id)}
                >
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={student.profilePicture || student.profileImage}
                        alt={student.fullName}
                        sx={{ 
                          width: 50, 
                          height: 50,
                          bgcolor: student.profilePicture ? undefined : getAvatarBgColor(student.id)
                        }}
                      >
                        {student.fullName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ ml: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }} noWrap>
                          {student.fullName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }} noWrap>
                          {student.email}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, student.id);
                      }}
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Divider key={`divider-${student.id}`} sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <Chip 
                        label={getStudentStatus(student)} 
                        size="small" 
                        color={getStatusChipColor(student.status || 'active')} 
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        ID: {student.studentId || `ST${String(student.id).padStart(5, '0')}`}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>
                      <School fontSize="small" sx={{ mr: 0.5, color: 'rgba(255, 255, 255, 0.6)' }} />
                      {student.campus}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1, display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>
                      <Book fontSize="small" sx={{ mr: 0.5, color: 'rgba(255, 255, 255, 0.6)' }} />
                      {getStudentCoursesCount(student)} course{getStudentCoursesCount(student) !== 1 ? 's' : ''}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)' }}>
                      <CalendarToday fontSize="small" sx={{ mr: 0.5, color: 'rgba(255, 255, 255, 0.6)' }} />
                      Enrolled: {getStudentEnrollmentDate(student)}
                    </Typography>
                    
                    {student.progress !== undefined && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Progress</Typography>
                          <Typography variant="body2" fontWeight="medium" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            {`${Math.round(student.progress || 0)}%`}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={student.progress} 
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(255, 255, 255, 0.1)'
                          }}
                        />
                      </Box>
          )}
        </Box>
                </Box>
              ))}
            </Box>
          )
        )}
      </Container>
    </FacultyLayout>
  );
};

export default Students; 