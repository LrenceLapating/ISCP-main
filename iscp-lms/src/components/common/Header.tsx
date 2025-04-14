/**
 * Header.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: March 30, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Common header component with application branding,
 * notification bell, and user profile menu.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Avatar, 
  IconButton, 
  Badge,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import { 
  School, 
  Notifications, 
  AccountCircle,
  Settings,
  ExitToApp
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { authState, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  
  // Effect to update profile image when user changes
  useEffect(() => {
    if (authState.user?.profileImage) {
      const imageUrl = `http://localhost:5000${authState.user.profileImage}`;
      console.log('Profile image URL:', imageUrl);
      setProfileImageUrl(imageUrl);
    } else {
      setProfileImageUrl(undefined);
    }

    // Listen for user update events
    const handleUserUpdate = () => {
      console.log('User update event received in Header');
      // Force a rerender by getting the updated user from localStorage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const user = JSON.parse(userJson);
          if (user.profileImage) {
            const imageUrl = `http://localhost:5000${user.profileImage}`;
            console.log('Updated profile image URL:', imageUrl);
            setProfileImageUrl(imageUrl);
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    };

    window.addEventListener('user-updated', handleUserUpdate);

    return () => {
      window.removeEventListener('user-updated', handleUserUpdate);
    };
  }, [authState.user]);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationAnchorEl(null);
  };

  // Function to get profile image URL
  const getProfileImageUrl = () => {
    return profileImageUrl;
  };
  
  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!authState.user?.fullName) return '?';
    return authState.user.fullName
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  const handleNavigateToSettings = () => {
    handleMenuClose();
    // Will use react-router to navigate
  };
  
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <School sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            ISCP Learning Management System
          </Typography>
        </Box>
        
        {authState.isAuthenticated && authState.user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              onClick={handleNotificationsOpen}
            >
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton 
              onClick={handleProfileMenuOpen}
              sx={{ ml: 1 }}
            >
              <Avatar 
                src={getProfileImageUrl()} 
                alt={authState.user.fullName}
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: !profileImageUrl ? 'primary.dark' : undefined 
                }}
              >
                {!profileImageUrl && getUserInitials()}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 200 }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {authState.user.fullName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {authState.user.email}
                </Typography>
              </Box>
              <Divider />
              <MenuItem 
                component={Link} 
                to={authState.user?.role === 'admin' 
                  ? "/admin/settings" 
                  : authState.user?.role === 'teacher' 
                    ? "/faculty/settings" 
                    : "/settings"} 
                onClick={handleMenuClose}
              >
                <Settings fontSize="small" sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <ExitToApp fontSize="small" sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
            
            <Menu
              anchorEl={notificationAnchorEl}
              open={Boolean(notificationAnchorEl)}
              onClose={handleNotificationsClose}
              PaperProps={{
                elevation: 3,
                sx: { minWidth: 320, maxWidth: 320 }
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Notifications
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleNotificationsClose}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    New assignment posted in Advanced Programming
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 hours ago
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Grade posted for Database Design midterm
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Yesterday
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem onClick={handleNotificationsClose}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Class schedule updated for next week
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    2 days ago
                  </Typography>
                </Box>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">Login</Button>
            <Button color="inherit" component={Link} to="/register">Register</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 