/**
 * AssignmentSubmissions.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 8, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Faculty assignment submissions review page for
 * viewing and grading student assignment submissions.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container, Typography, Box, Paper, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, CircularProgress, Alert, TextField, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Card, CardContent, useTheme, alpha,
  Divider, Tooltip, Tabs, Tab
} from '@mui/material';
import {
  ArrowBack, Grading, Download, Check,
  CheckCircle, Warning, 
  AssignmentOutlined, CloudDownload,
  Grade, Visibility
} from '@mui/icons-material';
import facultyService, { Assignment as ServiceAssignment, AssignmentSubmission } from '../../services/FacultyService';
import { format, formatDistance } from 'date-fns';

// Function to download file
const downloadFile = (fileUrl: string | undefined, fileName: string) => {
  if (!fileUrl) return;
  
  // Create anchor element
  const link = document.createElement('a');
  // Set properties
  link.href = `http://localhost:5000${fileUrl}`;
  link.download = fileName || 'submission-file';
  // Append to body
  document.body.appendChild(link);
  // Trigger click event
  link.click();
  // Clean up
  document.body.removeChild(link);
};

// Function to view file in new tab
const viewFile = (fileUrl: string | undefined) => {
  if (!fileUrl) return;
  window.open(`http://localhost:5000${fileUrl}`, '_blank');
};

// Extend the AssignmentSubmission interface to ensure compatibility
interface StudentSubmission extends Omit<AssignmentSubmission, 'studentName'> {
  studentName: string; // Make studentName required
  studentImage?: string;
}

// Assignment type
interface Assignment extends Omit<ServiceAssignment, 'submissions'> {
  submissions?: StudentSubmission[];
}

// Submission tab interface
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AssignmentSubmissions: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // State
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Grading dialog state
  const [openGradeDialog, setOpenGradeDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [gradeValue, setGradeValue] = useState<number | string>('');
  const [feedbackValue, setFeedbackValue] = useState('');
  
  // Fetch assignment and submissions
  useEffect(() => {
    const fetchData = async () => {
      if (!assignmentId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch assignment details
        const assignmentData = await facultyService.getAssignment(Number(assignmentId));
        if (assignmentData) {
          // Convert to our Assignment type
          setAssignment(assignmentData as unknown as Assignment);
        }
        
        // Fetch submissions for this assignment
        const submissionsData = await facultyService.getAssignmentSubmissions(Number(assignmentId));
        // Ensure all submissions have the required fields
        const processedSubmissions: StudentSubmission[] = submissionsData.map(sub => ({
          ...sub,
          studentName: sub.studentName || 'Unknown Student'
        }));
        setSubmissions(processedSubmissions);
      } catch (err) {
        console.error('Error fetching assignment data:', err);
        setError('Failed to load assignment data. Please try again later.');
        
        // Mock data for development
        const mockAssignment: Assignment = {
          id: Number(assignmentId),
          courseId: 1,
          title: 'Research Paper: Interdimensional Physics',
          description: 'Write a 5-page research paper on a chosen topic in interdimensional physics.',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          points: 100,
          createdAt: new Date().toISOString()
        };
        
        const mockSubmissions: StudentSubmission[] = [
          {
            id: 1,
            assignmentId: Number(assignmentId),
            studentId: 1,
            studentName: 'Alex Johnson',
            studentImage: 'https://ui-avatars.com/api/?name=Alex+Johnson&background=random',
            submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'submitted',
            submissionText: 'Here is my research paper on wormhole theory.',
            fileUrl: '/uploads/assignments/paper_wormhole_theory.pdf'
          },
          {
            id: 2,
            assignmentId: Number(assignmentId),
            studentId: 2,
            studentName: 'Maria Garcia',
            studentImage: 'https://ui-avatars.com/api/?name=Maria+Garcia&background=random',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'graded',
            fileUrl: '/uploads/assignments/quantum_entanglement_research.pdf',
            grade: 85,
            feedback: 'Good work! Your analysis of quantum entanglement was thorough, but could use more examples.',
            gradedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            assignmentId: Number(assignmentId),
            studentId: 3,
            studentName: 'John Smith',
            studentImage: 'https://ui-avatars.com/api/?name=John+Smith&background=random',
            submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'submitted',
            fileUrl: '/uploads/assignments/multiverse_theory.pdf'
          },
          {
            id: 4,
            assignmentId: Number(assignmentId),
            studentId: 4,
            studentName: 'Lisa Chen',
            studentImage: 'https://ui-avatars.com/api/?name=Lisa+Chen&background=random',
            submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'late',
            submissionText: 'Sorry for the late submission. Here is my paper on parallel universes.',
            fileUrl: '/uploads/assignments/parallel_universes.pdf'
          }
        ];
        
        setAssignment(mockAssignment);
        setSubmissions(mockSubmissions);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [assignmentId]);
  
  // Open grade dialog
  const handleOpenGradeDialog = (submission: StudentSubmission) => {
    setSelectedSubmission(submission);
    setGradeValue(submission.grade || '');
    setFeedbackValue(submission.feedback || '');
    setOpenGradeDialog(true);
  };
  
  // Close grade dialog
  const handleCloseGradeDialog = () => {
    setOpenGradeDialog(false);
    setSelectedSubmission(null);
  };
  
  // Submit grade
  const handleSubmitGrade = async () => {
    if (!selectedSubmission || gradeValue === '') return;
    
    try {
      const gradeNumber = typeof gradeValue === 'number' ? gradeValue : parseFloat(gradeValue as string);
      
      // Call the API to update the grade
      const success = await facultyService.gradeSubmission(
        selectedSubmission.id, 
        gradeNumber, 
        feedbackValue
      );
      
      if (success) {
        // Update the local state
        const updatedSubmissions = submissions.map(sub => {
          if (sub.id === selectedSubmission.id) {
            return {
              ...sub,
              grade: gradeNumber,
              feedback: feedbackValue,
              status: 'graded' as const,
              gradedAt: new Date().toISOString()
            };
          }
          return sub;
        });
        
        setSubmissions(updatedSubmissions);
        handleCloseGradeDialog();
      } else {
        alert('Failed to grade submission. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting grade:', err);
      alert('An error occurred while grading the submission. Please try again.');
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Get filtered submissions based on tab
  const getFilteredSubmissions = () => {
    if (tabValue === 0) return submissions; // All
    if (tabValue === 1) return submissions.filter(s => s.status === 'submitted' || s.status === 'late'); // Ungraded
    if (tabValue === 2) return submissions.filter(s => s.status === 'graded'); // Graded
    if (tabValue === 3) return submissions.filter(s => s.status === 'late'); // Late
    return submissions;
  };
  
  // Navigate back to assignments
  const handleBack = () => {
    navigate('/faculty/assignments');
  };
  
  return (
    <FacultyLayout title="Assignment Submissions">
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Back button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          sx={{ 
            mb: 3, 
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#fff' }
          }}
        >
          Back to Assignments
        </Button>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 3 }}>
            {error}
          </Alert>
        ) : assignment ? (
          <>
            {/* Assignment details */}
            <Card sx={{ 
              mb: 4, 
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#fff', mb: 1 }}>
                      {assignment.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'} • 
                      Due {(() => {
                        try {
                          const dueDate = new Date(assignment.dueDate);
                          if (isNaN(dueDate.getTime())) {
                            return 'Invalid date';
                          }
                          return format(dueDate, 'MMMM d, yyyy');
                        } catch (error) {
                          console.error('Error formatting date:', error);
                          return 'Invalid date';
                        }
                      })()} • 
                      {assignment.points} points
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Chip 
                      icon={<AssignmentOutlined />} 
                      label={`${submissions.filter(s => s.status === 'graded').length}/${submissions.length} Graded`}
                      sx={{ 
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        fontWeight: 500,
                        '& .MuiChip-icon': { color: theme.palette.primary.main }
                      }}
                    />
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                
                <Typography variant="body1" sx={{ color: '#fff', mb: 2 }}>
                  {assignment.description}
                </Typography>
              </CardContent>
            </Card>
            
            {/* Submissions Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange}
                sx={{
                  '& .MuiTab-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&.Mui-selected': {
                      color: '#fff'
                    }
                  }
                }}
              >
                <Tab label={`All (${submissions.length})`} />
                <Tab label={`Ungraded (${submissions.filter(s => s.status !== 'graded').length})`} />
                <Tab label={`Graded (${submissions.filter(s => s.status === 'graded').length})`} />
                <Tab label={`Late (${submissions.filter(s => s.status === 'late').length})`} />
              </Tabs>
            </Box>
            
            {/* Submissions Table */}
            <TabPanel value={tabValue} index={tabValue}>
              {getFilteredSubmissions().length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No submissions in this category.
                </Alert>
              ) : (
                <TableContainer 
                  component={Paper}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
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
                        <TableCell>Student</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Grade</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getFilteredSubmissions().map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar 
                                src={submission.studentImage} 
                                alt={submission.studentName}
                                sx={{ mr: 2, width: 36, height: 36 }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {submission.studentName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={(() => {
                              try {
                                const submittedDate = new Date(submission.submittedAt);
                                if (isNaN(submittedDate.getTime())) {
                                  return 'Invalid date';
                                }
                                return format(submittedDate, 'MMMM d, yyyy h:mm a');
                              } catch (error) {
                                console.error('Error formatting date:', error);
                                return 'Invalid date';
                              }
                            })()}>
                              <Typography variant="body2">
                                {(() => {
                                  try {
                                    const submittedDate = new Date(submission.submittedAt);
                                    if (isNaN(submittedDate.getTime())) {
                                      return 'Unknown';
                                    }
                                    return formatDistance(submittedDate, new Date(), { addSuffix: true });
                                  } catch (error) {
                                    console.error('Error calculating time distance:', error);
                                    return 'Unknown';
                                  }
                                })()}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {submission.status === 'submitted' && (
                              <Chip 
                                size="small" 
                                icon={<CheckCircle fontSize="small" />} 
                                label="Submitted" 
                                color="primary"
                              />
                            )}
                            {submission.status === 'late' && (
                              <Chip 
                                size="small" 
                                icon={<Warning fontSize="small" />} 
                                label="Late" 
                                color="warning"
                              />
                            )}
                            {submission.status === 'graded' && (
                              <Chip 
                                size="small" 
                                icon={<Grading fontSize="small" />} 
                                label="Graded" 
                                color="success"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {submission.status === 'graded' ? (
                              <Typography variant="body2">
                                <strong>{submission.grade}</strong> / {assignment.points}
                              </Typography>
                            ) : (
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                                Not graded
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              {submission.fileUrl && (
                                <Tooltip title="Download Submission">
                                  <IconButton 
                                    size="small" 
                                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                    onClick={() => downloadFile(submission.fileUrl, submission.studentName)}
                                  >
                                    <CloudDownload />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {submission.fileUrl && (
                                <Tooltip title="View Submission">
                                  <IconButton 
                                    size="small" 
                                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                    onClick={() => viewFile(submission.fileUrl)}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Grade Submission">
                                <IconButton 
                                  size="small" 
                                  sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                                  onClick={() => handleOpenGradeDialog(submission)}
                                >
                                  <Grading />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </TabPanel>
          </>
        ) : (
          <Alert severity="error" sx={{ my: 3 }}>
            Assignment not found
          </Alert>
        )}
        
        {/* Grading Dialog */}
        <Dialog 
          open={openGradeDialog} 
          onClose={handleCloseGradeDialog}
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
          <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
            <Grade sx={{ mr: 1 }} /> Grade Submission
          </DialogTitle>
          
          {selectedSubmission && (
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                  Student: <strong>{selectedSubmission.studentName}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Submitted: {(() => {
                      try {
                        const submittedDate = new Date(selectedSubmission.submittedAt);
                        if (isNaN(submittedDate.getTime())) {
                          return 'Invalid date';
                        }
                        return format(submittedDate, 'MMMM d, yyyy h:mm a');
                      } catch (error) {
                        console.error('Error formatting date:', error);
                        return 'Invalid date';
                      }
                    })()}
                  </Typography>
                  {selectedSubmission.status === 'late' && (
                    <Chip size="small" label="Late" color="warning" />
                  )}
                </Box>
                
                {selectedSubmission.fileUrl && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<CloudDownload />}
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          bgcolor: 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                      onClick={() => downloadFile(selectedSubmission.fileUrl, selectedSubmission.studentName)}
                    >
                      Download Submission
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<Visibility />}
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                          bgcolor: 'rgba(255, 255, 255, 0.05)'
                        }
                      }}
                      onClick={() => viewFile(selectedSubmission.fileUrl)}
                    >
                      View Submission
                    </Button>
                  </Box>
                )}
              </Box>
              
              {selectedSubmission.submissionText && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                    Submission Text:
                  </Typography>
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(0, 0, 0, 0.2)', 
                    color: 'rgba(255, 255, 255, 0.85)',
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Typography variant="body2">
                      {selectedSubmission.submissionText}
                    </Typography>
                  </Paper>
                </Box>
              )}
              
              <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
                <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                  <TextField
                    label="Grade"
                    type="number"
                    value={gradeValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGradeValue(val === '' ? '' : Number(val));
                    }}
                    fullWidth
                    InputProps={{
                      inputProps: { 
                        min: 0, 
                        max: assignment?.points || 100 
                      },
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
                    helperText={`Out of ${assignment?.points || 100} points`}
                    FormHelperTextProps={{
                      sx: { color: 'rgba(255, 255, 255, 0.5)' }
                    }}
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: '67%' } }}>
                  <TextField
                    label="Feedback"
                    value={feedbackValue}
                    onChange={(e) => setFeedbackValue(e.target.value)}
                    fullWidth
                    multiline
                    rows={6}
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
                    InputLabelProps={{
                      sx: { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Box>
              </Box>
            </DialogContent>
          )}
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseGradeDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmitGrade}
              startIcon={<Check />}
              sx={{
                bgcolor: theme.palette.success.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.success.main, 0.8)
                }
              }}
            >
              Submit Grade
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </FacultyLayout>
  );
};

export default AssignmentSubmissions; 