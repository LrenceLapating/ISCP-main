/**
 * AdminLayout.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 1, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Admin layout component providing navigation sidebar,
 * header, and consistent layout structure for administrator pages.
 */

import React, { ReactNode, useState, useEffect } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Badge,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  useTheme as useMuiTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications,
  Logout,
  AdminPanelSettings,
  SupervisedUserCircle,
  LibraryBooks,
  Announcement,
  Archive,
  CloudUpload,
  Settings,
  Search as SearchIcon,
  DomainVerification,
  Storage,
  LockPerson,
  Message
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import adminService from '../services/AdminService';
import AdminNotificationMenu from './AdminNotificationMenu';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const drawerWidth = 240;

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const { authState, logout } = useAuth();
  const { user } = authState;
  const muiTheme = useMuiTheme();
  const { mode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  
  // Theme-dependent colors
  const bgColor = mode === 'dark' ? '#0a1128' : '#ffffff';
  const textColor = mode === 'dark' ? '#ffffff' : '#212121';
  const textColorSecondary = mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)';
  const borderColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const hoverBgColor = mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const activeNavBgColor = mode === 'dark' ? 'rgba(25, 118, 210, 0.15)' : 'rgba(25, 118, 210, 0.08)';
  const activeNavHoverBgColor = mode === 'dark' ? 'rgba(25, 118, 210, 0.25)' : 'rgba(25, 118, 210, 0.15)';
  
  // Fetch user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userSettings = await adminService.getUserSettings();
        if (userSettings) {
          if (userSettings.profilePicture) {
            setProfilePicture(userSettings.profilePicture);
          }
          setFirstName(userSettings.firstName || '');
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    };

    loadUserProfile();
  }, []);

  // Listen for user profile updates
  useEffect(() => {
    const handleUserUpdated = () => {
      // Reload user profile when it's updated
      adminService.getUserSettings().then(settings => {
        if (settings) {
          if (settings.profilePicture) {
            setProfilePicture(settings.profilePicture);
          }
          setFirstName(settings.firstName || '');
        }
      });
    };

    // Add event listener
    window.addEventListener('user-updated', handleUserUpdated);
    
    // Clean up
    return () => {
      window.removeEventListener('user-updated', handleUserUpdated);
    };
  }, []);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navigationItems = [
    { 
      path: '/admin/dashboard', 
      text: 'Dashboard', 
      icon: <AdminPanelSettings />, 
      active: location.pathname === '/admin/dashboard' 
    },
    { 
      path: '/admin/users', 
      text: 'User Management', 
      icon: <SupervisedUserCircle />, 
      active: location.pathname.includes('/admin/users') 
    },
    { 
      path: '/admin/courses', 
      text: 'Course Management', 
      icon: <LibraryBooks />, 
      active: location.pathname.includes('/admin/courses') 
    },
    { 
      path: '/admin/messages', 
      text: 'Messages', 
      icon: <Message />, 
      active: location.pathname.includes('/admin/messages') 
    },
    { 
      path: '/admin/announcements', 
      text: 'Announcements', 
      icon: <Announcement />, 
      active: location.pathname.includes('/admin/announcements') 
    },
    { 
      path: '/admin/archives', 
      text: 'Academic Archives', 
      icon: <Archive />, 
      active: location.pathname.includes('/admin/archives') 
    },
    { 
      path: '/admin/system', 
      text: 'System Monitor', 
      icon: <Storage />, 
      active: location.pathname.includes('/admin/system')
    },
    { 
      path: '/admin/settings', 
      text: 'Settings', 
      icon: <Settings />, 
      active: location.pathname.includes('/admin/settings') 
    }
  ];
  
  const drawer = (
    <Box sx={{ bgcolor: bgColor, color: textColor, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ 
        p: 2,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid ${borderColor}`
      }}>
        <AdminPanelSettings sx={{ mr: 1.5, fontSize: 28, color: muiTheme.palette.primary.main }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          ISCP Admin
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1 }}>
        {navigationItems.map((item) => (
          <ListItem 
            key={item.text}
            component={RouterLink} 
            to={item.path}
            sx={{ 
              py: 1.5,
              px: 3,
              color: item.active ? textColor : textColorSecondary,
              bgcolor: item.active ? activeNavBgColor : 'transparent',
              '&:hover': { 
                bgcolor: item.active ? activeNavHoverBgColor : hoverBgColor,
                color: textColor,
              },
              borderLeft: item.active ? `4px solid ${muiTheme.palette.primary.main}` : '4px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ 
              color: item.active ? muiTheme.palette.primary.main : textColorSecondary,
              minWidth: 40 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontSize: '0.9rem',
                fontWeight: item.active ? 600 : 400 
              }}
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2, borderTop: `1px solid ${borderColor}` }}>
        <ListItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5,
            px: 3,
            color: textColorSecondary,
            '&:hover': { 
              bgcolor: hoverBgColor,
              color: textColor,
            },
            cursor: 'pointer',
            borderRadius: 1
          }}
        >
          <ListItemIcon sx={{ color: textColorSecondary, minWidth: 40 }}>
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
      bgcolor: bgColor
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          boxShadow: 'none',
          bgcolor: bgColor,
          borderBottom: `1px solid ${borderColor}`
        }}
        elevation={0}
      >
        <Toolbar sx={{ display: 'flex', padding: 0, backgroundColor: bgColor, minHeight: 64 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ display: { md: 'none' }, color: textColor }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              fontWeight: 'bold', 
              color: textColor,
              flexGrow: 1,
              ml: { xs: 1, md: 0 }
            }}
          >
            {title}
          </Typography>
          
          <AdminNotificationMenu />
          
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: bgColor }}>
            <Avatar
              src={profilePicture}
              alt={firstName || "Admin"}
              sx={{ width: 40, height: 40 }}
            >
              {!profilePicture && (firstName ? firstName.charAt(0) : 'A')}
            </Avatar>
            <Box sx={{ ml: 1, display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ color: textColor, fontWeight: 500, lineHeight: 1.2 }}>
                {firstName || "Admin"}
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
          bgcolor: bgColor,
          overflow: 'hidden'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Box sx={{ 
          flexGrow: 1, 
          bgcolor: bgColor, 
          color: textColor, 
          width: '100%',
          backgroundImage: 'none'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout; 