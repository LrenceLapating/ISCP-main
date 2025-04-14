/**
 * Register.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: March 28, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Registration component for new user accounts.
 * Handles form validation, role selection, and creates new user accounts.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper,
  IconButton,
  InputAdornment,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel,
  SelectChangeEvent,
  CssBaseline,
  Grid,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Lock, 
  Person, 
  Email, 
  School as SchoolIcon, 
  Visibility, 
  VisibilityOff, 
  AccountCircle,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'teacher',
    campus: 'Main Campus: Undisclosed location, Philippines'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('register');
  
  const { authState, register } = useAuth();
  const navigate = useNavigate();

  // Handle redirection after successful registration
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      const { role } = authState.user;
      if (role === 'teacher') {
        navigate('/faculty/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [authState.isAuthenticated, authState.user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    // Validate email
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await register(formData);
      // Navigation will happen in App component via ProtectedRoute
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    
    if (newValue === 'login') {
      navigate('/login');
    }
  };

  const campuses = [
    'Main Campus: Undisclosed location, Philippines',
    'Biringan Campus',
    'Sun and Moon Campus',
    'Galactic Campus',
    'Atlantis Campus'
  ];

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
            International State College of the Philippines
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
        
        {/* Right panel - Register form */}
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
            
            <Box sx={{ p: 3, pt: 4, overflow: 'auto' }}>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', mx: 'auto', width: 40, height: 40 }}>
                  <AccountCircle sx={{ fontSize: 24 }} />
                </Avatar>
                <Typography variant="h6" component="h1" sx={{ mt: 1 }}>
                  Create Account
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Join the ISCP learning community
                </Typography>
              </Box>
              
              {authState.error && (
                <Typography color="error" sx={{ mb: 2, textAlign: 'center', fontSize: '0.75rem' }}>
                  {authState.error}
                </Typography>
              )}
              
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="dense"
                  required
                  fullWidth
                  id="fullName"
                  label="Full Name"
                  name="fullName"
                  autoComplete="name"
                  autoFocus
                  value={formData.fullName}
                  onChange={handleInputChange}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  margin="dense"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <Grid container spacing={1}>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' }, pt: 1 }}>
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
                      value={formData.password}
                      onChange={handleInputChange}
                      error={!!errors.password}
                      helperText={errors.password}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="primary" fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' }, pt: 1 }}>
                    <TextField
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="primary" fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleToggleConfirmPasswordVisibility}
                              edge="end"
                              size="small"
                            >
                              {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                
                <Grid container spacing={1} sx={{ mt: 0.5 }}>
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <FormControl fullWidth sx={{ mt: 0.5 }} size="small">
                      <InputLabel id="role-select-label" sx={{ fontSize: '0.75rem' }}>Role</InputLabel>
                      <Select
                        labelId="role-select-label"
                        id="role"
                        name="role"
                        value={formData.role}
                        label="Role"
                        onChange={handleSelectChange}
                        size="small"
                      >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="teacher">Faculty/Teacher</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
                    <FormControl fullWidth sx={{ mt: 0.5 }} size="small">
                      <InputLabel id="campus-select-label" sx={{ fontSize: '0.75rem' }}>Campus</InputLabel>
                      <Select
                        labelId="campus-select-label"
                        id="campus"
                        name="campus"
                        value={formData.campus}
                        label="Campus"
                        onChange={handleSelectChange}
                        size="small"
                      >
                        {campuses.map((campus) => (
                          <MenuItem key={campus} value={campus}>{campus}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="secondary"
                  disabled={authState.loading}
                  sx={{ mt: 2, mb: 1, py: 0.5, fontSize: '0.85rem' }}
                  size="small"
                >
                  {authState.loading ? 'Creating Account...' : 'REGISTER'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                  <Typography variant="caption">
                    Already have an account?
                    <Link to="/login" style={{ textDecoration: 'none', marginLeft: '5px' }}>
                      <Typography component="span" variant="caption" color="primary">
                        Sign in
                      </Typography>
                    </Link>
                  </Typography>
                </Box>
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
        © {new Date().getFullYear()} ISCP International State College of the Philippines
      </Box>
    </Box>
  );
};

export default Register; 