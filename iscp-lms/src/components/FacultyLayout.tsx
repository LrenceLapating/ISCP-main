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
  Container,
  InputBase
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications,
  Dashboard,
  Book,
  Assignment,
  People,
  Forum,
  DescriptionOutlined,
  AccessTime,
  Grade,
  Message,
  Settings,
  Logout,
  School,
  Search as SearchIcon,
  Email
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import facultyService from '../services/FacultyService';
import FacultyNotificationMenu from './FacultyNotificationMenu';

interface FacultyLayoutProps {
  children: ReactNode;
  title: string;
}

const drawerWidth = 240;

const FacultyLayout: React.FC<FacultyLayoutProps> = ({ children, title }) => {
  const { authState, logout } = useAuth();
  const { user } = authState;
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string>('');

  // Fetch user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userSettings = await facultyService.getUserSettings();
        if (userSettings) {
          if (userSettings.profilePicture) {
            setProfilePicture(userSettings.profilePicture);
          }
          setFirstName(userSettings.firstName || '');
          setLastName(userSettings.lastName || '');
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
      facultyService.getUserSettings().then(settings => {
        if (settings) {
          if (settings.profilePicture) {
            setProfilePicture(settings.profilePicture);
          }
          setFirstName(settings.firstName || '');
          setLastName(settings.lastName || '');
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

  // Legacy user profile handling
  useEffect(() => {
    if (user?.fullName && !firstName && !lastName) {
      const nameParts = user.fullName.split(' ');
      setFirstName(nameParts[0]);
      if (nameParts.length > 1) {
        setLastName(nameParts[nameParts.length - 1]);
      }
    }
  }, [user, firstName, lastName]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const facultyNavigationItems = [
    { icon: <Dashboard />, text: "Dashboard", path: "/faculty/dashboard" },
    { icon: <Book />, text: "My Courses", path: "/faculty/courses" },
    { icon: <Assignment />, text: "Assignments", path: "/faculty/assignments" },
    { icon: <DescriptionOutlined />, text: "Materials", path: "/faculty/materials" },
    { icon: <People />, text: "Students", path: "/faculty/students" },
    { icon: <Email />, text: "Messages", path: "/faculty/messages" },
    { icon: <Settings />, text: "Settings", path: "/faculty/settings" }
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
        {facultyNavigationItems.map((item) => (
          <ListItem 
            key={item.text}
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
          
          <FacultyNotificationMenu />
          
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#0a1128' }}>
            <Avatar
              src={profilePicture ? 
                (profilePicture.startsWith('http') 
                  ? profilePicture 
                  : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${profilePicture}`)
                : undefined
              }
              alt={firstName ? `${firstName} ${lastName}` : (user?.fullName || 'User')}
              sx={{ width: 40, height: 40 }}
            >
              {!profilePicture && (firstName ? firstName.charAt(0) : (user?.fullName ? user.fullName.charAt(0) : 'F'))}
            </Avatar>
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

export default FacultyLayout; 