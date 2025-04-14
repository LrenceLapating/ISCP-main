/**
 * StudentService.ts
 * 
 * Author: Marc Laurence Lapating
 * Date: April 1, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Service class that handles all student-related API calls and data management.
 * This includes course enrollment, assignment submission, grade viewing,
 * and offline mode capabilities.
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import messageService from './MessageService';

// Types
export interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  instructor: string;
  schedule: string;
  campus: string;
  credits: number;
  category: string;
  image: string;
  rating: number;
  enrolled: boolean;
  progress: number;
  color: string;
}

export interface Assignment {
  id: number;
  title: string;
  courseId: number;
  courseName: string;
  courseCode: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'late';
  description: string;
  instructions: string;
  maxPoints: number;
  score?: number;
  feedback?: string;
  submissionFile?: string;
  submissionDate?: string;
  submissionText?: string;
  submissionId?: number;
  instructorName: string;
  attachmentUrl?: string;
  attachmentType?: string;
}

export interface ClassSession {
  id: number;
  courseId: number;
  courseName: string;
  courseCode: string;
  date: string;
  time: string;
  location: string;
  instructor: string;
  type: 'lecture' | 'lab' | 'seminar' | 'exam';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  meetingLink?: string;
  attended?: boolean;
  materials?: string[];
  color: string;
}

export interface Grade {
  id: number;
  course: {
    id: number;
    code: string;
    title: string;
    credits: number;
    color: string;
  };
  assignments: Array<{
    name: string;
    score: number | null;
    total: number;
    weight: number;
  }>;
  finalGrade: number | null;
  term: string;
}

export interface Message {
  id: number;
  sender: number;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Contact {
  id: number;
  name: string;
  avatar: string;
  role: string;
  course: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  date: string;
  author: string;
  campus: string;
  important: boolean;
  read: boolean;
}

export interface Material {
  id: number;
  title: string;
  description?: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'image' | 'link' | 'other';
  fileSize?: string;
  uploadDate: string;
  course: {
    id: number;
    code: string;
    title: string;
    color: string;
  };
  url: string;
  starred: boolean;
  downloadCount?: number;
  author?: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  phone: string;
  theme: string;
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  assignment_notifications: boolean;
  message_notifications: boolean;
  announcement_notifications: boolean;
  profile_visibility: boolean;
  show_online_status: boolean;
  show_last_seen: boolean;
  profile_picture: string;
  email: string;
  campus: string;
  student_id: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'announcement' | 'grade' | 'assignment' | 'course' | 'message' | 'system';
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

class StudentService {
  private readonly STORAGE_KEYS = {
    COURSES: 'iscp_courses',
    ENROLLED_COURSES: 'iscp_enrolled_courses',
    ASSIGNMENTS: 'iscp_assignments',
    SCHEDULE: 'iscp_schedule',
    GRADES: 'iscp_grades',
    CONTACTS: 'iscp_contacts',
    CONVERSATIONS: 'iscp_conversations',
    ANNOUNCEMENTS: 'iscp_announcements',
    PROFILE: 'iscp_profile',
    NOTIFICATIONS: 'iscp_notifications'
  };
  
  // Initialize storage with sample data if empty
  constructor() {
    this.initializeStorage();
  }
  
  private initializeStorage(): void {
    // Only initialize if storage is empty
    if (!localStorage.getItem(this.STORAGE_KEYS.COURSES)) {
      // Sample courses
      const courses: Course[] = [
        {
          id: 1,
          code: 'MDI-501',
          title: 'Multiversal Diplomacy',
          description: 'Learn the principles of interdimensional relations and negotiation tactics with diverse multiverse entities.',
          instructor: 'Dr. Stephen Strange',
          schedule: 'Mon, Wed 10:00-11:30 AM',
          campus: 'Main Campus',
          credits: 3,
          category: 'Interdimensional Studies',
          image: 'https://source.unsplash.com/random/800x600/?universe',
          rating: 4.8,
          enrolled: false,
          progress: 0,
          color: '#1976d2'
        },
        {
          id: 2,
          code: 'TTE-340',
          title: 'Time Travel Ethics',
          description: 'Explore the moral implications of temporal manipulation and paradox mitigation strategies.',
          instructor: 'Prof. Wanda Maximoff',
          schedule: 'Tue, Thu 1:00-2:30 PM',
          campus: 'Main Campus',
          credits: 4,
          category: 'Temporal Sciences',
          image: 'https://source.unsplash.com/random/800x600/?time',
          rating: 4.5,
          enrolled: false,
          progress: 0,
          color: '#e91e63'
        },
        {
          id: 3,
          code: 'ATP-220',
          title: 'Advanced Technology Principles',
          description: 'Study cutting-edge technological innovations and their applications across dimensions.',
          instructor: 'Tony Stark',
          schedule: 'Wed, Fri 3:00-4:30 PM',
          campus: 'Innovation Campus',
          credits: 4,
          category: 'Technology',
          image: 'https://source.unsplash.com/random/800x600/?technology',
          rating: 4.9,
          enrolled: false,
          progress: 0,
          color: '#9c27b0'
        },
      ];
      
      // Sample assignments
      const assignments: Assignment[] = [
        {
          id: 1,
          title: 'Multiverse Essay',
          courseId: 1,
          courseName: 'Multiversal Diplomacy',
          courseCode: 'MDI-501',
          dueDate: '2023-06-15',
          status: 'pending',
          description: 'Write a 5-page essay on the diplomatic implications of Earth-616 relationships with three other dimensions.',
          maxPoints: 100,
          instructions: 'Format your essay in APA style with proper citations.',
          instructorName: 'Dr. Stephen Strange'
        },
        {
          id: 2,
          title: 'Temporal Paradox Analysis',
          courseId: 2,
          courseName: 'Time Travel Ethics',
          courseCode: 'TTE-340',
          dueDate: '2023-06-10',
          status: 'submitted',
          description: 'Analyze the ethical implications of the bootstrap paradox and provide mitigation strategies.',
          maxPoints: 100,
          submissionFile: 'paradox_analysis.pdf',
          submissionDate: '2023-06-08',
          instructions: 'Include at least three case studies from different timelines.',
          instructorName: 'Prof. Wanda Maximoff'
        },
        {
          id: 3,
          title: 'Technology Integration Project',
          courseId: 3,
          courseName: 'Advanced Technology Principles',
          courseCode: 'ATP-220',
          dueDate: '2023-06-20',
          status: 'pending',
          description: 'Design a prototype integrating interdimensional tech with Earth-based systems.',
          maxPoints: 100,
          instructions: 'Your prototype should address compatibility issues between different technological paradigms.',
          instructorName: 'Tony Stark'
        }
      ];
      
      // Sample schedule
      const schedule: ClassSession[] = [
        {
          id: 1,
          courseId: 1,
          courseName: 'Multiversal Diplomacy',
          courseCode: 'MDI-501',
          date: '2023-06-12',
          time: '10:00-11:30 AM',
          location: 'Room 302, Main Campus',
          instructor: 'Dr. Stephen Strange',
          type: 'lecture',
          status: 'upcoming',
          meetingLink: 'https://meeting.iscp.edu/dr-strange',
          color: '#1976d2'
        },
        {
          id: 2,
          courseId: 2,
          courseName: 'Time Travel Ethics',
          courseCode: 'TTE-340',
          date: '2023-06-13',
          time: '1:00-2:30 PM',
          location: 'Room 205, Main Campus',
          instructor: 'Prof. Wanda Maximoff',
          type: 'seminar',
          status: 'upcoming',
          meetingLink: 'https://meeting.iscp.edu/prof-maximoff',
          color: '#e91e63'
        },
        {
          id: 3,
          courseId: 3,
          courseName: 'Advanced Technology Principles',
          courseCode: 'ATP-220',
          date: '2023-06-14',
          time: '3:00-4:30 PM',
          location: 'Lab 101, Innovation Campus',
          instructor: 'Tony Stark',
          type: 'lab',
          status: 'upcoming',
          meetingLink: 'https://meeting.iscp.edu/tony-stark',
          color: '#9c27b0'
        }
      ];
      
      // Sample grades
      const grades: Grade[] = [
        {
          id: 1,
          course: {
            id: 1,
            code: 'MDI-501',
            title: 'Multiversal Diplomacy',
            credits: 3,
            color: '#1976d2'
          },
          assignments: [
            { name: 'Multiverse Essay', score: 85, total: 100, weight: 15 },
            { name: 'Midterm Exam', score: 78, total: 100, weight: 25 },
            { name: 'Case Study', score: 92, total: 100, weight: 20 },
            { name: 'Group Project', score: 88, total: 100, weight: 15 },
            { name: 'Final Exam', score: null, total: 100, weight: 25 }
          ],
          finalGrade: null,
          term: 'Spring 2023'
        },
        {
          id: 2,
          course: {
            id: 2,
            code: 'TTE-340',
            title: 'Time Travel Ethics',
            credits: 4,
            color: '#e91e63'
          },
          assignments: [
            { name: 'Paradox Quiz', score: 95, total: 100, weight: 10 },
            { name: 'Time Paradox Analysis', score: 82, total: 100, weight: 15 },
            { name: 'Midterm Paper', score: 88, total: 100, weight: 25 },
            { name: 'Ethics Presentation', score: 90, total: 100, weight: 20 },
            { name: 'Final Project', score: null, total: 100, weight: 30 }
          ],
          finalGrade: null,
          term: 'Spring 2023'
        }
      ];
      
      // Sample contacts
      const contacts: Contact[] = [
        {
          id: 1,
          name: 'Dr. Stephen Strange',
          avatar: '/avatars/strange.jpg',
          role: 'Professor',
          course: 'Multiversal Diplomacy',
          lastMessage: 'Please submit your essay by Friday.',
          timestamp: 'Today, 2:30 PM',
          unread: 2,
          online: true
        },
        {
          id: 2,
          name: 'Prof. Wanda Maximoff',
          avatar: '/avatars/wanda.jpg',
          role: 'Professor',
          course: 'Reality Manipulation',
          lastMessage: 'Great work on your last assignment!',
          timestamp: 'Yesterday',
          unread: 0,
          online: false
        },
        {
          id: 3,
          name: 'Tony Stark',
          avatar: '/avatars/tony.jpg',
          role: 'Teaching Assistant',
          course: 'Advanced Technology',
          lastMessage: 'Let me know if you need help with the project.',
          timestamp: 'May 2',
          unread: 0,
          online: true
        }
      ];
      
      // Sample conversations
      const conversations: Record<number, Message[]> = {
        1: [
          {
            id: 1,
            sender: 1,
            content: `Hello there! I hope you're doing well. I wanted to check in on your progress with the Multiverse Essay.`,
            timestamp: 'Yesterday, 11:45 AM',
            read: true
          },
          {
            id: 2,
            sender: 0, // current user
            content: `Hi Dr. Strange, I'm working on it now. I have a question about the scope of the essay.`,
            timestamp: 'Yesterday, 12:30 PM',
            read: true
          },
          {
            id: 3,
            sender: 1,
            content: `Of course. What's your question?`,
            timestamp: 'Yesterday, 1:15 PM',
            read: true
          },
          {
            id: 9,
            sender: 1,
            content: `Please submit your essay by Friday. I've extended the deadline by 24 hours to give everyone extra time to incorporate feedback from our last discussion.`,
            timestamp: 'Today, 2:30 PM',
            read: false
          }
        ],
        2: [
          {
            id: 1,
            sender: 2,
            content: `I've reviewed your reality bending simulation. Very impressive work!`,
            timestamp: 'Yesterday, 9:30 AM',
            read: true
          },
          {
            id: 2,
            sender: 0,
            content: 'Thank you, Professor Maximoff! I spent a lot of time on getting the hex fields correctly configured.',
            timestamp: 'Yesterday, 10:15 AM',
            read: true
          }
        ]
      };
      
      // Sample announcements
      const announcements: Announcement[] = [
        {
          id: 1,
          title: 'Summer Registration Now Open',
          content: 'Registration for summer courses is now open. Please register by June 30th to secure your spot.',
          date: '2023-06-01',
          author: 'Registrar Office',
          campus: 'All Campuses',
          important: true,
          read: false
        },
        {
          id: 2,
          title: 'Multiversal Diplomacy Guest Lecture',
          content: 'We are pleased to announce that Dr. Wong will be giving a guest lecture on interdimensional negotiation next Monday.',
          date: '2023-06-05',
          author: 'Dr. Stephen Strange',
          campus: 'Main Campus',
          important: false,
          read: true
        },
        {
          id: 3,
          title: 'System Maintenance',
          content: 'The portal will be unavailable on Sunday from 2AM to 5AM for scheduled maintenance.',
          date: '2023-06-08',
          author: 'IT Department',
          campus: 'All Campuses',
          important: true,
          read: true
        }
      ];
      
      // Initialize storage
      localStorage.setItem(this.STORAGE_KEYS.COURSES, JSON.stringify(courses));
      localStorage.setItem(this.STORAGE_KEYS.ENROLLED_COURSES, JSON.stringify([]));
      localStorage.setItem(this.STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
      localStorage.setItem(this.STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
      localStorage.setItem(this.STORAGE_KEYS.GRADES, JSON.stringify(grades));
      localStorage.setItem(this.STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
      localStorage.setItem(this.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    }
  }
  
  // Courses
  public getAvailableCourses(): Course[] {
    const courses = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.COURSES) || '[]');
    
    // Use the sync version to avoid Promise issues
    const enrolledCoursesIds = this.getEnrolledCoursesSync().map((c: Course) => c.id);
    
    return courses.map((course: Course) => ({
      ...course,
      enrolled: enrolledCoursesIds.includes(course.id)
    }));
  }
  
  /**
   * Get all courses that the student is enrolled in (synchronous version)
   * Used for internal operations that require immediate access
   */
  public getEnrolledCoursesSync(): Course[] {
    const storedCourses = localStorage.getItem(this.STORAGE_KEYS.ENROLLED_COURSES);
    if (storedCourses) {
      return JSON.parse(storedCourses);
    }
    return [];
  }
  
  /**
   * Get all courses that the student is enrolled in (async version)
   * This connects to the API and should be used by components
   */
  public async getEnrolledCourses(): Promise<Course[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/student/courses/enrolled`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      throw error;
    }
  }
  
  public withdrawFromCourse(courseId: number): boolean {
    const enrolledCourses = this.getEnrolledCoursesSync();
    const updatedCourses = enrolledCourses.filter((c: Course) => c.id !== courseId);
    
    if (updatedCourses.length === enrolledCourses.length) return false;
    
    localStorage.setItem(this.STORAGE_KEYS.ENROLLED_COURSES, JSON.stringify(updatedCourses));
    return true;
  }
  
  // Assignments
  public getAssignments(): Assignment[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ASSIGNMENTS) || '[]');
  }
  
  public getAssignmentById(id: number): Assignment | null {
    const assignments = this.getAssignments();
    return assignments.find(a => a.id === id) || null;
  }
  
  public submitAssignment(id: number, file: string): boolean {
    const assignments = this.getAssignments();
    const index = assignments.findIndex(a => a.id === id);
    
    if (index === -1) return false;
    
    assignments[index] = {
      ...assignments[index],
      status: 'submitted',
      submissionFile: file,
      submissionDate: new Date().toISOString().split('T')[0]
    };
    
    localStorage.setItem(this.STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    return true;
  }
  
  // New Assignment API Methods
  public async getAssignmentsFromAPI(): Promise<Assignment[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/student/assignments`);
      
      if (response.data) {
        // Map the API response to our Assignment interface
        return response.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          courseId: item.course_id,
          courseName: item.course_name,
          courseCode: item.course_code,
          instructorName: item.instructor_name,
          dueDate: item.due_date,
          status: item.status,
          description: item.description || '',
          instructions: item.instructions || '',
          maxPoints: item.points,
          score: item.grade,
          submissionId: item.submission_id,
          submissionDate: item.submitted_at,
          attachmentUrl: item.attachment_url,
          attachmentType: item.attachment_type
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching assignments from API:', error);
      // Fall back to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using mock assignment data');
        return this.getAssignments();
      }
      throw error;
    }
  }

  public async getCourseAssignments(courseId: number): Promise<Assignment[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/student/courses/${courseId}/assignments`, {
        headers: this.getAuthHeader()
      });
      
      // Map the API response to our Assignment interface
      const assignments = response.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        courseId: item.course_id,
        courseName: item.course_name,
        courseCode: item.course_code,
        dueDate: new Date(item.due_date).toISOString(),
        status: item.status,
        description: item.description || '',
        instructions: item.instructions || '',
        maxPoints: item.points,
        score: item.grade,
        feedback: item.feedback,
        submissionFile: item.file_url,
        submissionDate: item.submitted_at ? new Date(item.submitted_at).toISOString() : undefined,
        attachmentUrl: item.attachment_url,
        attachmentType: item.attachment_type
      }));
      
      return assignments;
    } catch (error) {
      console.error(`Error fetching assignments for course ${courseId}:`, error);
      // Fallback to local storage
      return this.getAssignments().filter(a => a.courseId === courseId);
    }
  }

  public async getAssignmentDetails(assignmentId: number): Promise<Assignment | null> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/student/assignments/${assignmentId}`, {
        headers: this.getAuthHeader()
      });
      
      const item = response.data;
      
      // Map the API response to our Assignment interface
      const assignment: Assignment = {
        id: item.id,
        title: item.title,
        courseId: item.course_id,
        courseName: item.course_name,
        courseCode: item.course_code,
        dueDate: new Date(item.due_date).toISOString(),
        status: item.status,
        description: item.description || '',
        instructions: item.instructions || '',
        maxPoints: item.points,
        score: item.submission ? item.submission.grade : undefined,
        feedback: item.submission ? item.submission.feedback : undefined,
        submissionFile: item.submission ? item.submission.file_url : undefined,
        submissionDate: item.submission && item.submission.submitted_at ? 
          new Date(item.submission.submitted_at).toISOString() : undefined,
        attachmentUrl: item.attachment_url,
        attachmentType: item.attachment_type,
        submissionText: item.submission ? item.submission.submission_text : undefined,
        submissionId: item.submission ? item.submission.id : undefined,
        instructorName: item.instructor_name
      };
      
      return assignment;
    } catch (error) {
      console.error(`Error fetching assignment details for assignment ${assignmentId}:`, error);
      // Fallback to local storage
      return this.getAssignmentById(assignmentId);
    }
  }

  public async submitAssignmentToAPI(
    assignmentId: number, 
    data: { 
      submissionText?: string; 
      fileUrl?: string; 
      fileType?: string;
    }
  ): Promise<any> {
    try {
      this.ensureAuthHeaders();
      
      const response = await axios.post(
        `${this.apiUrl}/api/student/assignments/${assignmentId}/submit`, 
        data
      );
      
      if (response.data) {
        return {
          success: true,
          message: response.data.message,
          submission: response.data.submission,
          assignment: response.data.assignment
        };
      }
      
      return {
        success: false,
        message: 'Failed to submit assignment'
      };
    } catch (error: any) {
      console.error('Error submitting assignment:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error submitting assignment'
      };
    }
  }

  public async uploadAssignmentFile(file: File): Promise<string> {
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
      
      return response.data.fileUrl;
    } catch (error) {
      console.error('Error uploading assignment file:', error);
      throw error;
    }
  }
  
  // Schedule
  public getSchedule(): ClassSession[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SCHEDULE) || '[]');
  }
  
  public markAttendance(sessionId: number, attended: boolean): boolean {
    const schedule = this.getSchedule();
    const sessionIndex = schedule.findIndex((s: ClassSession) => s.id === sessionId);
    
    if (sessionIndex === -1) return false;
    
    const updatedSchedule = [...schedule];
    updatedSchedule[sessionIndex] = {
      ...updatedSchedule[sessionIndex],
      attended
    };
    
    localStorage.setItem(this.STORAGE_KEYS.SCHEDULE, JSON.stringify(updatedSchedule));
    return true;
  }
  
  // Grades
  public getGrades(): Grade[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.GRADES) || '[]');
  }
  
  /**
   * Get grades from the API
   */
  public async getGradesFromAPI(): Promise<Grade[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/student/grades`, {
        headers: this.getAuthHeader()
      });
      
      if (response.data && Array.isArray(response.data)) {
        // Save to local storage for offline access
        localStorage.setItem(this.STORAGE_KEYS.GRADES, JSON.stringify(response.data));
        return response.data;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching grades:', error);
      // Fall back to cached data
      return this.getGrades();
    }
  }
  
  public calculateGPA(): number {
    const grades = this.getGrades();
    let totalPoints = 0;
    let totalCredits = 0;
    
    grades.forEach((grade: Grade) => {
      let courseGrade = 0;
      let totalWeight = 0;
      
      grade.assignments.forEach(assignment => {
        if (assignment.score !== null) {
          courseGrade += (assignment.score / assignment.total) * assignment.weight;
          totalWeight += assignment.weight;
        }
      });
      
      if (totalWeight > 0) {
        const percentageGrade = (courseGrade / totalWeight) * 100;
        const gpaPoints = this.percentageToGPA(percentageGrade);
        totalPoints += gpaPoints * grade.course.credits;
        totalCredits += grade.course.credits;
      }
    });
    
    return totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;
  }
  
  private percentageToGPA(percentage: number): number {
    if (percentage >= 93) return 4.0;
    if (percentage >= 90) return 3.7;
    if (percentage >= 87) return 3.3;
    if (percentage >= 83) return 3.0;
    if (percentage >= 80) return 2.7;
    if (percentage >= 77) return 2.3;
    if (percentage >= 73) return 2.0;
    if (percentage >= 70) return 1.7;
    if (percentage >= 67) return 1.3;
    if (percentage >= 63) return 1.0;
    if (percentage >= 60) return 0.7;
    return 0.0;
  }
  
  // Messages
  public async getContacts(): Promise<Contact[]> {
    try {
      this.ensureAuthHeaders();
      
      // Try to get contacts from API first
      const response = await axios.get(`${this.apiUrl}/api/user/conversations`);
      
      if (response.data && Array.isArray(response.data)) {
        // Process the API response to match our Contact interface
        const contacts: Contact[] = response.data.map((conv: any) => {
          const otherParticipant = conv.otherParticipant || {};
          
          return {
            id: conv.id,
            name: otherParticipant.fullName || conv.title || 'Unknown',
            avatar: otherParticipant.profileImage || '',
            role: otherParticipant.role || 'student',
            course: 'General',
            lastMessage: conv.lastMessage?.content || 'No messages yet',
            timestamp: conv.lastMessage?.created_at 
              ? new Date(conv.lastMessage.created_at).toLocaleString() 
              : 'Never',
            unread: conv.unreadCount || 0,
            online: otherParticipant.status === 'online'
          };
        });
        
        // Cache the contacts
        localStorage.setItem(this.STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
        return contacts;
      }
      
      // Fallback to local storage
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONTACTS) || '[]');
    } catch (error) {
      console.error('Error fetching contacts:', error);
      // Fallback to local storage
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONTACTS) || '[]');
    }
  }

  // Synchronous version for quick dashboard load
  public getContactsSync(): Contact[] {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONTACTS) || '[]');
  }

  // Get unread message count
  public async getUnreadMessageCount(): Promise<number> {
    try {
      // Use the MessageService for a more accurate count
      return await messageService.getUnreadCount();
    } catch (error) {
      console.error('Error getting unread message count:', error);
      
      // Fallback to local calculation
      const contacts = await this.getContacts();
      return contacts.reduce((total, contact) => total + contact.unread, 0);
    }
  }
  
  public getConversation(contactId: number): Message[] {
    const conversations = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS) || '{}');
    return conversations[contactId] || [];
  }
  
  public async sendMessage(contactId: number, content: string): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      
      // Try to send message via API
      const response = await axios.post(
        `${this.apiUrl}/api/conversations/${contactId}/messages`,
        { content }
      );
      
      if (response.status === 201) {
        // Update contacts cache with new message
        const contacts = await this.getContacts();
        
        // Update local storage for offline access
        const conversations = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS) || '{}');
        const contactConversation = conversations[contactId] || [];
        
        const newMessage: Message = {
          id: Date.now(),
          sender: 0, // current user
          content,
          timestamp: new Date().toLocaleString(),
          read: true
        };
        
        const updatedConversation = [...contactConversation, newMessage];
        const updatedConversations = {
          ...conversations,
          [contactId]: updatedConversation
        };
        
        localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updatedConversations));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to local storage only
      const conversations = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS) || '{}');
      const contactConversation = conversations[contactId] || [];
      
      const newMessage: Message = {
        id: Date.now(),
        sender: 0, // current user
        content,
        timestamp: new Date().toLocaleString(),
        read: true
      };
      
      const updatedConversation = [...contactConversation, newMessage];
      const updatedConversations = {
        ...conversations,
        [contactId]: updatedConversation
      };
      
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updatedConversations));
      
      // Update contact's last message in local storage
      const contacts = this.getContactsSync();
      const contactIndex = contacts.findIndex((c: Contact) => c.id === contactId);
      
      if (contactIndex !== -1) {
        const updatedContacts = [...contacts];
        updatedContacts[contactIndex] = {
          ...updatedContacts[contactIndex],
          lastMessage: content,
          timestamp: 'Just now'
        };
        
        localStorage.setItem(this.STORAGE_KEYS.CONTACTS, JSON.stringify(updatedContacts));
      }
      
      return true;
    }
  }
  
  public async markMessageAsRead(contactId: number, messageId: number): Promise<boolean> {
    try {
      this.ensureAuthHeaders();
      
      // Try to mark message as read via API
      const response = await axios.post(
        `${this.apiUrl}/api/conversations/${contactId}/read`,
        { messageId }
      );
      
      if (response.status === 200) {
        // Update local cache for offline access
        const contacts = this.getContactsSync();
        const contactIndex = contacts.findIndex((c: Contact) => c.id === contactId);
        
        if (contactIndex !== -1) {
          const updatedContacts = [...contacts];
          updatedContacts[contactIndex] = {
            ...updatedContacts[contactIndex],
            unread: 0
          };
          
          localStorage.setItem(this.STORAGE_KEYS.CONTACTS, JSON.stringify(updatedContacts));
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error marking message as read:', error);
      
      // Fallback to local storage
      const conversations = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.CONVERSATIONS) || '{}');
      const contactConversation = conversations[contactId] || [];
      
      const messageIndex = contactConversation.findIndex((m: Message) => m.id === messageId);
      if (messageIndex === -1) return false;
      
      const updatedConversation = [...contactConversation];
      updatedConversation[messageIndex] = {
        ...updatedConversation[messageIndex],
        read: true
      };
      
      const updatedConversations = {
        ...conversations,
        [contactId]: updatedConversation
      };
      
      localStorage.setItem(this.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(updatedConversations));
      
      // Update unread count in contacts
      const contacts = this.getContactsSync();
      const contactIndex = contacts.findIndex((c: Contact) => c.id === contactId);
      
      if (contactIndex !== -1) {
        const unreadCount = updatedConversation.filter(m => !m.read && m.sender !== 0).length;
        const updatedContacts = [...contacts];
        updatedContacts[contactIndex] = {
          ...updatedContacts[contactIndex],
          unread: unreadCount
        };
        
        localStorage.setItem(this.STORAGE_KEYS.CONTACTS, JSON.stringify(updatedContacts));
      }
      
      return true;
    }
  }
  
  // Announcements
  public async getAnnouncements(): Promise<Announcement[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/student/announcements`);
      
      if (response.data && Array.isArray(response.data)) {
        // Map backend response to our Announcement interface
        return response.data.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          date: a.created_at || new Date().toISOString(),
          author: a.author_name || 'Administrator',
          campus: a.campus || 'All Campuses',
          important: a.target === 'all' || a.target === 'students',
          read: false // Default to unread
        }));
      }
      
      // Fallback to local storage if API call fails
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
    } catch (error) {
      console.error('Error fetching announcements from API:', error);
      // Fallback to local storage if API call fails
      return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
    }
  }
  
  public async markAnnouncementAsRead(id: number): Promise<boolean> {
    try {
      // Get announcements from local storage for now
      // In the future, this could be updated to call an API endpoint
      const announcements = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ANNOUNCEMENTS) || '[]');
      const announcementIndex = announcements.findIndex((a: Announcement) => a.id === id);
      
      if (announcementIndex === -1) return false;
      
      const updatedAnnouncements = [...announcements];
      updatedAnnouncements[announcementIndex] = {
        ...updatedAnnouncements[announcementIndex],
        read: true
      };
      
      localStorage.setItem(this.STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(updatedAnnouncements));
      return true;
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      return false;
    }
  }
  
  // Profile
  public getProfile(): any {
    return JSON.parse(localStorage.getItem(this.STORAGE_KEYS.PROFILE) || '{}');
  }
  
  public updateProfile(profile: any): boolean {
    localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    return true;
  }

  // Helper method to ensure authorization headers are set
  private ensureAuthHeaders() {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
  
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
  private apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Get user settings from API
  public async getUserSettings(): Promise<UserSettings> {
    try {
      // Always try the API first if we have token
      this.ensureAuthHeaders();
      if (localStorage.getItem('token')) {
        try {
          const response = await axios.get(`${this.apiUrl}/api/user/settings`, {
            headers: this.getAuthHeader()
          });
          
          if (response.data) {
            console.log('Retrieved user settings from API:', response.data);
            
            // Transform to match our interface
            const settings: UserSettings = {
              ...response.data,
              user_id: response.data.user_id || response.data.userId,
              first_name: response.data.first_name || response.data.firstName,
              last_name: response.data.last_name || response.data.lastName,
              profile_picture: response.data.profile_picture || response.data.profilePicture,
              email_notifications: response.data.email_notifications || response.data.emailNotifications,
              push_notifications: response.data.push_notifications || response.data.pushNotifications,
              assignment_notifications: response.data.assignment_notifications || response.data.assignmentNotifications,
              message_notifications: response.data.message_notifications || response.data.messageNotifications,
              announcement_notifications: response.data.announcement_notifications || response.data.announcementNotifications,
              profile_visibility: response.data.profile_visibility || response.data.profileVisibility,
              show_online_status: response.data.show_online_status || response.data.showOnlineStatus,
              show_last_seen: response.data.show_last_seen || response.data.showLastSeen,
              student_id: response.data.student_id || response.data.studentId
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
      const localProfile = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
      if (localProfile) {
        const parsedProfile = JSON.parse(localProfile);
        console.log('Retrieved user settings from localStorage:', parsedProfile);
        
        // Now if we have a user object, make sure profile data matches user details
        const userJson = localStorage.getItem('user');
        if (userJson) {
          const user = JSON.parse(userJson);
          const nameParts = user.fullName ? user.fullName.split(' ') : ['', ''];
          
          // Update any missing essential fields
          const updatedProfile = {
            ...parsedProfile,
            user_id: parsedProfile.user_id || parseInt(user.id || '0', 10),
            first_name: parsedProfile.first_name || nameParts[0] || '',
            last_name: parsedProfile.last_name || nameParts.slice(1).join(' ') || '',
            email: parsedProfile.email || user.email || '',
            campus: parsedProfile.campus || user.campus || '',
            student_id: parsedProfile.student_id || parseInt(user.id || '0', 10),
            profile_picture: parsedProfile.profile_picture || user.profileImage || ''
          };
          
          // If we made changes, save them back to localStorage
          if (JSON.stringify(updatedProfile) !== localProfile) {
            localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
            console.log('Updated profile with user details:', updatedProfile);
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
          user_id: parseInt(user.id || '0', 10),
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          email: user.email || '',
          phone: '',
          student_id: parseInt(user.id || '0', 10),
          campus: user.campus || '',
          profile_picture: user.profileImage || '',
          theme: 'dark',
          language: 'English',
          email_notifications: true,
          push_notifications: true,
          assignment_notifications: true,
          message_notifications: true,
          announcement_notifications: true,
          profile_visibility: true,
          show_online_status: true,
          show_last_seen: true
        };
        
        // Save default settings to localStorage
        localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(defaultSettings));
        console.log('Created and saved default settings:', defaultSettings);
        
        // Try to save to API in background
        this.updateUserSettings(defaultSettings)
          .catch(error => {
            console.log('Failed to save default settings to API:', error.message);
          });
        
        return defaultSettings;
      }
      
      throw new Error('No user data found');
    } catch (error: any) {
      console.error('Error in getUserSettings:', error);
      throw error;
    }
  }

  // Update user settings
  public async updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
    try {
      // First update localStorage
      const existingData = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
      const currentSettings = existingData ? JSON.parse(existingData) : {};
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(updatedSettings));
      
      // Notify components that user data has been updated
      window.dispatchEvent(new Event('user-updated'));

      // Format data for the server
      const serverData = {
        firstName: settings.first_name,
        lastName: settings.last_name,
        phone: settings.phone,
        theme: settings.theme,
        language: settings.language,
        emailNotifications: settings.email_notifications,
        pushNotifications: settings.push_notifications,
        assignmentNotifications: settings.assignment_notifications,
        messageNotifications: settings.message_notifications,
        announcementNotifications: settings.announcement_notifications,
        profileVisibility: settings.profile_visibility,
        showOnlineStatus: settings.show_online_status,
        showLastSeen: settings.show_last_seen
      };

      // Then try to update API
      this.ensureAuthHeaders();
      try {
        const response = await axios.put(`${this.apiUrl}/api/user/settings`, serverData, {
          headers: this.getAuthHeader()
        });
        
        if (response.data) {
          console.log('Updated user settings on server:', response.data);
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
      }
    } catch (error: any) {
      console.error('Error in updateUserSettings:', error);
      throw error;
    }
  }

  // Upload profile picture
  public async uploadProfilePicture(file: File): Promise<string> {
    try {
      this.ensureAuthHeaders();
      
      // Try to upload to API first
      try {
        const formData = new FormData();
        formData.append('profilePicture', file);
        
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
            profile.profile_picture = response.data.profilePicture;
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
              profile.profile_picture = dataUrl;
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
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  }

  // Change password
  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      this.ensureAuthHeaders();
      
      try {
        await axios.put(
          `${this.apiUrl}/api/user/password`,
          { currentPassword, newPassword },
          { headers: this.getAuthHeader() }
        );
        
        console.log('Password changed successfully');
      } catch (apiError: any) {
        console.error('Error changing password:', apiError);
        throw new Error(apiError.response?.data?.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async getApprovedCourses(): Promise<Course[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/student/courses/approved`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching approved courses:', error);
      throw error;
    }
  }

  async enrollInCourse(courseId: number): Promise<any> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/student/courses/enroll`,
        { courseId },
        {
          headers: this.getAuthHeader()
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error enrolling in course:`, error);
      throw error;
    }
  }

  async unenrollFromCourse(courseId: number): Promise<{message: string, courseId: number}> {
    try {
      const response = await axios.delete(`${this.apiUrl}/api/student/courses/unenroll/${courseId}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      throw error;
    }
  }

  // Notifications
  public async getNotifications(): Promise<Notification[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/student/notifications`, {
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
      const response = await axios.get(`${this.apiUrl}/api/student/notifications/count`, {
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
      await axios.patch(`${this.apiUrl}/api/student/notifications/${id}`, {}, {
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
      await axios.patch(`${this.apiUrl}/api/student/notifications`, {}, {
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
      await axios.delete(`${this.apiUrl}/api/student/notifications`, {
        headers: this.getAuthHeader()
      });
      
      // Clear cached notifications
      localStorage.removeItem(this.STORAGE_KEYS.NOTIFICATIONS);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  }

  // Get materials for all enrolled courses
  public async getMaterials(): Promise<Material[]> {
    try {
      this.ensureAuthHeaders();
      
      const response = await axios.get(
        `${this.apiUrl}/api/student/materials`,
        { headers: this.getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  }

  // Get materials for a specific course
  public async getCourseMaterials(courseId: number): Promise<Material[]> {
    try {
      this.ensureAuthHeaders();
      
      const response = await axios.get(
        `${this.apiUrl}/api/student/courses/${courseId}/materials`,
        { headers: this.getAuthHeader() }
      );
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching materials for course ${courseId}:`, error);
      return [];
    }
  }

  // Toggle star status for a material
  public toggleMaterialStar(materialId: number): void {
    const materials = localStorage.getItem('iscp_materials') ? 
      JSON.parse(localStorage.getItem('iscp_materials') || '[]') : [];
    
    const updatedMaterials = materials.map((material: Material) => 
      material.id === materialId ? { ...material, starred: !material.starred } : material
    );
    
    localStorage.setItem('iscp_materials', JSON.stringify(updatedMaterials));
  }

  // Get progress for a specific course
  public async getCourseProgress(courseId: number): Promise<{progress: number, isMoreAccurate?: boolean}> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/student/courses/${courseId}/progress`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching progress for course ${courseId}:`, error);
      
      // Fallback to calculating from assignments if API endpoint fails
      try {
        const assignments = await this.getCourseAssignments(courseId);
        
        if (assignments.length === 0) {
          return { progress: 0 };
        }
        
        // Calculate based only on submitted assignments
        const totalAssignments = assignments.length;
        const completedAssignments = assignments.filter(
          a => a.status === 'submitted' || a.status === 'graded'
        ).length;
        
        // Progress is the ratio of completed assignments to total assignments
        const progress = Math.round((completedAssignments / totalAssignments) * 100);
        
        // Return the calculated progress
        return { 
          progress,
          isMoreAccurate: true // Flag that this calculation is based on real assignment data
        };
      } catch (error) {
        console.error(`Fallback calculation failed for course ${courseId}:`, error);
        return { progress: 0 };
      }
    }
  }

  // Get schedule for a specific course
  public async getCourseSchedule(courseId: number): Promise<ClassSession[]> {
    try {
      this.ensureAuthHeaders();
      const response = await axios.get(`${this.apiUrl}/api/student/courses/${courseId}/schedule`, {
        headers: this.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching schedule for course ${courseId}:`, error);
      
      // Fallback to empty array if endpoint fails
      return [];
    }
  }
}

export const studentService = new StudentService();
export default studentService; 