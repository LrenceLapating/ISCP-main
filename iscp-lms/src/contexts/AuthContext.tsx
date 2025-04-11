import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types/auth.types';
import axios from 'axios';

// API base URL
const API_URL = 'http://localhost:5000/api';

// Initial auth state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null
};

// Create context
interface AuthContextProps {
  authState: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Demo user data for fallback if needed
const DEMO_USERS: Record<string, User> = {
  'demo@iscp.edu.ph': {
    id: '1',
    fullName: 'Demo Student',
    email: 'demo@iscp.edu.ph',
    role: 'student',
    campus: 'Biniliran Campus'
  },
  'faculty@iscp.edu.ph': {
    id: '2',
    fullName: 'Demo Professor',
    email: 'faculty@iscp.edu.ph',
    role: 'teacher',
    campus: 'Biniliran Campus'
  },
  'admin@iscp.edu.ph': {
    id: '3',
    fullName: 'Admin User',
    email: 'admin@iscp.edu.ph',
    role: 'admin',
    campus: 'All Campuses'
  }
};

// Setup axios instance with credentials
axios.defaults.withCredentials = true;

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(initialState);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    setAuthState({ ...authState, loading: true, error: null });
    
    try {
      // Make API call to login endpoint
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      });
      
      let { user, token } = response.data;
      
      // Check for existing user profile data in localStorage
      const existingUserData = localStorage.getItem('user');
      if (existingUserData) {
        try {
          const existingUser = JSON.parse(existingUserData);
          // If the existing user has the same email, preserve profile image
          if (existingUser.email === user.email && existingUser.profileImage) {
            user = {
              ...user,
              profileImage: existingUser.profileImage
            };
          }
        } catch (err) {
          console.error('Error parsing existing user data:', err);
        }
      }
      
      // Always store token and user data regardless of remember option
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update auth state
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      
      setAuthState({
        ...authState,
        loading: false,
        error: errorMessage
      });
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    setAuthState({ ...authState, loading: true, error: null });

    try {
      // Make API call to register endpoint
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: credentials.email,
        password: credentials.password,
        fullName: credentials.fullName,
        role: credentials.role,
        campus: credentials.campus
      });
      
      const { user, token } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Create user settings immediately after registration
      try {
        // Parse the full name into first and last name
        const nameParts = credentials.fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Create default user settings
        const userSettings = {
          firstName,
          lastName,
          phone: '',
          theme: 'dark',
          language: 'English',
          emailNotifications: true,
          pushNotifications: true,
          assignmentNotifications: true,
          messageNotifications: true,
          announcementNotifications: true,
          profileVisibility: 'public',
          showOnlineStatus: true,
          showLastSeen: true
        };
        
        // Save settings to API
        await axios.put(`${API_URL}/user/settings`, userSettings, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('User settings created successfully');
      } catch (settingsError) {
        console.error('Failed to create initial user settings:', settingsError);
        // Continue with login even if settings creation fails
      }
      
      // Update auth state
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      
      setAuthState({
        ...authState,
        loading: false,
        error: errorMessage
      });
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and reset state regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setAuthState(initialState);
    }
  };

  // Method to update user profile data (for profile picture updates, etc.)
  const updateUserProfile = (updatedUser: Partial<User>): void => {
    if (authState.user) {
      const user = {
        ...authState.user,
        ...updatedUser
      };
      
      // Update state
      setAuthState({
        ...authState,
        user
      });
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(user));
    }
  };

  // Check if user is already logged in from localStorage on initial load
  React.useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          // Set authorization header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify token validity with backend
          const response = await axios.get(`${API_URL}/auth/me`);
          
          setAuthState({
            isAuthenticated: true,
            user: response.data,
            loading: false,
            error: null
          });
        } catch (error) {
          console.error('Auth verification error:', error);
          
          // Token invalid or expired - fallback to stored user if API is unavailable
          try {
            const userObj = JSON.parse(storedUser);
            setAuthState({
              isAuthenticated: true,
              user: userObj,
              loading: false,
              error: null
            });
          } catch (parseError) {
            // If parsing fails, clear storage and log out
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setAuthState(initialState);
          }
        }
      }
    };
    
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ authState, login, register, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 