import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Avatar,
  IconButton,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Person,
  Edit,
  Notifications,
  Security,
  Visibility,
  VisibilityOff,
  Language,
  ColorLens,
  DarkMode,
  CloudUpload,
  Delete,
  Save,
  PhotoCamera
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import adminService, { UserSettings as AdminSettings } from '../../services/AdminService';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

// Define the UserProfile interface
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  adminId: string;
  role: string;
  accessLevel: string;
  campus: string;
  profilePicture?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
      assignments: boolean;
      messages: boolean;
      announcements: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'contacts';
      showOnlineStatus: boolean;
      showLastSeen: boolean;
    };
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings: React.FC = () => {
  const { authState, updateUserProfile } = useAuth();
  const { mode, setThemeMode } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Default profile state
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    adminId: '',
    role: 'System Administrator',
    accessLevel: 'Full Access',
    campus: '',
    preferences: {
      theme: 'dark',
      language: 'English',
      notifications: {
        email: true,
        push: false,
        assignments: true,
        messages: true,
        announcements: true
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        showLastSeen: true
      }
    }
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        // Get profile from AdminService using the async method
        const savedProfile = await adminService.getUserSettings();
        
        // If profile exists, use it
        if (savedProfile && Object.keys(savedProfile).length > 0) {
          // Check if the profile picture is a relative path
          let profilePicture = savedProfile.profilePicture;
          if (profilePicture && !profilePicture.startsWith('http') && !profilePicture.startsWith('data:')) {
            profilePicture = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${profilePicture}`;
          }
          
          // Map server data to admin format
          setProfile({
            firstName: savedProfile.firstName,
            lastName: savedProfile.lastName,
            email: savedProfile.email || '',
            phone: savedProfile.phone || '',
            adminId: savedProfile.adminId ? String(savedProfile.adminId) : '',
            role: savedProfile.role || 'System Administrator',
            accessLevel: savedProfile.accessLevel || 'Full Access',
            campus: savedProfile.campus || 'All Campuses',
            profilePicture: profilePicture,
            preferences: {
              theme: savedProfile.theme || 'dark',
              language: savedProfile.language || 'English',
              notifications: {
                email: savedProfile.emailNotifications !== undefined ? savedProfile.emailNotifications : true,
                push: savedProfile.pushNotifications !== undefined ? savedProfile.pushNotifications : false,
                assignments: savedProfile.assignmentNotifications !== undefined ? savedProfile.assignmentNotifications : true,
                messages: savedProfile.messageNotifications !== undefined ? savedProfile.messageNotifications : true,
                announcements: savedProfile.announcementNotifications !== undefined ? savedProfile.announcementNotifications : true
              },
              privacy: {
                profileVisibility: savedProfile.profileVisibility || 'public',
                showOnlineStatus: savedProfile.showOnlineStatus !== undefined ? savedProfile.showOnlineStatus : true,
                showLastSeen: savedProfile.showLastSeen !== undefined ? savedProfile.showLastSeen : true
              }
            }
          });
          
          // Check if profile is missing essential data
          const isMissingData = !savedProfile.firstName || !savedProfile.lastName || !savedProfile.email;
          if (isMissingData && authState.user) {
            // Fill in missing data from authState
            const nameParts = authState.user.fullName ? authState.user.fullName.split(' ') : ['', ''];
            const updatedProfile = {
              ...savedProfile,
              firstName: savedProfile.firstName || nameParts[0] || '',
              lastName: savedProfile.lastName || nameParts.slice(1).join(' ') || '',
              email: savedProfile.email || authState.user.email || '',
              campus: savedProfile.campus || authState.user.campus || 'All Campuses',
              adminId: savedProfile.adminId || parseInt(authState.user.id || '0', 10)
            };
            
            // If changes were made, save the updated profile
            if (JSON.stringify(updatedProfile) !== JSON.stringify(savedProfile)) {
              console.log('Updating incomplete admin profile with user data:', updatedProfile);
              await adminService.updateUserSettings(updatedProfile);
              
              // Update the current state with the new data
              setProfile(prev => ({
                ...prev,
                firstName: updatedProfile.firstName,
                lastName: updatedProfile.lastName,
                email: updatedProfile.email,
                campus: updatedProfile.campus,
                adminId: String(updatedProfile.adminId)
              }));
            }
          }
        } else {
          // No profile found - initialize with data from auth
          const user = authState.user;
          if (user) {
            const names = user.fullName.split(' ');
            const firstName = names[0];
            const lastName = names.slice(1).join(' ');
            
            const newProfile: AdminSettings = {
              id: 0,
              userId: parseInt(user.id || '0', 10),
              firstName,
              lastName,
              email: user.email,
              phone: '',
              adminId: parseInt(user.id || '0', 10),
              role: 'System Administrator',
              accessLevel: 'Full Access',
              campus: user.campus || 'All Campuses',
              profilePicture: user.profileImage || '',
              theme: 'dark',
              language: 'English',
              emailNotifications: true,
              pushNotifications: false,
              assignmentNotifications: true,
              messageNotifications: true,
              announcementNotifications: true,
              profileVisibility: 'public',
              showOnlineStatus: true,
              showLastSeen: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Save this profile to the service
            await handleInitialProfileSave(newProfile);
            
            // Update local state
            setProfile({
              firstName,
              lastName,
              email: user.email,
              phone: '',
              adminId: user.id || '',
              role: 'System Administrator',
              accessLevel: 'Full Access',
              campus: user.campus || 'All Campuses',
              profilePicture: user.profileImage,
              preferences: {
                theme: 'dark',
                language: 'English',
                notifications: {
                  email: true,
                  push: false,
                  assignments: true,
                  messages: true,
                  announcements: true
                },
                privacy: {
                  profileVisibility: 'public',
                  showOnlineStatus: true,
                  showLastSeen: true
                }
              }
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load profile',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (authState.isAuthenticated && authState.user) {
      loadProfile();
    }
  }, [authState.isAuthenticated, authState.user]);
  
  // Helper function to save initial profile for new users
  const handleInitialProfileSave = async (defaultProfile: AdminSettings) => {
    try {
      console.log('Saving initial admin profile to database:', defaultProfile);
      await adminService.updateUserSettings(defaultProfile);
      console.log('Initial admin profile saved successfully');
    } catch (error) {
      console.error('Error saving initial admin profile:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2 && parts[0] === 'preferences') {
        setProfile({
          ...profile,
          preferences: {
            ...profile.preferences,
            [parts[1]]: type === 'checkbox' ? checked : value
          }
        });
      } else if (parts.length === 3 && parts[0] === 'preferences') {
        if (parts[1] === 'notifications') {
          setProfile({
            ...profile,
            preferences: {
              ...profile.preferences,
              notifications: {
                ...profile.preferences.notifications,
                [parts[2]]: type === 'checkbox' ? checked : value
              }
            }
          });
        } else if (parts[1] === 'privacy') {
          setProfile({
            ...profile,
            preferences: {
              ...profile.preferences,
              privacy: {
                ...profile.preferences.privacy,
                [parts[2]]: type === 'checkbox' ? checked : value
              }
            }
          });
        }
      }
    } else {
      // Handle top-level properties
      setProfile({
        ...profile,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value
    });
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    
    try {
      // Convert component's profile format to the service/API format
      const serviceProfile: AdminSettings = {
        id: 0,
        userId: parseInt(profile.adminId || '0'),
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        profilePicture: profile.profilePicture,
        adminId: parseInt(profile.adminId || '0'),
        campus: profile.campus,
        role: profile.role,
        accessLevel: profile.accessLevel,
        theme: profile.preferences.theme,
        language: profile.preferences.language,
        emailNotifications: profile.preferences.notifications.email,
        pushNotifications: profile.preferences.notifications.push,
        assignmentNotifications: profile.preferences.notifications.assignments,
        messageNotifications: profile.preferences.notifications.messages,
        announcementNotifications: profile.preferences.notifications.announcements,
        profileVisibility: profile.preferences.privacy.profileVisibility,
        showOnlineStatus: profile.preferences.privacy.showOnlineStatus,
        showLastSeen: profile.preferences.privacy.showLastSeen,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save profile via the service
      const success = await adminService.updateUserSettings(serviceProfile);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success'
        });
        
        // Update auth context if necessary
        if (authState.user) {
          updateUserProfile({
            ...authState.user,
            fullName: `${profile.firstName} ${profile.lastName}`,
            campus: profile.campus
          });
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    // Validate password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error'
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters',
        severity: 'error'
      });
      return;
    }
    
    setSaving(true);
    try {
      const success = await adminService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Password updated successfully',
          severity: 'success'
        });
        
        // Reset form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        throw new Error('Failed to update password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({
        open: true,
        message: 'Failed to update password. Current password may be incorrect.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // File input handler
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSaving(true);
      
      try {
        // Upload the file via the service
        const profilePicturePath = await adminService.uploadProfilePicture(file);
        
        if (profilePicturePath) {
          // Update local state with the new profile picture
          setProfile(prev => ({
            ...prev,
            profilePicture: profilePicturePath
          }));
          
          // Update auth context if needed
          if (authState.user) {
            updateUserProfile({
              ...authState.user,
              profileImage: profilePicturePath
            });
          }
          
          setSnackbar({
            open: true,
            message: 'Profile picture updated successfully',
            severity: 'success'
          });
        } else {
          throw new Error('Failed to upload profile picture');
        }
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        setSnackbar({
          open: true,
          message: 'Failed to upload profile picture',
          severity: 'error'
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Add a function to update theme
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    // Update UI state
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        theme: newTheme
      }
    });
    
    // Apply theme change immediately
    setThemeMode(newTheme);
  };

  // Add a function to update language
  const handleLanguageChange = (newLanguage: 'English' | 'Filipino') => {
    // Update UI state
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        language: newLanguage
      }
    });
    
    // Apply language change immediately
    setLanguage(newLanguage);
  };

  // Add a function to update privacy settings
  const handlePrivacyChange = (setting: 'profileVisibility' | 'showOnlineStatus' | 'showLastSeen', value: any) => {
    setProfile({
      ...profile,
      preferences: {
        ...profile.preferences,
        privacy: {
          ...profile.preferences.privacy,
          [setting]: value
        }
      }
    });
  };

  return (
    <AdminLayout title="Settings">
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 600, 
              color: '#fff',
              mb: 1
            }}
          >
            Settings
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Manage your account settings and preferences
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <Box sx={{ 
                  p: 3, 
                  display: 'flex', 
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 3 }
                }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar
                      src={profile.profilePicture}
                      alt={`${profile.firstName} ${profile.lastName}`}
                      sx={{ 
                        width: 100, 
                        height: 100,
                        border: '4px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        },
                        width: 36,
                        height: 36
                      }}
                      onClick={() => {}}
                    >
                      <Edit sx={{ fontSize: 18, color: '#fff' }} />
                    </IconButton>
                  </Box>
                  
                  <Box>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>
                      {profile.firstName} {profile.lastName}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <Security sx={{ fontSize: 18, mr: 1 }} />
                      {profile.role} • {profile.accessLevel}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 0.5 }}>
                      ID: {profile.adminId} • Campus: {profile.campus}
                    </Typography>
                  </Box>
                  
                  <Button 
                    variant="outlined" 
                    component="label" 
                    startIcon={<PhotoCamera />}
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      color: 'rgba(255, 255, 255, 0.7)', 
                      borderColor: 'rgba(255, 255, 255, 0.7)', 
                    }}
                  >
                    Upload Photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                    />
                  </Button>
                </Box>
              </Paper>
            </Box>

            <Paper 
              elevation={0} 
              sx={{ 
                borderRadius: 2,
                overflow: 'hidden',
                bgcolor: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  textColor="inherit"
                  indicatorColor="primary"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ 
                    px: 2, 
                    pt: 1,
                    '& .MuiTab-root': { 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      minHeight: 48
                    },
                    '& .Mui-selected': {
                      color: '#fff',
                      fontWeight: 600
                    }
                  }}
                >
                  <Tab icon={<Person sx={{ fontSize: 20 }} />} iconPosition="start" label="Profile" />
                  <Tab icon={<Security sx={{ fontSize: 20 }} />} iconPosition="start" label="Password & Security" />
                  <Tab icon={<Notifications sx={{ fontSize: 20 }} />} iconPosition="start" label="Notifications" />
                  <Tab icon={<ColorLens sx={{ fontSize: 20 }} />} iconPosition="start" label="Appearance" />
                </Tabs>
              </Box>

              {/* Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    Personal Information
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        label="First Name"
                        name="firstName"
                        value={profile.firstName}
                        onChange={handleProfileChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        label="Last Name"
                        name="lastName"
                        value={profile.lastName}
                        onChange={handleProfileChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        label="Email Address"
                        name="email"
                        value={profile.email}
                        onChange={handleProfileChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        label="Phone Number"
                        name="phone"
                        value={profile.phone}
                        onChange={handleProfileChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        label="Role"
                        name="role"
                        value={profile.role}
                        onChange={handleProfileChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        label="Access Level"
                        name="accessLevel"
                        value={profile.accessLevel}
                        onChange={handleProfileChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={saving}
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              {/* Password Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    Change Password
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        label="Current Password"
                        name="currentPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          },
                          endAdornment: (
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePassword}
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        label="New Password"
                        name="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        label="Confirm New Password"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        margin="normal"
                        error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
                        helperText={
                          passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== '' 
                            ? 'Passwords do not match' 
                            : ''
                        }
                        InputLabelProps={{ 
                          shrink: true,
                          sx: { color: 'rgba(255, 255, 255, 0.7)' }
                        }}
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
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                        FormHelperTextProps={{
                          sx: { color: 'error.main' }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<Save />}
                      onClick={handleSavePassword}
                      disabled={saving ||
                        !passwordForm.currentPassword ||
                        !passwordForm.newPassword ||
                        !passwordForm.confirmPassword ||
                        passwordForm.newPassword !== passwordForm.confirmPassword}
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      {saving ? 'Saving...' : 'Update Password'}
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              {/* Notifications Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    Notification Preferences
                  </Typography>
                  
                  <List sx={{ width: '100%' }}>
                    <ListItem>
                      <ListItemIcon>
                        <Notifications sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Email Notifications" 
                        secondary="Receive email updates about your account"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="preferences.notifications.email"
                          checked={profile.preferences.notifications.email}
                          onChange={handleProfileChange}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemIcon>
                        <Notifications sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Push Notifications" 
                        secondary="Receive push notifications on this device"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="preferences.notifications.push"
                          checked={profile.preferences.notifications.push}
                          onChange={handleProfileChange}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff', fontWeight: 600, px: 2 }}>
                      Notification Types
                    </Typography>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Assignment Updates" 
                        secondary="Notifications about assignments, due dates and grades"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="preferences.notifications.assignments"
                          checked={profile.preferences.notifications.assignments}
                          onChange={handleProfileChange}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Messages" 
                        secondary="Notifications about new messages from instructors and classmates"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="preferences.notifications.messages"
                          checked={profile.preferences.notifications.messages}
                          onChange={handleProfileChange}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Announcements" 
                        secondary="Receive notifications about assignments, messages and announcements"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="preferences.notifications.announcements"
                          checked={profile.preferences.notifications.announcements}
                          onChange={handleProfileChange}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={saving}
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      {saving ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              {/* Appearance Tab */}
              <TabPanel value={tabValue} index={3}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    Appearance Settings
                  </Typography>
                  
                  <List sx={{ width: '100%' }}>
                    <ListItem>
                      <ListItemIcon>
                        <DarkMode sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Theme" 
                        secondary="Choose between light and dark mode"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Button 
                          variant={profile.preferences.theme === 'dark' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleThemeChange('dark')}
                          sx={{ mr: 1, minWidth: 80 }}
                        >
                          Dark
                        </Button>
                        <Button 
                          variant={profile.preferences.theme === 'light' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleThemeChange('light')}
                          sx={{ minWidth: 80 }}
                        >
                          Light
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <ListItem>
                      <ListItemIcon>
                        <Language sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Language" 
                        secondary="Select your preferred language"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Button 
                          variant={profile.preferences.language === 'English' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleLanguageChange('English')}
                          sx={{ mr: 1, minWidth: 100 }}
                        >
                          English
                        </Button>
                        <Button 
                          variant={profile.preferences.language === 'Filipino' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleLanguageChange('Filipino')}
                          sx={{ minWidth: 100 }}
                        >
                          Filipino
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff', fontWeight: 600, px: 2 }}>
                      Privacy Settings
                    </Typography>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Profile Visibility" 
                        secondary="Control who can see your profile information"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant={profile.preferences.privacy.profileVisibility === 'public' ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => handlePrivacyChange('profileVisibility', 'public')}
                            sx={{ minWidth: 80 }}
                          >
                            Public
                          </Button>
                          <Button 
                            variant={profile.preferences.privacy.profileVisibility === 'private' ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => handlePrivacyChange('profileVisibility', 'private')}
                            sx={{ minWidth: 80 }}
                          >
                            Private
                          </Button>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Show Online Status" 
                        secondary="Let others see when you're online"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="preferences.privacy.showOnlineStatus"
                          checked={profile.preferences.privacy.showOnlineStatus}
                          onChange={(e) => handlePrivacyChange('showOnlineStatus', e.target.checked)}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary="Show Last Seen" 
                        secondary="Let others see when you were last active"
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="preferences.privacy.showLastSeen"
                          checked={profile.preferences.privacy.showLastSeen}
                          onChange={(e) => handlePrivacyChange('showLastSeen', e.target.checked)}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  </List>
                  
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="contained" 
                      startIcon={<Save />}
                      onClick={handleSaveProfile}
                      disabled={saving}
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </Box>
                </Box>
              </TabPanel>
            </Paper>
            
            <Box sx={{ mt: 4 }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'rgba(255, 61, 61, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 61, 61, 0.2)',
                  p: 3
                }}
              >
                <Typography variant="h6" sx={{ color: '#ff3d3d', mb: 1 }}>
                  Danger Zone
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                  These actions are permanent and cannot be undone. Please proceed with caution.
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<Delete />}
                  sx={{ 
                    borderColor: '#ff3d3d', 
                    color: '#ff3d3d',
                    '&:hover': {
                      borderColor: '#ff0000', 
                      bgcolor: 'rgba(255, 0, 0, 0.04)'
                    }
                  }}
                >
                  Delete Account
                </Button>
              </Paper>
            </Box>
          </>
        )}
      </Container>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            minWidth: 250,
            boxShadow: 2,
            bgcolor: snackbar.severity === 'success' ? 'success.dark' : 'error.dark',
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default Settings; 