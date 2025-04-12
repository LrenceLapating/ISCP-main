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
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Notifications,
  Logout,
  Dashboard as DashboardIcon,
  LibraryBooks,
  Schedule,
  Assignment,
  Grade,
  Email,
  Settings,
  Book,
  School
} from '@mui/icons-material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import studentService from '../services/StudentService';
import NotificationDropdown from './common/NotificationDropdown';

interface StudentLayoutProps {
  children: ReactNode;
  title: string;
}

const drawerWidth = 240;

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, title }) => {
  const { authState, logout } = useAuth();
  const { user } = authState;
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  
  // Fetch user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userSettings = await studentService.getUserSettings();
        if (userSettings) {
          if (userSettings.profile_picture) {
            setProfilePicture(userSettings.profile_picture);
          }
          setFirstName(userSettings.first_name || '');
        }
      } catch (error) {
        console.error('Failed to load user profile', error);
      }
    };

    loadUserProfile();
  }, []);
  
  // Listen for user updates
  useEffect(() => {
    // Update from props when authState changes
    setCurrentUser(user);
    
    // Function to handle the user-updated event
    const handleUserUpdated = () => {
      console.log('User updated event detected');
      // Reload user settings when profile is updated
      studentService.getUserSettings().then(settings => {
        if (settings) {
          if (settings.profile_picture) {
            setProfilePicture(settings.profile_picture);
          }
          setFirstName(settings.first_name || '');
        }
      }).catch(error => {
        console.error('Error loading updated user settings:', error);
      });
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const updatedUser = JSON.parse(storedUser);
          console.log('Updated user from localStorage:', updatedUser);
          setCurrentUser(updatedUser);
        } catch (error) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    };
    
    // Function to handle forced profile updates
    const handleForceProfileUpdate = (event: CustomEvent) => {
      console.log('Force profile update event received:', event.detail);
      if (event.detail?.profileUrl) {
        setProfilePicture(event.detail.profileUrl + '?t=' + new Date().getTime());
      }
    };
    
    // Add event listeners
    window.addEventListener('user-updated', handleUserUpdated);
    window.addEventListener('force-profile-update', handleForceProfileUpdate as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('user-updated', handleUserUpdated);
      window.removeEventListener('force-profile-update', handleForceProfileUpdate as EventListener);
    };
  }, [user]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const navigationItems = [
    { 
      path: '/dashboard', 
      text: t('dashboard'), 
      icon: <DashboardIcon />, 
      active: location.pathname === '/dashboard' 
    },
    { 
      path: '/courses', 
      text: language === 'English' ? 'My Courses' : 'Mga Kurso Ko', 
      icon: <LibraryBooks />, 
      active: location.pathname.includes('/courses') 
    },
    { 
      path: '/assignments', 
      text: t('assignments'), 
      icon: <Assignment />, 
      active: location.pathname.includes('/assignments') 
    },
    { 
      path: '/materials', 
      text: t('materials'), 
      icon: <Book />, 
      active: location.pathname.includes('/materials') 
    },
    { 
      path: '/grades', 
      text: t('grades'), 
      icon: <Grade />, 
      active: location.pathname.includes('/grades') 
    },
    { 
      path: '/messages', 
      text: t('messages'), 
      icon: <Email />, 
      active: location.pathname.includes('/messages') 
    },
    { 
      path: '/settings', 
      text: t('settings'), 
      icon: <Settings />, 
      active: location.pathname.includes('/settings') 
    }
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
          {language === 'English' ? 'ISCP Student' : 'ISCP Estudyante'}
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
              color: item.active ? '#fff' : 'rgba(255, 255, 255, 0.7)',
              bgcolor: item.active ? 'rgba(25, 118, 210, 0.15)' : 'transparent',
              '&:hover': { 
                bgcolor: item.active ? 'rgba(25, 118, 210, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
              },
              borderLeft: item.active ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon sx={{ 
              color: item.active ? theme.palette.primary.main : 'rgba(255, 255, 255, 0.7)',
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
            primary={t('logout')}
            primaryTypographyProps={{ 
              fontSize: '0.9rem'
            }}
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
          
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              fontWeight: 600,
              color: '#fff',
              flexGrow: 1
            }}
          >
            {title}
          </Typography>
          
          {/* Right Icons */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <NotificationDropdown />
            
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Avatar 
                src={profilePicture ? 
                  (profilePicture.startsWith('http') 
                    ? profilePicture 
                    : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${profilePicture}`)
                  : undefined
                }
                sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: theme.palette.primary.main,
                  border: '2px solid rgba(255, 255, 255, 0.2)' 
                }}
              >
                {!profilePicture && (firstName ? firstName.charAt(0) : (currentUser?.fullName ? currentUser.fullName.charAt(0) : 'S'))}
              </Avatar>
              <Typography 
                variant="subtitle2" 
                sx={{ ml: 1, display: { xs: 'none', sm: 'block' }, color: '#fff' }}
                fontWeight="medium"
              >
                {firstName || currentUser?.fullName || 'Student User'}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#0a1128',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: '#0a1128',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: 0 },
          mt: '64px',
          bgcolor: '#0a1128',
          color: 'white',
          overflowY: 'auto',
          height: 'calc(100vh - 64px)'
        }}
      >
        <Container maxWidth="xl" sx={{ py: 3, height: '100%' }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default StudentLayout; 