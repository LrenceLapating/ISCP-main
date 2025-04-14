/**
 * AdminService.ts
 * 
 * Author: Marc Laurence Lapating
 * Date: April 1, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Service class that handles all admin-related API calls and data management.
 * This includes user management, course management, announcements, notifications,
 * and system settings for administrators.
 */

import axios from 'axios';

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
  adminId?: number;
  role?: string;
  accessLevel?: string;
}

// Course interface for admin operations
export interface Course {
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
  color?: string;
  rating?: number;
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

// Announcement interface for admin operations
export interface Announcement {
  id?: number;
  title: string;
  content: string;
  author_id?: number;
  target?: 'all' | 'students' | 'teachers' | 'admins';
  campus?: string;
  created_at?: string;
  updated_at?: string;
  author_name?: string;
  author_image?: string;
}

// Add Notification interface
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'announcement' | 'grade' | 'assignment' | 'course' | 'message' | 'system';
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

// Academic archive interface
export interface AcademicArchive {
  id: number;
  year: string;
  semesters: number;
  courses: number;
  students: number;
  status: 'Current' | 'Archived';
  created_at?: string;
  updated_at?: string;
}

// Legacy archive interface
export interface LegacyArchive {
  id: number;
  name: string;
  size: string;
  format: string;
  date: string;
  file_url?: string;
  uploaded_by?: number;
}

class AdminService {
  private apiUrl: string;
  private readonly STORAGE_KEYS = {
    SETTINGS: 'admin_settings',
    PROFILE: 'admin_profile',
    NOTIFICATIONS: 'admin_notifications',
    USERS: 'admin_users',
    ARCHIVES: 'admin_archives'
  };

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  // Helper method to get the authorization header
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Ensure auth headers are set
  private ensureAuthHeaders() {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }

  // Dashboard statistics methods

  async getDashboardStats(): Promise<any> {
    try {
      // Try to fetch stats from API first
      if (localStorage.getItem('token')) {
        try {
          const response = await axios.get(`${this.apiUrl}/api/admin/dashboard/stats`, {
            headers: this.getAuthHeader()
          });
          
          if (response.data) {
            console.log('Retrieved dashboard stats from API:', response.data);
            return response.data;
          }
        } catch (apiError: any) {
          console.log('API error fetching dashboard stats:', apiError.message);
          if (apiError.code === 'ERR_NETWORK') {
            console.log('Network error - backend may not be running');
          }
        }
      }
      
      // If API call fails, generate stats from other API calls
      try {
        // Get users
        const users = await this.getUsers();
        
        // Get courses
        const courses = await this.getApprovedCourses();
        
        // Get announcements
        const announcements = await this.getAnnouncements();
        
        // Get notifications
        const notifications = await this.getNotifications();
        
        // Get pending course requests
        const pendingCourses = await this.getPendingCourseRequests();
        
        // Calculate stats
        const stats = {
          activeUsers: users.filter(user => user.status === 'active').length,
          activeCourses: courses.filter(course => course.status === 'active').length,
          totalAnnouncements: announcements.length,
          pendingRequests: pendingCourses.length,
          unreadNotifications: notifications.filter(notification => !notification.is_read).length,
          usersByRole: {
            students: users.filter(user => user.role === 'student').length,
            teachers: users.filter(user => user.role === 'teacher').length,
            admins: users.filter(user => user.role === 'admin').length,
          },
          coursesByDepartment: this.groupBy(courses, 'department'),
          coursesByStatus: {
            active: courses.filter(course => course.status === 'active').length,
            inactive: courses.filter(course => course.status === 'inactive').length,
          },
          storageUsed: '28.4 GB', // Mock data
          serverLoad: '32%', // Mock data
          averageResponseTime: '86ms', // Mock data
          recentUsers: users.sort((a, b) => 
            new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          ).slice(0, 5),
          recentCourses: courses.sort((a, b) => 
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          ).slice(0, 5),
        };
        
        return stats;
      } catch (error) {
        console.error('Error calculating dashboard stats:', error);
        
        // Return mock data as fallback
        return {
          activeUsers: 245,
          activeCourses: 68,
          totalAnnouncements: 17,
          pendingRequests: 5,
          unreadNotifications: 8,
          usersByRole: {
            students: 195,
            teachers: 45,
            admins: 5,
          },
          coursesByDepartment: {
            'Computer Science': 20,
            'Engineering': 15,
            'Business': 18,
            'Liberal Arts': 15,
          },
          coursesByStatus: {
            active: 68,
            inactive: 12,
          },
          storageUsed: '28.4 GB',
          serverLoad: '32%',
          averageResponseTime: '86ms',
          recentUsers: [],
          recentCourses: [],
        };
      }
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      
      // Return mock data as fallback
      return {
        activeUsers: 245,
        activeCourses: 68,
        totalAnnouncements: 17,
        pendingRequests: 5,
        unreadNotifications: 8,
        usersByRole: {
          students: 195,
          teachers: 45,
          admins: 5,
        },
        coursesByDepartment: {
          'Computer Science': 20,
          'Engineering': 15,
          'Business': 18,
          'Liberal Arts': 15,
        },
        coursesByStatus: {
          active: 68,
          inactive: 12,
        },
        storageUsed: '28.4 GB',
        serverLoad: '32%',
        averageResponseTime: '86ms',
        recentUsers: [],
        recentCourses: [],
      };
    }
  }
  
  // Helper method to group items by a property
  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((result, item) => {
      const keyValue = item[key] || 'Other';
      result[keyValue] = (result[keyValue] || 0) + 1;
      return result;
    }, {});
  }

  // Admin Profile and Settings Methods
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      // Always try the API first if we have token
      if (localStorage.getItem('token')) {
        try {
          const response = await axios.get(`${this.apiUrl}/api/user/settings`, {
            headers: this.getAuthHeader()
          });
          
          if (response.data) {
            console.log('Retrieved admin settings from API:', response.data);
            
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
              adminId: response.data.admin_id || response.data.adminId || response.data.student_id,
              role: response.data.role || 'System Administrator',
              accessLevel: response.data.accessLevel || 'Full Access'
            };
            
            // Cache in localStorage
            localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(settings));
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
      const profileJson = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
      if (profileJson) {
        const parsedProfile = JSON.parse(profileJson);
        console.log('Retrieved admin settings from localStorage:', parsedProfile);
        
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
            campus: parsedProfile.campus || user.campus || 'All Campuses',
            adminId: parsedProfile.adminId || parseInt(user.id || '0', 10),
            profilePicture: parsedProfile.profilePicture || user.profileImage || '',
            role: parsedProfile.role || 'System Administrator',
            accessLevel: parsedProfile.accessLevel || 'Full Access'
          };
          
          // If we made changes, save them back to localStorage
          if (JSON.stringify(updatedProfile) !== profileJson) {
            localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
            console.log('Updated admin profile with user details:', updatedProfile);
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
          adminId: parseInt(user.id || '0', 10),
          campus: user.campus || 'All Campuses',
          role: 'System Administrator',
          accessLevel: 'Full Access'
        };
        
        // Save default settings to localStorage
        localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(defaultSettings));
        console.log('Created and saved default admin settings:', defaultSettings);
        
        // Try to save to API in background
        this.updateUserSettings(defaultSettings)
          .catch(error => {
            console.log('Failed to save default admin settings to API:', error);
          });
        
        return defaultSettings;
      }
      
      return null;
    } catch (error) {
      console.error('Error in admin getUserSettings:', error);
      return null;
    }
  }

  async updateUserSettings(settings: UserSettings): Promise<boolean> {
    try {
      // First update localStorage
      localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(settings));
      
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
        role: settings.role,
        accessLevel: settings.accessLevel
      };
      
      // Then try to update API
      if (localStorage.getItem('token')) {
        try {
          const response = await axios.put(`${this.apiUrl}/api/user/settings`, serverData, {
            headers: this.getAuthHeader()
          });
          
          if (response.data) {
            console.log('Updated admin settings on server:', response.data);
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
      console.error('Error updating admin settings:', error);
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
          const profileJson = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
          if (profileJson) {
            const profile = JSON.parse(profileJson);
            profile.profilePicture = response.data.profilePicture;
            localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(profile));
            
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
          const profileJson = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
          if (profileJson) {
            try {
              const profile = JSON.parse(profileJson);
              profile.profilePicture = dataUrl;
              localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(profile));
              
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
  
  /**
   * Fetch all approved courses
   */
  async getApprovedCourses(): Promise<Course[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/courses/approved`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching approved courses:', error);
      
      // For development, return empty array rather than failing
      return [];
    }
  }
  
  /**
   * Fetch all pending course requests
   */
  async getPendingCourseRequests(): Promise<Course[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/courses/pending`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching pending course requests:', error);
      return [];
    }
  }
  
  /**
   * Update the status of a course request
   */
  async updateCourseRequestStatus(
    courseId: number, 
    status: 'approved' | 'rejected', 
    notes?: string
  ): Promise<Course> {
    try {
      this.ensureAuthHeaders();
      console.log(`Updating course ${courseId} with status ${status} and notes: ${notes || 'none'}`);
      
      // Use parameter names that match the backend expectations
      const response = await axios.patch(`${this.apiUrl}/api/admin/courses/${courseId}/status`, {
        request_status: status,
        request_notes: notes
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating course request status:', error);
      throw error;
    }
  }
  
  /**
   * Create a new course
   */
  async createCourse(course: Course): Promise<Course> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.post(`${this.apiUrl}/api/admin/courses`, course);
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating course:', error);
      
      // Provide more specific error messages based on the response
      if (error.response) {
        if (error.response.status === 409) {
          throw new Error('Course code already exists. Please choose a different code.');
        } else if (error.response.status === 404 && error.response.data?.message?.includes('Instructor')) {
          throw new Error('Instructor not found. Please select a valid instructor.');
        } else if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      throw new Error('Failed to create course. Check console for details.');
    }
  }
  
  /**
   * Update an existing course
   */
  async updateCourse(course: Course): Promise<Course> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.put(`${this.apiUrl}/api/admin/courses/${course.id}`, course);
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating course:', error);
      
      // Provide more specific error messages based on the response
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Course not found. It may have been deleted by another administrator.');
        } else if (error.response.status === 409) {
          throw new Error('Course code already exists. Please choose a different code.');
        } else if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      throw new Error('Failed to update course. Check console for details.');
    }
  }
  
  /**
   * Delete a course by ID
   */
  async deleteCourse(courseId: number): Promise<void> {
    try {
      this.ensureAuthHeaders();
      await axios.delete(`${this.apiUrl}/api/admin/courses/${courseId}`);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      
      // Provide more specific error messages based on the response
      if (error.response) {
        if (error.response.status === 404) {
          throw new Error('Course not found or already deleted');
        } else if (error.response.data && error.response.data.message) {
          throw new Error(error.response.data.message);
        }
      }
      
      // Default error message
      throw new Error('Failed to delete course. Check console for details.');
    }
  }
  
  /**
   * Update a course's status (active/inactive)
   */
  async updateCourseStatus(courseId: number, status: 'active' | 'inactive'): Promise<Course> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.patch(`${this.apiUrl}/api/admin/courses/${courseId}/status`, {
        request_status: status
      });
      
      return response.data;
    } catch (error) {
      console.error('Error updating course status:', error);
      throw error;
    }
  }

  // User Management Methods
  
  /**
   * Fetch all users
   */
  async getUsers(): Promise<any[]> {
    try {
      this.ensureAuthHeaders();
      // Use the admin users endpoint
      const response = await axios.get(`${this.apiUrl}/api/admin/users`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map(user => ({
          id: user.id,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          role: user.role || 'student',
          campus: user.campus || 'Main Campus',
          status: user.status || 'active', // Default to active if no status returned
          profileImage: user.profileImage
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  
  /**
   * Toggle a user's status (active/inactive)
   */
  async toggleUserStatus(userId: number, status: 'active' | 'inactive'): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      await axios.patch(`${this.apiUrl}/api/admin/users/${userId}/status`, { status });
      return true;
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }
  
  /**
   * Delete a user by ID
   */
  async deleteUser(userId: number): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      await axios.delete(`${this.apiUrl}/api/admin/users/${userId}`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
  
  /**
   * Update a user
   */
  async updateUser(user: {
    id: number;
    name: string;
    email: string;
    role: string;
    campus: string;
    status: string;
  }): Promise<any> {
    try {
      this.ensureAuthHeaders();
      console.log('Updating user with data:', user);
      
      const response = await axios.put(`${this.apiUrl}/api/admin/users/${user.id}`, {
        fullName: user.name,
        email: user.email,
        role: user.role,
        campus: user.campus,
        status: user.status
      });
      
      console.log('User update response:', response.data);
      
      if (response.data.user) {
        return response.data.user;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Announcement Management Methods
  
  /**
   * Get all announcements
   */
  async getAnnouncements(): Promise<Announcement[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/announcements`);
      
      console.log('Raw announcement data from backend:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        // Ensure that target field is properly set for each announcement
        return response.data.map((item: any) => {
          return {
            ...item,
            target: item.target || 'all'
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id: number): Promise<Announcement | null> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/announcements/${id}`);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching announcement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new announcement
   */
  async createAnnouncement(announcement: Announcement): Promise<Announcement> {
    try {
      this.ensureAuthHeaders();
      console.log('Creating announcement with API data:', announcement);
      console.log('Target type:', typeof announcement.target);
      
      const response = await axios.post(`${this.apiUrl}/api/admin/announcements`, announcement);
      console.log('Server response for createAnnouncement:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(id: number, announcement: Partial<Announcement>): Promise<Announcement> {
    try {
      this.ensureAuthHeaders();
      console.log('Updating announcement with API data:', announcement);
      console.log('Target value:', announcement.target);
      console.log('Target type:', typeof announcement.target);
      
      const response = await axios.put(`${this.apiUrl}/api/admin/announcements/${id}`, announcement);
      console.log('Server response for updateAnnouncement:', response.data);
      
      return response.data;
    } catch (error) {
      console.error(`Error updating announcement ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id: number): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      await axios.delete(`${this.apiUrl}/api/admin/announcements/${id}`);
      
      return true;
    } catch (error) {
      console.error(`Error deleting announcement ${id}:`, error);
      throw error;
    }
  }

  // Notification Management Methods
  
  /**
   * Get admin notifications
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/notifications`);
      
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
  
  /**
   * Get unread notification count
   */
  async getUnreadNotificationCount(): Promise<number> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/notifications/count`);
      
      if (response.data && typeof response.data.count === 'number') {
        return response.data.count;
      }
      
      return 0;
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      return 0;
    }
  }
  
  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      await axios.patch(`${this.apiUrl}/api/admin/notifications/${id}`);
      
      // Update local cache
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
  
  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      await axios.patch(`${this.apiUrl}/api/admin/notifications`);
      
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
  
  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      this.ensureAuthHeaders();
      await axios.delete(`${this.apiUrl}/api/admin/notifications`);
      
      // Clear cached notifications
      localStorage.removeItem(this.STORAGE_KEYS.NOTIFICATIONS);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }

  /**
   * Fetch academic year archives
   */
  async getAcademicArchives(): Promise<AcademicArchive[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/archives/academic`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // Fallback to mock data if API fails or returns invalid data
      return [
        { id: 1, year: '2023-2024', semesters: 2, courses: 156, students: 4567, status: 'Current' },
        { id: 2, year: '2022-2023', semesters: 2, courses: 145, students: 4350, status: 'Archived' },
        { id: 3, year: '2021-2022', semesters: 2, courses: 138, students: 4125, status: 'Archived' },
        { id: 4, year: '2020-2021', semesters: 2, courses: 130, students: 3980, status: 'Archived' },
        { id: 5, year: '2019-2020', semesters: 2, courses: 125, students: 3750, status: 'Archived' }
      ];
    } catch (error) {
      console.error('Error fetching academic archives:', error);
      
      // Return mock data as fallback
      return [
        { id: 1, year: '2023-2024', semesters: 2, courses: 156, students: 4567, status: 'Current' },
        { id: 2, year: '2022-2023', semesters: 2, courses: 145, students: 4350, status: 'Archived' },
        { id: 3, year: '2021-2022', semesters: 2, courses: 138, students: 4125, status: 'Archived' },
        { id: 4, year: '2020-2021', semesters: 2, courses: 130, students: 3980, status: 'Archived' },
        { id: 5, year: '2019-2020', semesters: 2, courses: 125, students: 3750, status: 'Archived' }
      ];
    }
  }

  /**
   * Fetch legacy data archives
   */
  async getLegacyArchives(): Promise<LegacyArchive[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/archives/legacy`);
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      // Fallback to mock data if API fails
      return [
        { id: 1, name: 'Pre-Digital Records (2010-2015)', size: '15.3 GB', format: 'PDF Scans', date: '2015-07-15' },
        { id: 2, name: 'ISCP Legacy System Export', size: '8.7 GB', format: 'SQL + Documents', date: '2018-01-20' },
        { id: 3, name: 'Historic Transcripts Archive', size: '4.2 GB', format: 'PDF + CSV', date: '2017-12-05' },
        { id: 4, name: 'Alumni Database (2000-2018)', size: '3.5 GB', format: 'SQL Backup', date: '2019-03-10' }
      ];
    } catch (error) {
      console.error('Error fetching legacy archives:', error);
      
      // Return mock data as fallback
      return [
        { id: 1, name: 'Pre-Digital Records (2010-2015)', size: '15.3 GB', format: 'PDF Scans', date: '2015-07-15' },
        { id: 2, name: 'ISCP Legacy System Export', size: '8.7 GB', format: 'SQL + Documents', date: '2018-01-20' },
        { id: 3, name: 'Historic Transcripts Archive', size: '4.2 GB', format: 'PDF + CSV', date: '2017-12-05' },
        { id: 4, name: 'Alumni Database (2000-2018)', size: '3.5 GB', format: 'SQL Backup', date: '2019-03-10' }
      ];
    }
  }

  /**
   * View academic year details
   */
  async getAcademicArchiveDetails(archiveId: number): Promise<any> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/admin/archives/academic/${archiveId}`);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching academic archive details for ID ${archiveId}:`, error);
      
      // Return mock data as fallback based on ID
      return {
        id: archiveId,
        year: `202${archiveId}-202${archiveId+1}`,
        semesters: 2,
        courses: 130 + (archiveId * 5),
        students: 3750 + (archiveId * 200),
        status: archiveId === 1 ? 'Current' : 'Archived',
        departments: [
          { name: 'Computer Science', courses: 35 + archiveId, students: 450 + (archiveId * 20) },
          { name: 'Engineering', courses: 30 + archiveId, students: 380 + (archiveId * 15) },
          { name: 'Business', courses: 28 + archiveId, students: 350 + (archiveId * 12) },
          { name: 'Liberal Arts', courses: 25 + archiveId, students: 320 + (archiveId * 10) }
        ],
        campus_data: [
          { name: 'Main Campus', courses: 80 + archiveId, students: 2200 + (archiveId * 100) },
          { name: 'North Branch', courses: 50 + archiveId, students: 1550 + (archiveId * 100) }
        ],
        graduation_rate: 92.5 - (archiveId * 0.5)
      };
    }
  }

  /**
   * Download an archive
   */
  async downloadArchive(archiveId: number, type: 'academic' | 'legacy'): Promise<string> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(
        `${this.apiUrl}/api/admin/archives/${type}/${archiveId}/download`,
        { responseType: 'blob' }
      );
      
      // Create blob URL for download
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Trigger file download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `archive-${type}-${archiveId}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return 'Download successful';
    } catch (error) {
      console.error(`Error downloading ${type} archive ${archiveId}:`, error);
      throw new Error(`Failed to download archive: ${error}`);
    }
  }

  /**
   * Upload a legacy archive
   */
  async uploadLegacyArchive(data: {
    name: string;
    format: string;
    file: File;
  }): Promise<LegacyArchive> {
    try {
      this.ensureAuthHeaders();
      
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('format', data.format);
      formData.append('file', data.file);
      
      const response = await axios.post(
        `${this.apiUrl}/api/admin/archives/legacy/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...this.getAuthHeader()
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error uploading legacy archive:', error);
      
      // Return a mock response for UI demonstration
      return {
        id: Math.floor(Math.random() * 1000),
        name: data.name,
        size: `${(data.file.size / (1024 * 1024)).toFixed(1)} MB`,
        format: data.format,
        date: new Date().toISOString().split('T')[0]
      };
    }
  }

  /**
   * Create academic year archive
   */
  async createAcademicArchive(year: string): Promise<AcademicArchive> {
    try {
      this.ensureAuthHeaders();
      
      const response = await axios.post(`${this.apiUrl}/api/admin/archives/academic`, { year });
      return response.data;
    } catch (error) {
      console.error('Error creating academic archive:', error);
      
      // Return a mock response
      return {
        id: Math.floor(Math.random() * 1000),
        year,
        semesters: 2,
        courses: 120,
        students: 3500,
        status: 'Current'
      };
    }
  }
}

const adminService = new AdminService();
export default adminService; 