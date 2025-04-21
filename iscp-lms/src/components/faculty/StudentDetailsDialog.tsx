/**
 * StudentDetailsDialog.tsx
 * 
 * Author: MARC MAURICE M. COSTILLAS
 * Date: April 5, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Faculty component for displaying detailed student information
 * including personal data, academic progress, and enrolled courses.
 */

import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, Box, Button, Chip, LinearProgress, List, 
  ListItem, Paper, Typography
} from '@mui/material';
import { Email, Edit as EditIcon } from '@mui/icons-material';

// Import the EnhancedStudent interface if needed, or define it here
interface EnhancedStudent {
  id: number;
  fullName: string;
  firstName?: string;
  lastName?: string;
  email: string;
  campus: string;
  profileImage?: string;
  profilePicture?: string;
  progress?: number;
  grade?: string;
  status?: string;
  studentId?: string;
  enrolledCourses?: Array<{
    id: number;
    title: string;
    code: string;
    progress: number;
  }>;
  enrollment_date?: string;
  formatted_enrollment_date?: string;
  submissions_count?: number;
  total_assignments?: number;
}

interface StudentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  student: EnhancedStudent | null;
  onEdit: (studentId: number) => void;
  getStatusColor: (status: string) => "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
  getAvatarColor: (id: number) => string;
}

const StudentDetailsDialog: React.FC<StudentDetailsDialogProps> = ({
  open,
  onClose,
  student,
  onEdit,
  getStatusColor,
  getAvatarColor
}) => {
  if (!student) return null;

  // Helper functions
  const getEnrollmentDate = (student: EnhancedStudent): string => {
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

  const getCoursesCount = (student: EnhancedStudent): number => {
    return student.enrolledCourses?.length || 0;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={student.profilePicture || student.profileImage}
            alt={student.fullName}
            sx={{ 
              width: 60, 
              height: 60,
              mr: 2,
              bgcolor: student.profilePicture ? undefined : getAvatarColor(student.id)
            }}
          >
            {student.fullName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="h6">{student.fullName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {student.studentId || `ST${String(student.id).padStart(5, '0')}`}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Personal Information
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                  Email:
                </Typography>
                <Typography variant="body2">
                  {student.email}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                  Campus:
                </Typography>
                <Typography variant="body2">
                  {student.campus}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                  Status:
                </Typography>
                <Chip 
                  label={getStudentStatus(student)}
                  color={getStatusColor(getStudentStatus(student))}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                  Enrolled:
                </Typography>
                <Typography variant="body2">
                  {getEnrollmentDate(student)}
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Academic Information
            </Typography>
            
            <Box>
              <Box sx={{ display: 'flex', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                  Courses:
                </Typography>
                <Typography variant="body2">
                  {getCoursesCount(student)} enrolled
                </Typography>
              </Box>
              
              {student.grade && (
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Average Grade:
                  </Typography>
                  <Typography variant="body2">
                    {student.grade}
                  </Typography>
                </Box>
              )}
              
              {student.progress !== undefined && (
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Progress:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={student.progress} 
                      sx={{
                        width: 100,
                        height: 8,
                        borderRadius: 5,
                        mr: 1
                      }}
                    />
                    <Typography variant="body2">
                      {`${Math.round(student.progress)}%`}
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {student.submissions_count !== undefined && (
                <Box sx={{ display: 'flex', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
                    Assignments:
                  </Typography>
                  <Typography variant="body2">
                    {student.submissions_count} / {student.total_assignments} submitted
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Enrolled Courses
            </Typography>
            
            {student.enrolledCourses && student.enrolledCourses.length > 0 ? (
              <List disablePadding>
                {student.enrolledCourses.map(course => (
                  <ListItem key={course.id} disablePadding sx={{ mb: 2 }}>
                    <Paper sx={{ p: 2, width: '100%' }} variant="outlined">
                      <Typography variant="subtitle2">{course.title}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {course.code}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>Progress:</Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={course.progress} 
                          sx={{
                            flexGrow: 1,
                            height: 6,
                            borderRadius: 3,
                            mr: 1
                          }}
                        />
                        <Typography variant="caption">
                          {`${Math.round(course.progress)}%`}
                        </Typography>
                      </Box>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                This student is not enrolled in any courses.
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          startIcon={<Email />} 
          onClick={() => window.open(`mailto:${student.email}`, '_blank')}
        >
          Email Student
        </Button>
        <Button 
          startIcon={<EditIcon />} 
          onClick={() => {
            onEdit(student.id);
            onClose();
          }}
        >
          Edit
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentDetailsDialog; 