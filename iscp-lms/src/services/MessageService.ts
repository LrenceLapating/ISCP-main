/**
 * MessageService.ts
 * 
 * Author: Marc Laurence Lapating
 * Date: April 2, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Service class that handles messaging functionality across user roles.
 * Provides methods for sending, receiving, and managing messages between users.
 */

import axios from 'axios';

export interface User {
  id: number;
  fullName: string;
  email: string;
  profileImage: string | null;
  role: string;
  campus?: string;
  status?: 'online' | 'offline' | 'away';
  lastActive?: string;
}

export interface Conversation {
  id: number;
  title: string | null;
  type: 'direct' | 'group';
  unreadCount: number;
  lastMessage: Message | null;
  otherParticipant: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_profile_image: string | null;
  sender_campus?: string;
  content: string;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  updated_at: string;
  read_by?: number[]; // IDs of users who have read the message
  read_by_all?: boolean; // Whether the message has been read by all participants
}

export interface Contact {
  id: number;
  email: string;
  fullName: string;
  role: string;
  profileImage: string | null;
  campus?: string;
  status?: 'online' | 'offline' | 'away';
  lastActive?: string;
}

class MessageService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }
  
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
  // Get all conversations for the current user
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/api/messages/conversations`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }
  
  // Get users for creating new conversations
  async getUsers(query?: string): Promise<Contact[]> {
    try {
      const url = query 
        ? `${this.apiUrl}/api/messages/users?query=${encodeURIComponent(query)}`
        : `${this.apiUrl}/api/messages/users`;
        
      const response = await axios.get(url, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
  
  // Create a new conversation
  async createConversation(
    participantIds: number[], 
    title?: string, 
    type: 'direct' | 'group' = 'direct',
    initialMessage?: string,
    attachmentUrl?: string,
    attachmentType?: string
  ): Promise<{ conversationId: number, alreadyExists?: boolean }> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/messages/conversations`,
        {
          participantIds,
          title,
          type,
          initialMessage,
          attachmentUrl,
          attachmentType
        },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }
  
  // Get messages in a conversation
  async getMessages(conversationId: number): Promise<Message[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/api/messages/conversations/${conversationId}/messages`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching messages for conversation ${conversationId}:`, error);
      return [];
    }
  }
  
  // Send a message in a conversation
  async sendMessage(conversationId: number, content: string, attachmentUrl?: string, attachmentType?: string): Promise<Message> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/api/messages/conversations/${conversationId}/messages`,
        {
          content,
          attachmentUrl,
          attachmentType
        },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error(`Error sending message to conversation ${conversationId}:`, error);
      throw error;
    }
  }
  
  // Mark messages as read
  async markAsRead(conversationId: number): Promise<boolean> {
    try {
      await axios.post(
        `${this.apiUrl}/api/messages/conversations/${conversationId}/read`,
        {},
        { headers: this.getAuthHeader() }
      );
      return true;
    } catch (error) {
      console.error(`Error marking conversation ${conversationId} as read:`, error);
      return false;
    }
  }
  
  // Upload a file attachment for a message
  async uploadMessageAttachment(file: File): Promise<{ url: string, type: string } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(
        `${this.apiUrl}/api/uploads/message`,
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
        type: response.data.fileType
      };
    } catch (error) {
      console.error('Error uploading message attachment:', error);
      return null;
    }
  }
  
  // Check total unread message count for notification
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/api/messages/unread-count`,
        { headers: this.getAuthHeader() }
      );
      
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread message count:', error);
      
      // Fallback: compute from locally cached conversations
      try {
        const conversations = await this.getConversations();
        return conversations.reduce((count, conv) => count + conv.unreadCount, 0);
      } catch {
        return 0;
      }
    }
  }
  
  // Start background polling for new messages
  startBackgroundPolling(intervalMs = 30000): (() => void) {
    // First check immediately
    this.checkForNewMessages();
    
    // Then set up interval
    const intervalId = setInterval(() => {
      this.checkForNewMessages();
    }, intervalMs);
    
    // Return cleanup function
    return () => {
      clearInterval(intervalId);
    };
  }
  
  // Check for new messages and dispatch an event if found
  private async checkForNewMessages(): Promise<void> {
    try {
      const unreadCount = await this.getUnreadCount();
      
      if (unreadCount > 0) {
        // Dispatch event for components to update
        window.dispatchEvent(new CustomEvent('message-received'));
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  }
}

// Initialize message service and start background polling
const messageService = new MessageService();

// Start background polling when app loads
let stopPolling: (() => void) | null = null;

// Set up polling when user is logged in
const setupMessagePolling = () => {
  const token = localStorage.getItem('token');
  
  // If token exists, start polling
  if (token && !stopPolling) {
    stopPolling = messageService.startBackgroundPolling();
  } else if (!token && stopPolling) {
    // If token is removed (logged out), stop polling
    stopPolling();
    stopPolling = null;
  }
};

// Setup polling initially
setupMessagePolling();

// Listen for login/logout events
window.addEventListener('storage', (event) => {
  if (event.key === 'token') {
    setupMessagePolling();
  }
});

export default messageService; 