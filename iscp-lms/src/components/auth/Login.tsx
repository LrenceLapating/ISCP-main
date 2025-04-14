/**
 * Login.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: March 28, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Login component that handles user authentication.
 * Provides form for email/password login with validation and role-based redirection.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Checkbox, 
  FormControlLabel, 
  Paper,
  IconButton,
  InputAdornment,
  CssBaseline,
  Grid,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Lock, 
  School as SchoolIcon, 
  Email as EmailIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const { authState, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login({ email, password, remember });
  };

  // Handle redirection after successful login
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      const { role } = authState.user;
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'teacher') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [authState.isAuthenticated, authState.user, navigate]);

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    if (newValue === 'register') {
      navigate('/register');
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        background: 'linear-gradient(135deg, #0a1128 0%, #1c2e4a 100%)'
      }}
    >
      <CssBaseline />
      
      <Box 
        sx={{ 
          position: 'absolute', 
          top: 20, 
          right: 20,
          zIndex: 2
        }}
      >
        <Button
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'white'
            }
          }}
        >
          English
        </Button>
      </Box>
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          py: 4
        }}
      >
        {/* Left panel - Branding */}
        <Box 
          sx={{ 
            width: { xs: '100%', md: '50%' },
            textAlign: 'center',
            color: 'white',
            px: 4,
            mb: { xs: 4, md: 0 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <SchoolIcon sx={{ fontSize: 60, mb: 2, filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.3))' }} />
          <Typography variant="h2" component="h1" fontWeight="bold" sx={{ mb: 1 }}>
            ISCP
          </Typography>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Intergalactic State College of the Philippines
          </Typography>
          <Typography variant="body1" sx={{ mb: 5 }}>
            Learning Management System
          </Typography>
          
          <Box sx={{ width: '100%', maxWidth: 500 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  px: 2,
                  py: 1,
                  fontSize: '0.85rem'
                }}
              >
                Multi-Campus Connectivity
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  px: 2,
                  py: 1,
                  fontSize: '0.85rem'
                }}
              >
                Virtual Classrooms
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  px: 2,
                  py: 1,
                  fontSize: '0.85rem'
                }}
              >
                Resource Sharing
              </Button>
              <Button 
                variant="outlined" 
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  px: 2,
                  py: 1,
                  fontSize: '0.85rem'
                }}
              >
                Historical Archives
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Right panel - Login form */}
        <Box sx={{ width: { xs: '100%', md: '50%' }, display: 'flex', justifyContent: 'center' }}>
          <Paper
            elevation={4}
            sx={{
              width: '100%',
              maxWidth: 450,
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <Box sx={{ bgcolor: 'background.paper' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab 
                  value="login" 
                  label="LOGIN" 
                  icon={<LoginIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  value="register" 
                  label="REGISTER" 
                  icon={<PersonAddIcon />} 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3, pt: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', width: 50, height: 50 }}>
                  <Lock />
                </Avatar>
                <Typography variant="h5" component="h1" sx={{ mt: 2 }}>
                  Login
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Access your ISCP account
                </Typography>
              </Box>
              
              {authState.error && (
                <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                  {authState.error}
                </Typography>
              )}
              
              <Box component="form" noValidate onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  id="password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        value="remember" 
                        color="primary" 
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Remember me</Typography>}
                  />
                  
                  <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                    <Typography variant="body2" color="primary">
                      Forgot password?
                    </Typography>
                  </Link>
                </Box>
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={authState.loading}
                  sx={{ mt: 3, mb: 2, py: 1 }}
                >
                  {authState.loading ? 'Signing in...' : 'LOGIN'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
      
      {/* Footer */}
      <Box
        sx={{
          width: '100%',
          textAlign: 'center',
          py: 2,
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.875rem',
        }}
      >
        © {new Date().getFullYear()} ISCP Intergalactic Learning Management System
      </Box>
    </Box>
  );
};

export default Login;
