/**
 * FacultyService.ts
 * 
 * Author: MARC MAURICE M. COSTILLAS
 * Date: April 1, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Service class that handles all faculty-related API calls and data management.
 * This includes course management, student grading, assignment creation/management,
 * and communication with students.
 */

import axios from 'axios';

export interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  teacherId: number;
  credits: number;
  maxStudents: number;
  campus: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  enrolledStudents?: number;
  progress?: number;
  request_status?: 'pending' | 'approved' | 'rejected';
  request_notes?: string;
}

export interface Student {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
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
  // Additional fields for enhanced student page
  courseName?: string;
  courseId?: number;
  enrollment_date?: string;
  formatted_enrollment_date?: string;
  enrollment_status?: string;
  average_grade?: number;
  submissions_count?: number;
  total_assignments?: number;
  submission_rate?: string;
  attendance_count?: number;
}

export interface Assignment {
  id: number;
  courseId: number;
  instructorId?: number;
  title: string;
  description: string;
  instructions?: string;
  dueDate: string;
  points: number;
  maxAttempts?: number;
  allowLateSubmission?: boolean;
  visibility?: 'draft' | 'published';
  attachmentUrl?: string;
  attachmentType?: string;
  createdAt: string;
  updatedAt?: string;
  submissions?: AssignmentSubmission[];
  submissions_count?: number;
  graded_count?: number;
  stats?: {
    total_submissions: number;
    graded_count: number;
    submitted_count: number;
    late_count: number;
    average_grade: number | null;
  }
}

export interface AssignmentSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  attemptNumber?: number;
  submissionText?: string;
  fileUrl?: string;
  fileType?: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: number;
  status: 'draft' | 'submitted' | 'late' | 'graded' | 'resubmitted';
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassSession {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingLink?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface Discussion {
  id: number;
  title: string;
  content?: string;
  courseId: number;
  createdBy: number;
  createdAt: string;
  updatedAt?: string;
  isAnnouncement?: boolean;
  isLocked?: boolean;
  isPinned?: boolean;
  replies?: number;
  participants?: number;
  lastActive?: string;
}

export interface DiscussionReply {
  id: number;
  discussionId: number;
  userId: number;
  userName?: string;
  userRole?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: number;
  authorId: number;
  title: string;
  content: string;
  target: 'all' | 'students' | 'teachers' | 'admins';
  campus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  uploadedBy: number;
  createdAt: string;
  updatedAt?: string;
  type: string;
  url?: string;
  course_name?: string;
  course_code?: string;
}

export interface UserSettings {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  assignmentNotifications: boolean;
  messageNotifications: boolean;
  announcementNotifications: boolean;
  profileVisibility: 'public' | 'private' | 'contacts';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  createdAt: string;
  updatedAt: string;
  email?: string;
  campus?: string;
  facultyId?: number;
  department?: string;
  position?: string;
}

export interface CourseProgress {
  studentId: number;
  studentName: string;
  email: string;
  profileImage?: string;
  modulesCompleted: number;
  totalModules: number;
  progressPercent: number;
  submissionsCount: number;
  averageGrade: number | null;
  lastActivity?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'announcement' | 'grade' | 'assignment' | 'course' | 'message' | 'system' | 'submission';
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

class FacultyService {
  private apiUrl: string;
  private readonly STORAGE_KEYS = {
    USER_SETTINGS: 'faculty_user_settings',
    NOTIFICATIONS: 'faculty_notifications'
  };

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  // Helper method to get the authorization header
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Helper method to ensure authorization headers are set
  private ensureAuthHeaders() {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  // Faculty Profile and Settings Methods
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      // Always try the API first if we have token
      if (localStorage.getItem('token')) {
        try {
          const response = await axios.get(`${this.apiUrl}/api/user/settings`, {
            headers: this.getAuthHeader()
          });
          
          if (response.data) {
            console.log('Retrieved faculty settings from API:', response.data);
            
            // Transform to match our interface
            const settings: UserSettings = {
              ...response.data,
              userId: response.data.user_id || response.data.userId,
              firstName: response.data.first_name || response.data.firstName,
              lastName: response.data.last_name || response.data.lastName,
              profilePicture: response.data.profile_picture || response.data.profilePicture,
              emailNotifications: response.data.email_notifications || response.data.emailNotifications,
              pushNotifications: response.data.push_notifications || response.data.pushNotifications,
              assignmentNotifications: response.data.assignment_notifications || response.data.assignmentNotifications,
              messageNotifications: response.data.message_notifications || response.data.messageNotifications,
              announcementNotifications: response.data.announcement_notifications || response.data.announcementNotifications,
              profileVisibility: response.data.profile_visibility || response.data.profileVisibility,
              showOnlineStatus: response.data.show_online_status || response.data.showOnlineStatus,
              showLastSeen: response.data.show_last_seen || response.data.showLastSeen,
              createdAt: response.data.created_at || response.data.createdAt,
              updatedAt: response.data.updated_at || response.data.updatedAt,
              facultyId: response.data.faculty_id || response.data.facultyId || response.data.student_id
            };
            
            // Cache in localStorage
            localStorage.setItem('faculty_profile', JSON.stringify(settings));
            return settings;
          }
        } catch (apiError: any) {
          console.log('API error:', apiError.message);
          if (apiError.response?.status === 404) {
            console.log('Settings not found, will create default settings');
          } else if (apiError.code === 'ERR_NETWORK') {
            console.log('Network error - backend may not be running');
          } else {
            console.log('API error:', apiError.response?.status, apiError.response?.data);
          }
        }
      }
      
      // If API failed, try localStorage as a fallback
      const profileJson = localStorage.getItem('faculty_profile');
      if (profileJson) {
        const parsedProfile = JSON.parse(profileJson);
        console.log('Retrieved faculty settings from localStorage:', parsedProfile);
        
        // Now if we have a user object, make sure profile data matches user details
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          const nameParts = user.fullName ? user.fullName.split(' ') : ['', ''];
          
          // Update any missing essential fields
          const updatedProfile = {
            ...parsedProfile,
            userId: parsedProfile.userId || parseInt(user.id || '0', 10),
            firstName: parsedProfile.firstName || nameParts[0] || '',
            lastName: parsedProfile.lastName || nameParts.slice(1).join(' ') || '',
            email: parsedProfile.email || user.email || '',
            campus: parsedProfile.campus || user.campus || '',
            facultyId: parsedProfile.facultyId || parseInt(user.id || '0', 10),
            profilePicture: parsedProfile.profilePicture || user.profileImage || ''
          };
          
          // If we made changes, save them back to localStorage
          if (JSON.stringify(updatedProfile) !== profileJson) {
            localStorage.setItem('faculty_profile', JSON.stringify(updatedProfile));
            console.log('Updated faculty profile with user details:', updatedProfile);
          }
          
          return updatedProfile;
        }
        
        return parsedProfile;
      }
      
      // If no settings exist, create default settings
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        const nameParts = user.fullName ? user.fullName.split(' ') : ['', ''];
        
        const defaultSettings: UserSettings = {
          id: 0,
          userId: parseInt(user.id || '0', 10),
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          phone: '',
          profilePicture: user.profileImage || '',
          theme: 'dark',
          language: 'English',
          emailNotifications: true,
          pushNotifications: true,
          assignmentNotifications: true,
          messageNotifications: true,
          announcementNotifications: true,
          profileVisibility: 'public',
          showOnlineStatus: true,
          showLastSeen: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          facultyId: parseInt(user.id || '0', 10),
          campus: user.campus || '',
          department: '',
          position: 'Instructor'
        };
        
        // Save default settings to localStorage
        localStorage.setItem('faculty_profile', JSON.stringify(defaultSettings));
        console.log('Created and saved default faculty settings:', defaultSettings);
        
        // Try to save to API in background
        this.updateUserSettings(defaultSettings)
          .catch(error => {
            console.log('Failed to save default faculty settings to API:', error);
          });
        
        return defaultSettings;
      }
      
      return null;
    } catch (error) {
      console.error('Error in faculty getUserSettings:', error);
      return null;
    }
  }

  async updateUserSettings(settings: UserSettings): Promise<boolean> {
    try {
      // First update localStorage
      localStorage.setItem('faculty_profile', JSON.stringify(settings));
      
      // Notify components that user data has been updated
      window.dispatchEvent(new Event('user-updated'));
      
      // Format data for the server
      const serverData = {
        firstName: settings.firstName,
        lastName: settings.lastName,
        phone: settings.phone,
        theme: settings.theme,
        language: settings.language,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        assignmentNotifications: settings.assignmentNotifications,
        messageNotifications: settings.messageNotifications,
        announcementNotifications: settings.announcementNotifications,
        profileVisibility: settings.profileVisibility,
        showOnlineStatus: settings.showOnlineStatus,
        showLastSeen: settings.showLastSeen,
        department: settings.department,
        position: settings.position
      };
      
      // Then try to update API
      if (localStorage.getItem('token')) {
        try {
          const response = await axios.put(`${this.apiUrl}/api/user/settings`, serverData, {
            headers: this.getAuthHeader()
          });
          
          if (response.data) {
            console.log('Updated faculty settings on server:', response.data);
          }
        } catch (apiError: any) {
          console.log('API error:', apiError.message);
          if (apiError.response?.status === 404) {
            console.log('Settings endpoint not found');
          } else if (apiError.code === 'ERR_NETWORK') {
            console.log('Network error - backend may not be running');
          } else {
            console.log('API error:', apiError.response?.status, apiError.response?.data);
          }
          console.log('Settings saved to localStorage only');
          return true; // Still return true since we saved to localStorage
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error updating faculty settings:', error);
      return false;
    }
  }

  async uploadProfilePicture(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Try to upload to API first
      try {
        const response = await axios.post(
          `${this.apiUrl}/api/user/profile-picture`,
          formData,
          {
            headers: {
              ...this.getAuthHeader(),
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        if (response.data && response.data.profilePicture) {
          // Update localStorage
          const profileJson = localStorage.getItem('faculty_profile');
          if (profileJson) {
            const profile = JSON.parse(profileJson);
            profile.profilePicture = response.data.profilePicture;
            localStorage.setItem('faculty_profile', JSON.stringify(profile));
            
            // Also update the user object
            const userJson = localStorage.getItem('user');
            if (userJson) {
              const user = JSON.parse(userJson);
              user.profileImage = response.data.profilePicture;
              localStorage.setItem('user', JSON.stringify(user));
            }
            
            window.dispatchEvent(new Event('user-updated'));
            return response.data.profilePicture;
          }
        }
      } catch (apiError) {
        console.log('API not available for profile picture upload, using local fallback');
      }
      
      // Fallback to localStorage if API fails
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          
          // Save the data URL to localStorage
          const profileJson = localStorage.getItem('faculty_profile');
          if (profileJson) {
            try {
              const profile = JSON.parse(profileJson);
              profile.profilePicture = dataUrl;
              localStorage.setItem('faculty_profile', JSON.stringify(profile));
              
              // Also update the user object
              const userJson = localStorage.getItem('user');
              if (userJson) {
                const user = JSON.parse(userJson);
                user.profileImage = dataUrl;
                localStorage.setItem('user', JSON.stringify(user));
              }
              
              window.dispatchEvent(new Event('user-updated'));
              resolve(dataUrl);
            } catch (err) {
              reject(new Error('Failed to update profile with new image'));
            }
          } else {
            reject(new Error('No profile found to update'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return null;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      await axios.put(
        `${this.apiUrl}/api/user/password`,
        { currentPassword, newPassword },
        { headers: this.getAuthHeader() }
      );
      
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  // Course Management Methods
  async getMyCourses(): Promise<Course[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      
      // Return sample data if API fails
      return [
        {
          id: 1,
          code: 'MDI-501',
          title: 'Multiversal Diplomacy',
          description: 'Learn the principles of interdimensional relations and negotiation tactics with diverse multiverse entities.',
          teacherId: 2,
          credits: 3,
          maxStudents: 30,
          campus: 'Main Campus',
          status: 'active',
          createdAt: '2023-01-15T00:00:00Z',
          updatedAt: '2023-01-15T00:00:00Z',
          enrolledStudents: 28,
          progress: 65
        },
        {
          id: 2,
          code: 'TTE-340',
          title: 'Time Travel Ethics',
          description: 'Explore the moral implications of temporal manipulation and paradox mitigation strategies.',
          teacherId: 2,
          credits: 4,
          maxStudents: 40,
          campus: 'Main Campus',
          status: 'active',
          createdAt: '2023-01-15T00:00:00Z',
          updatedAt: '2023-01-15T00:00:00Z',
          enrolledStudents: 35,
          progress: 42
        }
      ];
    }
  }

  async getCourseDetails(courseId: number): Promise<Course | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses/${courseId}`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching course ${courseId}:`, error);
      return null;
    }
  }

  async getCourseStudents(courseId: number): Promise<Student[]> {
    try {
      // Set up the authorization header
      this.ensureAuthHeaders();
      
      console.log(`Fetching students for course ${courseId}`);
      
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses/${courseId}/students`, {
        headers: this.getAuthHeader()
      });
      
      console.log(`Successfully fetched ${response.data.length} students for course ${courseId}`);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching students for course ${courseId}:`, error);
      
      // In this case, we'll still rely on the backend's response
      // The backend should now handle creating sample data if needed
      throw error;
    }
  }

  // Assignment Management Methods
  async getCourseAssignments(courseId: number): Promise<Assignment[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses/${courseId}/assignments`, {
        headers: this.getAuthHeader()
      });
      
      // Make sure dates are valid and map response to the Assignment interface
      return response.data.map((item: any) => ({
        id: item.id,
        courseId: item.course_id,
        instructorId: item.instructor_id,
        title: item.title,
        description: item.description || '',
        instructions: item.instructions || '',
        dueDate: this.formatDateIfNeeded(item.due_date),
        points: item.points,
        maxAttempts: item.max_attempts || 1,
        allowLateSubmission: item.allow_late_submission || false,
        visibility: item.visibility,
        attachmentUrl: item.attachment_url,
        attachmentType: item.attachment_type,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        submissions_count: item.submissions_count,
        graded_count: item.graded_count
      }));
    } catch (error) {
      console.error(`Error fetching assignments for course ${courseId}:`, error);
      return [];
    }
  }

  async createAssignment(assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assignment | null> {
    try {
      this.ensureAuthHeaders();
      
      // Convert camelCase to snake_case for backend
      const payload = {
        courseId: assignment.courseId,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        points: assignment.points,
        maxAttempts: assignment.maxAttempts,
        allowLateSubmission: assignment.allowLateSubmission,
        visibility: assignment.visibility || 'published',
        attachmentUrl: assignment.attachmentUrl,
        attachmentType: assignment.attachmentType
      };
      
      const response = await axios.post(`${this.apiUrl}/api/faculty/courses/${assignment.courseId}/assignments`, payload);
      
      if (response.data) {
        // Convert response to match our interface
        return {
          id: response.data.id,
          courseId: response.data.course_id,
          instructorId: response.data.instructor_id,
          title: response.data.title,
          description: response.data.description,
          instructions: response.data.instructions,
          dueDate: response.data.due_date,
          points: response.data.points,
          maxAttempts: response.data.max_attempts,
          allowLateSubmission: response.data.allow_late_submission,
          visibility: response.data.visibility,
          attachmentUrl: response.data.attachment_url,
          attachmentType: response.data.attachment_type,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at
        };
      }
      return null;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  }

  // Helper function to ensure date strings are valid
  private formatDateIfNeeded(dateString: string): string {
    try {
      // Check if the date is valid
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString(); // Return current date if invalid
      }
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString(); // Return current date if error
    }
  }

  async updateAssignment(id: number, assignment: Partial<Assignment>): Promise<boolean> {
    try {
      await axios.put(`${this.apiUrl}/api/faculty/assignments/${id}`, {
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        dueDate: assignment.dueDate,
        points: assignment.points,
        maxAttempts: assignment.maxAttempts,
        allowLateSubmission: assignment.allowLateSubmission,
        visibility: assignment.visibility,
        attachmentUrl: assignment.attachmentUrl,
        attachmentType: assignment.attachmentType
      }, {
        headers: this.getAuthHeader()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating assignment ${id}:`, error);
      return false;
    }
  }

  async deleteAssignment(id: number): Promise<boolean> {
    try {
      if (!id || isNaN(id)) {
        console.error('Invalid assignment ID provided for deletion:', id);
        return false;
      }

      console.log(`Starting delete process for assignment ID: ${id}`);
      this.ensureAuthHeaders();
      
      // For development mode - simulate successful deletion without API call
      if (process.env.NODE_ENV === 'development' && !this.apiUrl.includes('localhost')) {
        console.log('Development mode with no local backend - simulating successful deletion');
        return new Promise(resolve => {
          setTimeout(() => resolve(true), 500);
        });
      }
      
      try {
        console.log(`Calling delete API endpoint for assignment ${id}`);
        await axios.delete(`${this.apiUrl}/api/faculty/assignments/${id}`, {
          headers: this.getAuthHeader()
        });
        
        console.log(`API call successful for deleting assignment ${id}`);
        return true;
      } catch (apiError: any) {
        console.error(`API error when deleting assignment ${id}:`, apiError?.response?.data || apiError);
        
        // For development mode - simulate successful deletion when API isn't available
        if (process.env.NODE_ENV === 'development') {
          console.log('Simulating successful deletion in development mode despite API error');
          return true;
        }
        
        // Let the caller handle the error
        return false;
      }
    } catch (error) {
      console.error(`Error in deleteAssignment for ID ${id}:`, error);
      
      // Fallback for development environment
      if (process.env.NODE_ENV === 'development') {
        return true;
      }
      
      return false;
    }
  }

  async getAssignmentSubmissions(assignmentId: number): Promise<AssignmentSubmission[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/assignments/${assignmentId}/submissions`, {
        headers: this.getAuthHeader()
      });
      
      // Process and validate submissions data
      return response.data.map((submission: any) => {
        // Convert snake_case to camelCase and validate date fields
        return {
          id: submission.id,
          assignmentId: submission.assignment_id || submission.assignmentId,
          studentId: submission.student_id || submission.studentId,
          studentName: submission.student_name || submission.studentName || 'Unknown Student',
          studentEmail: submission.student_email || submission.studentEmail,
          attemptNumber: submission.attempt_number || submission.attemptNumber || 1,
          submissionText: submission.submission_text || submission.submissionText || '',
          fileUrl: submission.file_url || submission.fileUrl,
          fileType: submission.file_type || submission.fileType,
          submittedAt: this.formatDateIfNeeded(submission.submitted_at || submission.submittedAt),
          grade: submission.grade,
          feedback: submission.feedback || '',
          gradedAt: submission.graded_at ? this.formatDateIfNeeded(submission.graded_at) : undefined,
          gradedBy: submission.graded_by || submission.gradedBy,
          status: submission.status || 'submitted',
          createdAt: submission.created_at ? this.formatDateIfNeeded(submission.created_at) : undefined,
          updatedAt: submission.updated_at ? this.formatDateIfNeeded(submission.updated_at) : undefined
        };
      });
    } catch (error) {
      console.error('Error fetching assignment submissions:', error);
      return [];
    }
  }

  async getAssignment(assignmentId: number): Promise<Assignment | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/assignments/${assignmentId}`, {
        headers: this.getAuthHeader()
      });
      
      if (!response.data) return null;
      
      // Format the response to match our interface and handle date formatting
      const data = response.data;
      return {
        id: data.id,
        courseId: data.course_id,
        instructorId: data.instructor_id,
        title: data.title,
        description: data.description || '',
        instructions: data.instructions || '',
        dueDate: this.formatDateIfNeeded(data.due_date),
        points: data.points,
        maxAttempts: data.max_attempts || 1,
        allowLateSubmission: data.allow_late_submission || false,
        visibility: data.visibility,
        attachmentUrl: data.attachment_url,
        attachmentType: data.attachment_type,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        stats: data.stats,
      };
    } catch (error) {
      console.error('Error fetching assignment details:', error);
      return null;
    }
  }

  async gradeSubmission(submissionId: number, grade: number, feedback?: string): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      
      // Format request payload
      const payload = {
        grade: grade,
        feedback: feedback || ''
      };
      
      // Send request to the API
      const response = await axios.put(
        `${this.apiUrl}/api/faculty/submissions/${submissionId}/grade`, 
        payload,
        { headers: this.getAuthHeader() }
      );
      
      console.log('Submission graded successfully:', response.data);
      return true;
    } catch (error) {
      console.error(`Error grading submission ${submissionId}:`, error);
      
      // For development/fallback when API is not available
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock response for grading in development mode');
        return true;
      }
      
      return false;
    }
  }

  async uploadAssignmentAttachment(file: File): Promise<{ url: string, type: string } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${this.apiUrl}/api/uploads/assignment`, 
        formData, 
        {
          headers: {
            ...this.getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return {
        url: response.data.fileUrl,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading assignment attachment:', error);
      return null;
    }
  }

  async publishAssignment(assignmentId: number): Promise<boolean> {
    try {
      await axios.put(`${this.apiUrl}/api/faculty/assignments/${assignmentId}`, {
        visibility: 'published'
      }, {
        headers: this.getAuthHeader()
      });
      
      return true;
    } catch (error) {
      console.error(`Error publishing assignment ${assignmentId}:`, error);
      return false;
    }
  }

  // Class Session Management Methods
  async getCourseClassSessions(courseId: number): Promise<ClassSession[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses/${courseId}/sessions`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching class sessions for course ${courseId}:`, error);
      return [];
    }
  }

  async createClassSession(session: Omit<ClassSession, 'id'>): Promise<ClassSession | null> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/faculty/sessions`,
        session,
        { headers: this.getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating class session:', error);
      return null;
    }
  }

  async updateClassSession(id: number, session: Partial<ClassSession>): Promise<boolean> {
    try {
      await axios.put(
        `${this.apiUrl}/api/faculty/sessions/${id}`,
        session,
        { headers: this.getAuthHeader() }
      );
      
      return true;
    } catch (error) {
      console.error(`Error updating class session ${id}:`, error);
      return false;
    }
  }

  async cancelClassSession(id: number): Promise<boolean> {
    try {
      await axios.put(
        `${this.apiUrl}/api/faculty/sessions/${id}/cancel`,
        {},
        { headers: this.getAuthHeader() }
      );
      
      return true;
    } catch (error) {
      console.error(`Error cancelling class session ${id}:`, error);
      return false;
    }
  }

  // Discussion Management Methods
  async getCourseDiscussions(courseId: number): Promise<Discussion[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses/${courseId}/discussions`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching discussions for course ${courseId}:`, error);
      return [];
    }
  }

  async createDiscussion(discussion: Omit<Discussion, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<Discussion | null> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/faculty/discussions`,
        discussion,
        { headers: this.getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating discussion:', error);
      return null;
    }
  }

  async getDiscussionDetails(discussionId: number): Promise<Discussion | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/discussions/${discussionId}`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching discussion ${discussionId}:`, error);
      return null;
    }
  }

  async replyToDiscussion(discussionId: number, content: string): Promise<DiscussionReply | null> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/faculty/discussions/${discussionId}/replies`,
        { content },
        { headers: this.getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error replying to discussion ${discussionId}:`, error);
      return null;
    }
  }

  // Announcement Management Methods
  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'authorId' | 'createdAt' | 'updatedAt'>): Promise<Announcement | null> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/faculty/announcements`,
        announcement,
        { headers: this.getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      return null;
    }
  }

  async getMyAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/announcements`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }

  // Course Materials Management Methods
  async getCourseMaterials(courseId: number): Promise<Material[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses/${courseId}/materials`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching materials for course ${courseId}:`, error);
      return [];
    }
  }

  async uploadCourseMaterial(material: {
    courseId: number;
    title: string;
    description?: string;
    file: File;
  }): Promise<Material | null> {
    try {
      const formData = new FormData();
      formData.append('courseId', material.courseId.toString());
      formData.append('title', material.title);
      if (material.description) {
        formData.append('description', material.description);
      }
      formData.append('file', material.file);
      
      const response = await axios.post(
        `${this.apiUrl}/api/faculty/materials`,
        formData,
        {
          headers: {
            ...this.getAuthHeader(),
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading course material:', error);
      return null;
    }
  }

  async deleteCourseMaterial(id: number): Promise<boolean> {
    try {
      await axios.delete(`${this.apiUrl}/api/faculty/materials/${id}`, {
        headers: this.getAuthHeader()
      });
      
      return true;
    } catch (error) {
      console.error(`Error deleting course material ${id}:`, error);
      return false;
    }
  }

  // Student Progress Tracking Methods
  async getStudentProgress(studentId: number, courseId: number): Promise<{
    assignments: Array<{ id: number; title: string; status: string; score?: number; maxPoints: number }>;
    attendance: Array<{ date: string; status: 'present' | 'absent' | 'late' | 'excused' }>;
    overallGrade?: number;
    overallProgress: number;
  } | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/students/${studentId}/courses/${courseId}/progress`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching progress for student ${studentId} in course ${courseId}:`, error);
      return null;
    }
  }

  // Course Progress Tracking Methods
  async getCourseProgress(courseId: number): Promise<CourseProgress[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/courses/${courseId}/progress`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching progress for course ${courseId}:`, error);
      return [];
    }
  }

  // Update student progress in a course
  async updateStudentProgress(
    studentId: number,
    courseId: number,
    progress: number
  ): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.patch(
        `${this.apiUrl}/api/faculty/courses/${courseId}/students/${studentId}/progress`,
        { progress },
        { headers: this.getAuthHeader() }
      );
      
      console.log('Progress updated successfully:', response.data);
      return true;
    } catch (error) {
      console.error(`Error updating progress for student ${studentId} in course ${courseId}:`, error);
      return false;
    }
  }

  // Request a new course
  async requestCourse(courseData: Partial<Course>): Promise<Course> {
    try {
      this.ensureAuthHeaders();
      
      // Set the request_status to pending by default
      const courseWithStatus = {
        ...courseData,
        request_status: 'pending'
      };
      
      console.log('Requesting new course:', courseWithStatus);
      
      // Attempt to call the API
      try {
        const response = await axios.post(
          `${this.apiUrl}/api/faculty/courses/request`, 
          courseWithStatus,
          {
            headers: this.getAuthHeader()
          }
        );
        
        console.log('Course request submitted successfully:', response.data);
        return response.data;
      } catch (apiError: any) {
        console.error('API error when requesting course:', apiError);
        
        // If a specific error response comes from the server, propagate it
        if (apiError.response && apiError.response.data && apiError.response.data.message) {
          throw new Error(apiError.response.data.message);
        }
        
        // If we're in development mode or API is not available,
        // simulate a successful response for demonstration
        if (process.env.NODE_ENV === 'development' || apiError.code === 'ERR_NETWORK') {
          console.log('Using mock response for course request in development mode');
          
          // Create a mock response with the submitted data plus an ID
          const mockResponse = {
            ...courseWithStatus,
            id: Math.floor(Math.random() * 1000) + 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Simulate a brief delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          return mockResponse as Course;
        }
        
        // If we're in production and there's a real API error, propagate it
        throw apiError;
      }
    } catch (error) {
      console.error('Error requesting new course:', error);
      throw error;
    }
  }

  /**
   * Archives a course
   * @param courseId - The ID of the course to archive
   * @returns A boolean indicating whether the operation was successful
   */
  async archiveCourse(courseId: number): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      
      const response = await axios.put(
        `${this.apiUrl}/courses/${courseId}/archive`,
        {},
        { headers: this.getAuthHeader() }
      );
      
      return response.status === 200;
    } catch (error) {
      console.error('Error archiving course:', error);
      return false;
    }
  }

  // Get faculty profile information
  async getProfile() {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/faculty/profile`);
      return response.data;
    } catch (error) {
      console.error('Error fetching faculty profile:', error);
      // Return a mock profile with default campus if API fails
      return {
        id: 1,
        email: 'faculty@example.com',
        full_name: 'Faculty Member',
        campus: 'El Dorado Campus',
        profile_image: null,
        settings: {}
      };
    }
  }

  async getAllStudents(): Promise<Student[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/faculty/students`, {
        headers: this.getAuthHeader()
      });
      
      // Transform data to ensure compatibility with the frontend
      return response.data.map((student: any) => ({
        id: student.id,
        fullName: student.fullName || student.full_name,
        firstName: student.firstName || student.first_name,
        lastName: student.lastName || student.last_name,
        email: student.email,
        campus: student.campus,
        profileImage: student.profileImage || student.profile_image,
        profilePicture: student.profilePicture,
        progress: student.progress,
        grade: student.grade,
        status: student.status,
        studentId: student.studentId,
        enrolledCourses: student.enrolledCourses,
        enrollment_date: student.enrollment_date,
        formatted_enrollment_date: student.formatted_enrollment_date,
        submissions_count: student.submissions_count,
        total_assignments: student.total_assignments,
        submission_rate: student.submission_rate
      }));
    } catch (error) {
      console.error('Error fetching all students:', error);
      if (process.env.NODE_ENV === 'development') {
        // Return mock data in development if API fails
        const mockStudents = this.getMockStudents();
        return mockStudents;
      }
      throw error;
    }
  }

  // Add method to get student details by ID
  async getStudentDetails(studentId: number): Promise<Student | null> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/faculty/students/${studentId}`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching student details for student ${studentId}:`, error);
      return null;
    }
  }

  // Add method to update student status
  async updateStudentStatus(studentId: number, status: string): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      await axios.put(`${this.apiUrl}/api/faculty/students/${studentId}/status`, 
        { status },
        { headers: this.getAuthHeader() }
      );
      
      return true;
    } catch (error) {
      console.error(`Error updating status for student ${studentId}:`, error);
      return false;
    }
  }

  // Method to generate mock student data for development
  private getMockStudents(): Student[] {
    return [
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
        enrollment_date: new Date().toISOString(),
        formatted_enrollment_date: 'Jan 15, 2023',
        progress: 75,
        grade: '85.5',
        submissions_count: 8,
        total_assignments: 10,
        submission_rate: '80.0',
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
        enrollment_date: new Date().toISOString(),
        formatted_enrollment_date: 'Jan 15, 2023',
        progress: 95,
        grade: '94.2',
        submissions_count: 10,
        total_assignments: 10,
        submission_rate: '100.0',
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
      }
    ];
  }

  // Get all faculty messages
  async getMessages(): Promise<any[]> {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll return sample data similar to the student side
      return [
        {
          id: 1,
          name: 'John Doe',
          avatar: '/avatars/john.jpg',
          role: 'Student',
          course: 'Multiversal Diplomacy',
          lastMessage: 'Professor, I have a question about the assignment.',
          timestamp: 'Today, 2:30 PM',
          unread: 2,
          online: true
        },
        {
          id: 2,
          name: 'Jane Smith',
          avatar: '/avatars/jane.jpg',
          role: 'Student',
          course: 'Multiversal Diplomacy',
          lastMessage: 'Thank you for the feedback on my paper!',
          timestamp: 'Yesterday',
          unread: 0,
          online: false
        },
        {
          id: 3,
          name: 'Dr. Stephen Strange',
          avatar: '/avatars/strange.jpg',
          role: 'Faculty',
          course: 'Department Chair',
          lastMessage: 'Please submit your course plans for next semester.',
          timestamp: 'May 2',
          unread: 1,
          online: true
        },
        {
          id: 4,
          name: 'Bruce Banner',
          avatar: '/avatars/bruce.jpg',
          role: 'Faculty',
          course: 'Physics Department',
          lastMessage: 'Can we discuss the interdepartmental research project?',
          timestamp: 'Apr 28',
          unread: 0,
          online: false
        },
        {
          id: 5,
          name: 'Peter Parker',
          avatar: '/avatars/peter.jpg',
          role: 'Student',
          course: 'Advanced Web Technologies',
          lastMessage: 'I\'ve submitted my project for review.',
          timestamp: 'Apr 25',
          unread: 0,
          online: true
        }
      ];
    } catch (error) {
      console.error('Error fetching faculty messages:', error);
      return [];
    }
  }

  // Get conversation history for a specific contact
  async getConversation(contactId: number): Promise<any[]> {
    try {
      // In a real implementation, this would fetch from the API
      // For now, we'll return sample data
      const conversations: Record<number, any[]> = {
        1: [
          {
            id: 1,
            sender: 1,
            content: 'Professor, I have a question about the assignment.',
            timestamp: 'Today, 2:30 PM',
            read: false
          },
          {
            id: 2, 
            sender: 0,
            content: 'Of course, what would you like to know?',
            timestamp: 'Today, 2:31 PM',
            read: true
          },
          {
            id: 3,
            sender: 1,
            content: 'I\'m not sure how to approach the third question about dimensional portals.',
            timestamp: 'Today, 2:32 PM',
            read: false
          }
        ],
        3: [
          {
            id: 1,
            sender: 3,
            content: 'Hello Professor, hope you\'re doing well.',
            timestamp: 'May 2, 9:30 AM',
            read: true
          },
          {
            id: 2,
            sender: 0,
            content: 'Hello Dr. Strange, I\'m doing well. How can I help?',
            timestamp: 'May 2, 9:45 AM',
            read: true
          },
          {
            id: 3,
            sender: 3,
            content: 'Please submit your course plans for next semester.',
            timestamp: 'May 2, 10:00 AM',
            read: false
          }
        ]
      };
      
      return conversations[contactId] || [];
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return [];
    }
  }

  // Notifications
  public async getNotifications(): Promise<Notification[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/notifications`, {
        headers: this.getAuthHeader()
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Cache the notifications
        localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(response.data));
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fall back to cached notifications
      const cachedNotifications = localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS);
      return cachedNotifications ? JSON.parse(cachedNotifications) : [];
    }
  }
  
  public async getUnreadNotificationCount(): Promise<number> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/faculty/notifications/count`, {
        headers: this.getAuthHeader()
      });
      
      if (response.data && typeof response.data.count === 'number') {
        return response.data.count;
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  }
  
  public async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      await axios.patch(`${this.apiUrl}/api/faculty/notifications/${id}`, {}, {
        headers: this.getAuthHeader()
      });
      
      // Update the local cache
      const cachedNotifications = localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS);
      if (cachedNotifications) {
        const notifications: Notification[] = JSON.parse(cachedNotifications);
        const updatedNotifications = notifications.map(notification => 
          notification.id === id ? { ...notification, is_read: true } : notification
        );
        localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  public async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      await axios.patch(`${this.apiUrl}/api/faculty/notifications`, {}, {
        headers: this.getAuthHeader()
      });
      
      // Update the local cache
      const cachedNotifications = localStorage.getItem(this.STORAGE_KEYS.NOTIFICATIONS);
      if (cachedNotifications) {
        const notifications: Notification[] = JSON.parse(cachedNotifications);
        const updatedNotifications = notifications.map(notification => ({ ...notification, is_read: true }));
        localStorage.setItem(this.STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
      }
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  public async clearAllNotifications(): Promise<void> {
    try {
      await axios.delete(`${this.apiUrl}/api/faculty/notifications`, {
        headers: this.getAuthHeader()
      });
      
      // Clear cached notifications
      localStorage.removeItem(this.STORAGE_KEYS.NOTIFICATIONS);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }
}

const facultyService = new FacultyService();
export default facultyService; 