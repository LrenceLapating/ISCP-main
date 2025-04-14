/**
 * PageLayout.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: March 30, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Common page layout component providing navigation sidebar,
 * header, and consistent layout structure for student pages.
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Avatar, 
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  useTheme,
  useMediaQuery,
  InputBase
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications,
  Search as SearchIcon,
  School,
  Dashboard as DashboardIcon,
  LibraryBooks,
  Schedule,
  Assignment,
  Grade,
  Email,
  Settings,
  Logout,
  MenuBook
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

interface PageLayoutProps {
  children: ReactNode;
  title: string;
}

const drawerWidth = 240;

const PageLayout: React.FC<PageLayoutProps> = ({ children, title }) => {
  const { authState, logout } = useAuth();
  const { user } = authState;
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | undefined>(undefined);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');

  // Function to check if a URL is a data URL
  const isDataUrl = (url: string): boolean => {
    return url?.startsWith('data:image/');
  };

  // Function to format profile image URL
  const formatProfileUrl = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    
    // If it's already a data URL or an absolute URL, return as is
    if (isDataUrl(url) || url.startsWith('http')) {
      return url;
    }
    
    // Otherwise, prepend the API base URL
    return `http://localhost:5000${url}`;
  };

  useEffect(() => {
    // Update profile image URL when user changes
    if (user?.profileImage) {
      setProfileImageUrl(formatProfileUrl(user.profileImage));
    } else if (user?.fullName) {
      setProfileImageUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=random`);
    }

    // Set name
    if (user?.fullName) {
      const nameParts = user.fullName.split(' ');
      setFirstName(nameParts[0]);
      if (nameParts.length > 1) {
        setLastName(nameParts[nameParts.length - 1]);
      }
    }

    // Listen for user update events
    const handleUserUpdate = () => {
      console.log('User update event received in PageLayout');
      // Force a rerender by getting the updated user from localStorage
      const userJson = localStorage.getItem('user');
      if (userJson) {
        try {
          const updatedUser = JSON.parse(userJson);
          if (updatedUser.profileImage) {
            setProfileImageUrl(formatProfileUrl(updatedUser.profileImage));
          }
          if (updatedUser.fullName) {
            const nameParts = updatedUser.fullName.split(' ');
            setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
              setLastName(nameParts[nameParts.length - 1]);
            }
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
  }, [user]);

  // Function to load user settings
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const studentService = (await import('../../services/StudentService')).default;
        const settings = await studentService.getUserSettings();
        if (settings && settings.first_name) {
          setFirstName(settings.first_name);
        }
        if (settings && settings.last_name) {
          setLastName(settings.last_name);
        }
        if (settings && settings.profile_picture) {
          setProfileImageUrl(formatProfileUrl(settings.profile_picture));
        }
      } catch (error) {
        console.error('Error loading user settings in PageLayout:', error);
      }
    };

    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { icon: <DashboardIcon />, text: "Dashboard", path: "/dashboard" },
    { icon: <LibraryBooks />, text: "My Courses", path: "/courses" },
    { icon: <Schedule />, text: "Schedule", path: "/schedule" },
    { icon: <Assignment />, text: "Assignments", path: "/assignments" },
    { icon: <MenuBook />, text: "Materials", path: "/materials" },
    { icon: <Grade />, text: "Grades", path: "/grades" },
    { icon: <Email />, text: "Messages", path: "/messages" },
    { icon: <Settings />, text: "Settings", path: "/settings" }
  ];

  const drawer = (
    <Box sx={{ bgcolor: '#0a1128', color: 'white', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <School sx={{ mr: 1.5, fontSize: 28 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          ISCP LMS
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        {navigationItems.map((item, index) => (
          <ListItem 
            key={index}
            component={RouterLink} 
            to={item.path}
            sx={{ 
              py: 1.5,
              px: 3,
              color: location.pathname === item.path ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              bgcolor: location.pathname === item.path ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
              '&:hover': { 
                bgcolor: location.pathname === item.path ? 'rgba(25, 118, 210, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
              },
              borderLeft: location.pathname === item.path ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.7)',
              minWidth: 40 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontSize: '0.9rem',
                fontWeight: location.pathname === item.path ? 600 : 400 
              }} 
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <ListItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5,
            px: 3,
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { 
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
            },
            cursor: 'pointer',
            borderRadius: 1
          }}
        >
          <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: 40 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ fontSize: '0.9rem' }} 
          />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100%',
      bgcolor: '#0a1128'
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 'none',
          bgcolor: '#0a1128',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
        elevation={0}
      >
        <Toolbar sx={{ display: 'flex', padding: 0, backgroundColor: '#0a1128', minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' }, color: '#fff' }}
          >
            <MenuIcon />
          </IconButton>
          
          <School sx={{ display: { xs: 'block', md: 'none' }, color: '#fff', mr: 1 }} />
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 'bold', 
              color: '#fff',
              display: { xs: 'block', md: 'none' }
            }}
          >
            ISCP LMS
          </Typography>
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 'bold', 
              color: '#fff',
              flexGrow: 1,
              ml: { xs: 1, md: 0 }
            }}
          >
            {title}
          </Typography>
          
          <Box
            sx={{
              position: 'relative',
              borderRadius: 1,
              bgcolor: 'rgba(0, 0, 0, 0.25)',
              '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.35)' },
              width: '300px',
              mr: 2,
              display: 'flex',
              height: 40,
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                p: '0 16px',
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
            </Box>
            <InputBase
              placeholder="Search…"
              sx={{
                color: '#fff',
                p: '8px 8px 8px 48px',
                width: '100%',
                height: '100%',
                '& input': {
                  color: '#fff'
                }
              }}
            />
          </Box>
          
          <IconButton 
            size="large" 
            aria-label="show new notifications" 
            color="inherit"
            sx={{ color: '#fff', mr: 1, p: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#0a1128' }}>
            <Avatar
              src={profileImageUrl}
              alt={user?.fullName || 'User'}
              sx={{ width: 40, height: 40 }}
            />
            <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ color: '#fff', fontWeight: 500, lineHeight: 1.2 }}>
                {firstName} {lastName}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#0a1128',
          overflow: 'hidden'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: '#0a1128', 
          color: '#fff', 
          width: '100%',
          backgroundImage: 'none'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default PageLayout; 