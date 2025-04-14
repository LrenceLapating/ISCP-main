/**
 * Settings.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 5, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Student settings page for managing user profile, preferences,
 * security settings, and notification preferences.
 */

import React, { useState, useEffect, SyntheticEvent } from 'react';
import StudentLayout from '../../components/StudentLayout';
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
  CircularProgress,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
import { studentService, UserSettings } from '../../services/StudentService';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { styled } from '@mui/material/styles';
import { useTheme as useMuiTheme } from '@mui/material/styles';

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
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Input = styled('input')({
  display: 'none',
});

const Settings: React.FC = () => {
  const muiTheme = useMuiTheme();
  const { mode, setThemeMode } = useTheme();
  const { language, setLanguage, getAvailableLanguages, t } = useLanguage();
  const { authState, updateUserProfile } = useAuth();
  
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
  
  // Profile state
  const [profile, setProfile] = useState<UserSettings>({
    id: 0,
    user_id: 0,
    first_name: '',
    last_name: '',
    phone: '',
    theme: 'light',
    language: 'English',
    email_notifications: true,
    push_notifications: true,
    assignment_notifications: true,
    message_notifications: true,
    announcement_notifications: true,
    profile_visibility: true,
    show_online_status: true,
    show_last_seen: true,
    profile_picture: '',
    email: '',
    campus: '',
    student_id: 0
  });
  
  // Password state
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  
  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  // Add tempImagePreview state to show the selected image before uploading
  const [tempImagePreview, setTempImagePreview] = useState<string | null>(null);

  // Add error state
  const [error, setError] = useState<string>('');

  // Load user profile on component mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const settings = await studentService.getUserSettings();
        console.log('Loaded settings:', settings);
        
        if (settings) {
          // If profile picture is a relative path, convert to full URL
          if (settings.profile_picture && !settings.profile_picture.startsWith('http') && !settings.profile_picture.startsWith('data:')) {
            settings.profile_picture = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${settings.profile_picture}`;
          }
          
          setProfile(settings);
          
          // If the profile appears to be a default profile (missing data), save it to server
          const isMissingData = !settings.first_name || !settings.last_name;
          if (isMissingData && authState.user) {
            const nameParts = authState.user.fullName ? authState.user.fullName.split(' ') : ['', ''];
            const updatedProfile = {
              ...settings,
              first_name: settings.first_name || nameParts[0] || '',
              last_name: settings.last_name || nameParts.slice(1).join(' ') || '',
              email: settings.email || authState.user.email || '',
              campus: settings.campus || authState.user.campus || '',
              student_id: settings.student_id || parseInt(authState.user.id || '0', 10)
            };
            
            // If we have updates, save them
            if (JSON.stringify(updatedProfile) !== JSON.stringify(settings)) {
              console.log('Updating incomplete profile with user data:', updatedProfile);
              setProfile(updatedProfile);
              await studentService.updateUserSettings(updatedProfile);
            }
          }
        } else {
          // Set default profile from auth data if no profile exists
          const defaultProfile: UserSettings = {
            id: 0,
            user_id: parseInt(authState.user?.id || '0', 10),
            first_name: authState.user?.fullName?.split(' ')[0] || '',
            last_name: authState.user?.fullName?.split(' ').slice(1).join(' ') || '',
            email: authState.user?.email || '',
            phone: '',
            student_id: parseInt(authState.user?.id || '0', 10),
            campus: authState.user?.campus || '',
            profile_picture: authState.user?.profileImage || '',
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
          
          setProfile(defaultProfile);
          
          // For new users, save this default profile to the database
          await handleInitialProfileSave(defaultProfile);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load profile data',
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

  // Helper function to save initial profile to database
  const handleInitialProfileSave = async (defaultProfile: UserSettings) => {
    try {
      console.log('Saving initial profile to database:', defaultProfile);
      
      // Format data for the server
      const serverData = {
        firstName: defaultProfile.first_name,
        lastName: defaultProfile.last_name,
        phone: defaultProfile.phone,
        theme: defaultProfile.theme,
        language: defaultProfile.language,
        emailNotifications: defaultProfile.email_notifications,
        pushNotifications: defaultProfile.push_notifications,
        assignmentNotifications: defaultProfile.assignment_notifications,
        messageNotifications: defaultProfile.message_notifications,
        announcementNotifications: defaultProfile.announcement_notifications,
        profileVisibility: defaultProfile.profile_visibility,
        showOnlineStatus: defaultProfile.show_online_status,
        showLastSeen: defaultProfile.show_last_seen
      };
      
      // Save to server
      await studentService.updateUserSettings(defaultProfile);
      console.log('Initial profile saved successfully.');
    } catch (error) {
      console.error('Error saving initial profile:', error);
    }
  };
  
  const handleTabChange = (event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleProfileChange = (field: keyof UserSettings, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    
    setProfile((prev) => ({
      ...prev,
      [name]: checked
    }));
  };
  
  const handlePasswordChange = (field: keyof typeof password, value: string) => {
    setPassword(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSaving(true);
      try {
        // Upload to "server" (local storage in our mock)
        const profilePicturePath = await studentService.uploadProfilePicture(file);
        
        if (profilePicturePath) {
          // Update with server path once uploaded
          setProfile({
            ...profile,
            profile_picture: profilePicturePath
          });
          
          setSnackbar({
            open: true,
            message: 'Profile picture uploaded successfully',
            severity: 'success'
          });
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
  
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await studentService.updateUserSettings(profile);
      setSnackbar({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      setSnackbar({
        open: true,
        message: 'Error updating profile',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSavePassword = async () => {
    if (password.new !== password.confirm) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error'
      });
      return;
    }

    if (password.new.length < 8) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 8 characters long',
        severity: 'error'
      });
      return;
    }

    try {
      setSaving(true);
      await studentService.changePassword(password.current, password.new);
      setPassword({ current: '', new: '', confirm: '' });
      setSnackbar({
        open: true,
        message: 'Password changed successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setSnackbar({
        open: true,
        message: 'Error changing password',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({
      ...prev,
      open: false
    }));
  };

  // Close the error alert
  const handleCloseAlert = () => {
    setError('');
  };

  // Add a function to update theme
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    // Update UI state
    setProfile({
      ...profile,
      theme: newTheme
    });
    
    // Apply theme change immediately
    setThemeMode(newTheme);
  };

  // Add a function to update language
  const handleLanguageChange = (newLanguage: string) => {
    // Update UI state
    setProfile({
      ...profile,
      language: newLanguage
    });
    
    // Apply language change immediately
    setLanguage(newLanguage as any);
  };

  // Add a function to update privacy settings
  const handlePrivacyChange = (setting: 'profile_visibility' | 'show_online_status' | 'show_last_seen', value: any) => {
    setProfile({
      ...profile,
      [setting]: value
    });
  };

  return (
    <StudentLayout title={t('settings')}>
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
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
            {t('settings')}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {t('manageSettings')}
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
                      alt={`${profile.first_name} ${profile.last_name}`}
                      src={tempImagePreview || profile.profile_picture}
                      sx={{ 
                        width: { xs: 100, sm: 120 }, 
                        height: { xs: 100, sm: 120 },
                        boxShadow: '0 0 0 4px rgba(255, 255, 255, 0.1)'
                      }}
                    >
                      {!tempImagePreview && !profile.profile_picture && profile.first_name && 
                        `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`}
                    </Avatar>
                    <IconButton 
                      component="label"
                      sx={{ 
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                      />
                      <Edit sx={{ color: '#fff', fontSize: 20 }} />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1, 
                    textAlign: { xs: 'center', sm: 'left' } 
                  }}>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>
                      {profile.first_name} {profile.last_name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                      {t('student')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      ID: {profile.student_id} • Campus: {profile.campus}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="outlined" 
                      component="label"
                      startIcon={profilePicture ? <CloudUpload /> : <PhotoCamera />}
                      sx={{
                        mt: 2,
                        borderRadius: 2,
                        color: 'rgba(255, 255, 255, 0.7)', 
                        borderColor: 'rgba(255, 255, 255, 0.7)', 
                      }}
                    >
                      {profilePicture ? 'Selected' : 'Select Photo'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                      />
                    </Button>
                    
                    {profilePicture && (
                      <Button 
                        variant="contained"
                        color="primary"
                        onClick={handleSaveProfile}
                        startIcon={<CloudUpload />}
                        sx={{
                          mt: 2,
                          borderRadius: 2
                        }}
                        disabled={saving}
                      >
                        {saving ? 'Uploading...' : 'Upload'}
                      </Button>
                    )}
                  </Box>
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
                  <Tab icon={<Person sx={{ fontSize: 20 }} />} iconPosition="start" label={t('profileSettings')} />
                  <Tab icon={<Security sx={{ fontSize: 20 }} />} iconPosition="start" label={t('passwordSecurity')} />
                  <Tab icon={<Notifications sx={{ fontSize: 20 }} />} iconPosition="start" label={t('notificationSettings')} />
                  <Tab icon={<ColorLens sx={{ fontSize: 20 }} />} iconPosition="start" label={t('appearance')} />
                </Tabs>
              </Box>

              {/* Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    {t('personalInfo')}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                      <TextField
                        label="First Name"
                        name="first_name"
                        value={profile.first_name}
                        onChange={(e) => handleProfileChange('first_name', e.target.value)}
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
                        name="last_name"
                        value={profile.last_name}
                        onChange={(e) => handleProfileChange('last_name', e.target.value)}
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
                        onChange={(e) => handleProfileChange('email', e.target.value)}
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
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
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
                      {saving ? t('saving') : t('saveChanges')}
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              {/* Password Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    {t('changePassword')}
                  </Typography>
                  
                  <Grid container spacing={3}>
                    <Grid sx={{ gridColumn: 'span 12' }}>
                      <TextField
                        label="Current Password"
                        name="current"
                        type={showPassword ? 'text' : 'password'}
                        value={password.current}
                        onChange={(e) => handlePasswordChange('current', e.target.value)}
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
                              onClick={() => setShowPassword(!showPassword)}
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
                        name="new"
                        type={showPassword ? 'text' : 'password'}
                        value={password.new}
                        onChange={(e) => handlePasswordChange('new', e.target.value)}
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
                        name="confirm"
                        type={showPassword ? 'text' : 'password'}
                        value={password.confirm}
                        onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                        fullWidth
                        margin="normal"
                        error={password.new !== password.confirm}
                        helperText={
                          password.new !== password.confirm
                            ? "Passwords don't match"
                            : ""
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
                      disabled={
                        !password.current ||
                        !password.new ||
                        !password.confirm ||
                        password.new !== password.confirm ||
                        password.new.length < 8
                      }
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      {saving ? t('saving') : t('updatePassword')}
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              {/* Notifications Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    {t('notificationPreferences')}
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
                          name="email_notifications"
                          checked={profile.email_notifications}
                          onChange={handleSwitchChange}
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
                          name="push_notifications"
                          checked={profile.push_notifications}
                          onChange={handleSwitchChange}
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
                          name="assignment_notifications"
                          checked={profile.assignment_notifications}
                          onChange={handleSwitchChange}
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
                          name="message_notifications"
                          checked={profile.message_notifications}
                          onChange={handleSwitchChange}
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
                          name="announcement_notifications"
                          checked={profile.announcement_notifications}
                          onChange={handleSwitchChange}
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
                      {saving ? t('saving') : t('savePreferences')}
                    </Button>
                  </Box>
                </Box>
              </TabPanel>

              {/* Appearance Tab */}
              <TabPanel value={tabValue} index={3}>
                <Box sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#fff', fontWeight: 600 }}>
                    {t('appearanceSettings')}
                  </Typography>
                  
                  <List sx={{ width: '100%' }}>
                    <ListItem>
                      <ListItemIcon>
                        <DarkMode sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('theme')}
                        secondary={t('themeDescription')}
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Button 
                          variant={profile.theme === 'dark' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleThemeChange('dark')}
                          sx={{ mr: 1, minWidth: 80 }}
                        >
                          {t('dark')}
                        </Button>
                        <Button 
                          variant={profile.theme === 'light' ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => handleThemeChange('light')}
                          sx={{ minWidth: 80 }}
                        >
                          {t('light')}
                        </Button>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <ListItem>
                      <ListItemIcon>
                        <Language sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={t('language')}
                        secondary={t('languageDescription')}
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        {getAvailableLanguages(profile.campus).map((lang) => (
                          <Button 
                            key={lang}
                            variant={profile.language === lang ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => handleLanguageChange(lang)}
                            sx={{ mr: 1, minWidth: 100 }}
                          >
                            {lang}
                          </Button>
                        ))}
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <Divider sx={{ my: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }} />
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ color: '#fff', fontWeight: 600, px: 2 }}>
                      {t('privacySettings')}
                    </Typography>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('profileVisibility')}
                        secondary={t('profileVisibilityDescription')}
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button 
                            variant={profile.profile_visibility ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => handlePrivacyChange('profile_visibility', true)}
                            sx={{ minWidth: 80 }}
                          >
                            {t('public')}
                          </Button>
                          <Button 
                            variant={!profile.profile_visibility ? 'contained' : 'outlined'}
                            size="small"
                            onClick={() => handlePrivacyChange('profile_visibility', false)}
                            sx={{ minWidth: 80 }}
                          >
                            {t('private')}
                          </Button>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('onlineStatus')}
                        secondary={t('onlineStatusDescription')}
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="show_online_status"
                          checked={profile.show_online_status}
                          onChange={(e) => handlePrivacyChange('show_online_status', e.target.checked)}
                          edge="end"
                          color="primary"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    <ListItem>
                      <ListItemText 
                        primary={t('lastSeen')}
                        secondary={t('lastSeenDescription')}
                        primaryTypographyProps={{ color: '#fff' }}
                        secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      />
                      <ListItemSecondaryAction>
                        <Switch
                          name="show_last_seen"
                          checked={profile.show_last_seen}
                          onChange={(e) => handlePrivacyChange('show_last_seen', e.target.checked)}
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
                      {saving ? t('saving') : t('save')}
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
                  {t('dangerZone')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                  {t('dangerWarning')}
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
                  {t('deleteAccount')}
                </Button>
              </Paper>
            </Box>

            <Dialog 
              open={Boolean(error)} 
              onClose={handleCloseAlert}
              aria-labelledby="error-dialog-title"
            >
              <DialogTitle id="error-dialog-title" sx={{ color: muiTheme.palette.error.main }}>
                Error
              </DialogTitle>
              <DialogContent>
                <Typography>{error}</Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseAlert} color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
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
    </StudentLayout>
  );
};

export default Settings; 