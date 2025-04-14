/**
 * Grades.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 4, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Student grades page for viewing grades across all courses,
 * with detailed breakdowns and progress tracking.
 */

import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider,
  Grid,
  CircularProgress,
  LinearProgress,
  TextField,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Search,
  Grade as GradeIcon,
  TrendingUp,
  School
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import studentService, { Grade } from '../../services/StudentService';
import GridItem from '../../components/common/GridItem';

// Calculate grade percentage
const calculateGradePercentage = (assignments: Array<{ score: number | null, total: number, weight: number }>) => {
  let totalEarnedPoints = 0;
  let totalPossibleWeightedPoints = 0;
  
  assignments.forEach((assignment: { score: number | null, total: number, weight: number }) => {
    if (assignment.score !== null) {
      totalEarnedPoints += (assignment.score / assignment.total) * assignment.weight;
      totalPossibleWeightedPoints += assignment.weight;
    }
  });
  
  if (totalPossibleWeightedPoints === 0) return 0;
  
  return (totalEarnedPoints / totalPossibleWeightedPoints) * 100;
};

// Get letter grade based on percentage
const getLetterGrade = (percentage: number) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 87) return 'A-';
  if (percentage >= 83) return 'B+';
  if (percentage >= 80) return 'B';
  if (percentage >= 77) return 'B-';
  if (percentage >= 73) return 'C+';
  if (percentage >= 70) return 'C';
  if (percentage >= 67) return 'C-';
  if (percentage >= 63) return 'D+';
  if (percentage >= 60) return 'D';
  return 'F';
};

// Get color based on grade
const getGradeColor = (percentage: number) => {
  if (percentage >= 90) return '#4caf50';
  if (percentage >= 80) return '#8bc34a';
  if (percentage >= 70) return '#ffc107';
  if (percentage >= 60) return '#ff9800';
  return '#f44336';
};

const Grades: React.FC = () => {
  const { authState } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      try {
        const gradesData = await studentService.getGradesFromAPI();
        setGrades(gradesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching grades:', err);
        setError('Failed to load grade data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGrades();
  }, []);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleCourseClick = (courseId: number) => {
    setSelectedCourse(courseId === selectedCourse ? null : courseId);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Filter grades based on tab and search
  const currentTermGrades = grades.filter(grade => grade.term === 'Spring 2023');
  const previousTermGrades = grades.filter(grade => grade.term !== 'Spring 2023');
  
  let filteredGrades;
  if (tabValue === 0) {
    filteredGrades = currentTermGrades;
  } else if (tabValue === 1) {
    filteredGrades = previousTermGrades;
  } else {
    filteredGrades = grades;
  }
  
  if (searchTerm) {
    filteredGrades = filteredGrades.filter(grade => 
      grade.course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grade.course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  
  // Calculate GPA
  const calculateGPA = (grades: Array<{ course: { credits: number }, assignments: Array<{ score: number | null, total: number, weight: number }> }>) => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    grades.forEach((grade: { course: { credits: number }, assignments: Array<{ score: number | null, total: number, weight: number }> }) => {
      const percentage = calculateGradePercentage(grade.assignments);
      if (percentage > 0) {
        let gradePoints;
        if (percentage >= 90) gradePoints = 4.0;
        else if (percentage >= 87) gradePoints = 3.7;
        else if (percentage >= 83) gradePoints = 3.3;
        else if (percentage >= 80) gradePoints = 3.0;
        else if (percentage >= 77) gradePoints = 2.7;
        else if (percentage >= 73) gradePoints = 2.3;
        else if (percentage >= 70) gradePoints = 2.0;
        else if (percentage >= 67) gradePoints = 1.7;
        else if (percentage >= 63) gradePoints = 1.3;
        else if (percentage >= 60) gradePoints = 1.0;
        else gradePoints = 0.0;
        
        totalPoints += gradePoints * grade.course.credits;
        totalCredits += grade.course.credits;
      }
    });
    
    return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
  };
  
  const currentGPA = calculateGPA(currentTermGrades);
  const cumulativeGPA = calculateGPA(grades);

  // If loading
  if (loading) {
    return (
      <StudentLayout title="Grades">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout title="Grades">
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <GridItem xs={12} md={4}>
            <Paper sx={{ 
              p: 2.5, 
              bgcolor: 'rgba(255, 255, 255, 0.05)', 
              borderRadius: 2,
              height: '100%'
            }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <GradeIcon sx={{ mr: 1 }} /> Your GPA
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Current Term GPA</Typography>
                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 600 }}>{currentGPA}</Typography>
              </Box>
              <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              <Box>
                <Typography variant="body2" gutterBottom sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Cumulative GPA</Typography>
                <Typography variant="h3" sx={{ color: '#fff', fontWeight: 600 }}>{cumulativeGPA}</Typography>
              </Box>
              <Box sx={{ 
                mt: 3,
                p: 2,
                bgcolor: 'rgba(0, 0, 0, 0.2)',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center'
              }}>
                <TrendingUp sx={{ color: 'primary.main', mr: 1.5 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  GPA calculated based on weighted course credits
                </Typography>
              </Box>
            </Paper>
          </GridItem>
          
          <GridItem xs={12} md={8}>
            <Paper sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', p: 2.5, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600, m: 0 }}>
                  Course Grades
                </Typography>
                <TextField
                  placeholder="Search courses..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search sx={{ color: 'rgba(255, 255, 255, 0.5)' }} /></InputAdornment>,
                    sx: { 
                      bgcolor: 'rgba(0, 0, 0, 0.2)',
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
                />
              </Box>
              
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                indicatorColor="primary"
                textColor="inherit"
                sx={{ 
                  borderBottom: 1, 
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  mb: 2,
                  '& .MuiTab-root': { 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    '&.Mui-selected': { color: '#fff' },
                    textTransform: 'none',
                  }
                }}
              >
                <Tab label="Current Term" />
                <Tab label="Previous Terms" />
                <Tab label="All Courses" />
              </Tabs>

              {filteredGrades.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 8,
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  <School sx={{ fontSize: 60, mb: 2, opacity: 0.6 }} />
                  <Typography variant="h6" gutterBottom>No grades found</Typography>
                  <Typography variant="body2">
                    {tabValue === 0 ? 'You have no courses in the current term' : 
                     tabValue === 1 ? 'You have no courses in previous terms' : 
                     'No courses found matching your search criteria'}
                  </Typography>
                </Box>
              ) : (
                filteredGrades.map((grade) => {
                  const isExpanded = selectedCourse === grade.id;
                  const gradePercentage = calculateGradePercentage(grade.assignments);
                  const letterGrade = grade.finalGrade || (gradePercentage > 0 ? getLetterGrade(gradePercentage) : 'N/A');
                  const gradeColor = gradePercentage > 0 ? getGradeColor(gradePercentage) : 'rgba(255, 255, 255, 0.5)';
                  
                  return (
                    <Card 
                      key={grade.id}
                      elevation={0} 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        overflow: 'hidden',
                        bgcolor: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.12)',
                        }
                      }}
                      onClick={() => handleCourseClick(grade.id)}
                    >
                      <Box sx={{ borderLeft: `4px solid ${grade.course.color}`, height: '100%' }}>
                        <CardContent sx={{ p: 3 }}>
                          {/* Course header */}
                          <Grid container spacing={2} alignItems="center">
                            <GridItem xs={12} md={6}>
                              <Box>
                                <Typography variant="h6" component="div" sx={{ color: '#fff', fontWeight: 600 }}>
                                  {grade.course.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                  <Chip 
                                    label={grade.course.code} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                      color: '#fff',
                                    }}
                                  />
                                  <Chip 
                                    label={`${grade.course.credits} Credits`} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                      color: '#fff',
                                    }}
                                  />
                                  <Chip 
                                    label={grade.term} 
                                    size="small" 
                                    sx={{ 
                                      bgcolor: 'rgba(255, 255, 255, 0.1)', 
                                      color: '#fff',
                                    }}
                                  />
                                </Box>
                              </Box>
                            </GridItem>
                            
                            <GridItem xs={12} md={6}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                                alignItems: 'center',
                                mt: { xs: 2, md: 0 }
                              }}>
                                <Box sx={{ mr: 4 }}>
                                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5 }}>
                                    Current Grade
                                  </Typography>
                                  <Typography 
                                    variant="h6" 
                                    sx={{ 
                                      color: gradeColor, 
                                      fontWeight: 700,
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {letterGrade}
                                    {gradePercentage > 0 && (
                                      <Typography variant="body2" sx={{ ml: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                                        ({gradePercentage.toFixed(1)}%)
                                      </Typography>
                                    )}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ width: 60, height: 60, position: 'relative' }}>
                                  <CircularProgress
                                    variant="determinate"
                                    value={gradePercentage}
                                    size={60}
                                    thickness={5}
                                    sx={{
                                      color: gradeColor,
                                      '& .MuiCircularProgress-circle': {
                                        strokeLinecap: 'round',
                                      },
                                      opacity: gradePercentage > 0 ? 1 : 0.3
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      bottom: 0,
                                      right: 0,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      component="div"
                                      sx={{ 
                                        color: '#fff', 
                                        fontWeight: 600,
                                        fontSize: '0.875rem'
                                      }}
                                    >
                                      {gradePercentage > 0 ? `${Math.round(gradePercentage)}%` : 'N/A'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            </GridItem>
                          </Grid>
                          
                          {/* Expanded course details */}
                          {isExpanded && (
                            <Box sx={{ mt: 3 }}>
                              <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', mb: 3 }} />
                              
                              <TableContainer component={Paper} sx={{ 
                                bgcolor: 'transparent', 
                                boxShadow: 'none',
                                '& .MuiTableCell-root': {
                                  borderColor: 'rgba(255, 255, 255, 0.1)'
                                }
                              }}>
                                <Table>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Assignment</TableCell>
                                      <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Score</TableCell>
                                      <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Out Of</TableCell>
                                      <TableCell align="center" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Weight</TableCell>
                                      <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Weighted Grade</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {grade.assignments.map((assignment, index) => (
                                      <TableRow key={index}>
                                        <TableCell component="th" scope="row" sx={{ color: '#fff' }}>
                                          {assignment.name}
                                        </TableCell>
                                        <TableCell align="center" sx={{ color: '#fff' }}>
                                          {assignment.score !== null ? assignment.score : '-'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ color: '#fff' }}>
                                          {assignment.total}
                                        </TableCell>
                                        <TableCell align="center" sx={{ color: '#fff' }}>
                                          {assignment.weight}%
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: '#fff' }}>
                                          {assignment.score !== null ? `${((assignment.score / assignment.total) * assignment.weight).toFixed(1)}%` : '-'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow sx={{ '& td': { fontWeight: 600, py: 2 } }}>
                                      <TableCell sx={{ color: '#fff' }}>Overall</TableCell>
                                      <TableCell align="center" colSpan={3} sx={{ color: '#fff' }}>
                                        {letterGrade}
                                      </TableCell>
                                      <TableCell align="right" sx={{ color: gradeColor }}>
                                        {gradePercentage > 0 ? `${gradePercentage.toFixed(1)}%` : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}
                        </CardContent>
                      </Box>
                    </Card>
                  );
                })
              )}
            </Paper>
          </GridItem>
        </Grid>
      </Container>
    </StudentLayout>
  );
};

export default Grades; 