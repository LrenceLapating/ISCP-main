/**
 * RoleManagement.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 12, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator role management interface for creating and assigning
 * user roles and permissions across the LMS platform.
 */

import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, MenuItem, FormControl, InputLabel,
  Select, Chip, Avatar, SelectChangeEvent, Tooltip, useTheme, alpha,
  Grid as MuiGrid, TextField, Checkbox, FormControlLabel, Switch, List, ListItem,
  ListItemText, ListItemIcon, Divider
} from '@mui/material';
import {
  SecurityUpdate, Edit, Save, Cancel, Search, FilterList, Check,
  AdminPanelSettings, Person, School, SupervisedUserCircle, Settings,
  ManageAccounts, Security, LockPerson, VpnKey
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';

// Create custom Grid components to avoid TypeScript errors
const Grid = MuiGrid;
const GridItem = (props: any) => <MuiGrid {...props} />;

// User role interface
interface UserRole {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  accessLevel: 'basic' | 'advanced' | 'full';
  campus: string;
  permissions: {
    canViewStudents: boolean;
    canEditStudents: boolean;
    canViewCourses: boolean;
    canEditCourses: boolean;
    canViewAnnouncements: boolean;
    canPostAnnouncements: boolean;
    canViewReports: boolean;
    canAccessSystem: boolean;
    canAssignRoles: boolean;
    canManageCampus: boolean;
  };
}

// Permission interfaces
interface Permission {
  id: string;
  name: string;
  description: string;
  default: {
    student: boolean;
    teacher: boolean;
    admin: boolean;
  };
  category: 'user' | 'content' | 'system';
}

// Sample users with roles
const initialUsers: UserRole[] = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@iscp.edu.ph',
    role: 'student',
    accessLevel: 'basic',
    campus: 'Biniliran Campus',
    permissions: {
      canViewStudents: false,
      canEditStudents: false,
      canViewCourses: true,
      canEditCourses: false,
      canViewAnnouncements: true,
      canPostAnnouncements: false,
      canViewReports: false,
      canAccessSystem: false,
      canAssignRoles: false,
      canManageCampus: false
    }
  },
  {
    id: 3,
    name: 'Robert Johnson',
    email: 'robert.johnson@iscp.edu.ph',
    role: 'teacher',
    accessLevel: 'advanced',
    campus: 'Main Campus',
    permissions: {
      canViewStudents: true,
      canEditStudents: true,
      canViewCourses: true,
      canEditCourses: true,
      canViewAnnouncements: true,
      canPostAnnouncements: true,
      canViewReports: true,
      canAccessSystem: false,
      canAssignRoles: false,
      canManageCampus: false
    }
  },
  {
    id: 6,
    name: 'Admin User',
    email: 'admin@iscp.edu.ph',
    role: 'admin',
    accessLevel: 'full',
    campus: 'Main Campus',
    permissions: {
      canViewStudents: true,
      canEditStudents: true,
      canViewCourses: true,
      canEditCourses: true,
      canViewAnnouncements: true,
      canPostAnnouncements: true,
      canViewReports: true,
      canAccessSystem: true,
      canAssignRoles: true,
      canManageCampus: true
    }
  }
];

// Available permissions
const availablePermissions: Permission[] = [
  {
    id: 'canViewStudents',
    name: 'View Students',
    description: 'Can view student profiles and information',
    default: {
      student: false,
      teacher: true,
      admin: true
    },
    category: 'user'
  },
  {
    id: 'canEditStudents',
    name: 'Edit Students',
    description: 'Can edit student information and profiles',
    default: {
      student: false,
      teacher: true,
      admin: true
    },
    category: 'user'
  },
  {
    id: 'canViewCourses',
    name: 'View Courses',
    description: 'Can view course details and materials',
    default: {
      student: true,
      teacher: true,
      admin: true
    },
    category: 'content'
  },
  {
    id: 'canEditCourses',
    name: 'Edit Courses',
    description: 'Can create and edit courses',
    default: {
      student: false,
      teacher: true,
      admin: true
    },
    category: 'content'
  },
  {
    id: 'canViewAnnouncements',
    name: 'View Announcements',
    description: 'Can view system and course announcements',
    default: {
      student: true,
      teacher: true,
      admin: true
    },
    category: 'content'
  },
  {
    id: 'canPostAnnouncements',
    name: 'Post Announcements',
    description: 'Can create and post announcements',
    default: {
      student: false,
      teacher: true,
      admin: true
    },
    category: 'content'
  },
  {
    id: 'canViewReports',
    name: 'View Reports',
    description: 'Can view system and analytics reports',
    default: {
      student: false,
      teacher: true,
      admin: true
    },
    category: 'system'
  },
  {
    id: 'canAccessSystem',
    name: 'System Access',
    description: 'Can access system settings and maintenance',
    default: {
      student: false,
      teacher: false,
      admin: true
    },
    category: 'system'
  },
  {
    id: 'canAssignRoles',
    name: 'Assign Roles',
    description: 'Can assign and modify user roles',
    default: {
      student: false,
      teacher: false,
      admin: true
    },
    category: 'system'
  },
  {
    id: 'canManageCampus',
    name: 'Manage Campuses',
    description: 'Can manage campus settings and cross-campus resources',
    default: {
      student: false,
      teacher: false,
      admin: true
    },
    category: 'system'
  }
];

// Campus options for filter
const campuses = [
  'All Campuses',
  'Main Campus: Undisclosed location, Philippines',
  'Biringan Campus',
  'Sun and Moon Campus',
  'Galactic Campus',
  'Atlantis Campus'
];

const RoleManagement: React.FC = () => {
  const theme = useTheme();
  
  // State for user roles
  const [users, setUsers] = useState<UserRole[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserRole[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('All Campuses');
  
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserRole | null>(null);
  const [tempPermissions, setTempPermissions] = useState<{[key: string]: boolean}>({});
  const [tempRole, setTempRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [tempAccessLevel, setTempAccessLevel] = useState<'basic' | 'advanced' | 'full'>('basic');
  
  // Filter users based on search and filters
  useEffect(() => {
    let result = [...users];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    
    // Apply campus filter
    if (campusFilter !== 'All Campuses') {
      result = result.filter(user => user.campus === campusFilter);
    }
    
    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter, campusFilter]);
  
  // Open edit dialog
  const handleEditUser = (user: UserRole) => {
    setCurrentUser(user);
    setTempRole(user.role);
    setTempAccessLevel(user.accessLevel);
    setTempPermissions({...user.permissions});
    setEditDialogOpen(true);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setCurrentUser(null);
  };
  
  // Handle role change
  const handleRoleChange = (e: SelectChangeEvent<string>) => {
    const newRole = e.target.value as 'student' | 'teacher' | 'admin';
    setTempRole(newRole);
    
    // Update permissions based on default for this role
    const updatedPermissions = {...tempPermissions};
    availablePermissions.forEach(permission => {
      updatedPermissions[permission.id] = permission.default[newRole];
    });
    
    // Set appropriate access level based on role
    let newAccessLevel: 'basic' | 'advanced' | 'full' = 'basic';
    if (newRole === 'admin') newAccessLevel = 'full';
    else if (newRole === 'teacher') newAccessLevel = 'advanced';
    
    setTempAccessLevel(newAccessLevel);
    setTempPermissions(updatedPermissions);
  };
  
  // Handle access level change
  const handleAccessLevelChange = (e: SelectChangeEvent<string>) => {
    setTempAccessLevel(e.target.value as 'basic' | 'advanced' | 'full');
  };
  
  // Handle permission change
  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setTempPermissions(prev => ({
      ...prev,
      [permissionId]: checked
    }));
  };
  
  // Save user role changes
  const handleSaveChanges = () => {
    if (!currentUser) return;
    
    const updatedUsers = users.map(user => {
      if (user.id === currentUser.id) {
        // Cast the permissions object to the correct type to ensure type safety
        const typedPermissions = tempPermissions as UserRole['permissions'];
        return {
          ...user,
          role: tempRole,
          accessLevel: tempAccessLevel,
          permissions: typedPermissions
        };
      }
      return user;
    });
    
    setUsers(updatedUsers as UserRole[]);
    handleCloseDialog();
  };
  
  // Get permission category label
  const getPermissionCategoryLabel = (category: string) => {
    switch (category) {
      case 'user':
        return 'User Management';
      case 'content':
        return 'Content Management';
      case 'system':
        return 'System Management';
      default:
        return 'Other Permissions';
    }
  };
  
  // Get icon for permission category
  const getPermissionCategoryIcon = (category: string) => {
    switch (category) {
      case 'user':
        return <Person />;
      case 'content':
        return <School />;
      case 'system':
        return <Settings />;
      default:
        return <VpnKey />;
    }
  };
  
  // Get chip color for roles
  const getRoleChipColor = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          bg: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
          border: alpha(theme.palette.error.main, 0.3)
        };
      case 'teacher':
        return {
          bg: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.main,
          border: alpha(theme.palette.warning.main, 0.3)
        };
      default:
        return {
          bg: alpha(theme.palette.primary.main, 0.1),
          color: theme.palette.primary.main,
          border: alpha(theme.palette.primary.main, 0.3)
        };
    }
  };
  
  // Get chip color for access levels
  const getAccessLevelChipColor = (level: string) => {
    switch (level) {
      case 'full':
        return {
          bg: alpha(theme.palette.error.main, 0.1),
          color: theme.palette.error.main,
          border: alpha(theme.palette.error.main, 0.3)
        };
      case 'advanced':
        return {
          bg: alpha(theme.palette.warning.main, 0.1),
          color: theme.palette.warning.main,
          border: alpha(theme.palette.warning.main, 0.3)
        };
      default:
        return {
          bg: alpha(theme.palette.success.main, 0.1),
          color: theme.palette.success.main,
          border: alpha(theme.palette.success.main, 0.3)
        };
    }
  };
  
  // Group permissions by category
  const groupedPermissions = availablePermissions.reduce<{[key: string]: Permission[]}>((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});
  
  return (
    <AdminLayout title="Role & Permission Management">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" color="white" mb={3}>
          Role & Permission Management
        </Typography>
        <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" mb={4}>
          Assign or change access levels of users (Student, Faculty, Admin)
        </Typography>
        
        {/* Filters */}
        <Paper sx={{ 
          p: 2, 
          mb: 3,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Grid container spacing={2} alignItems="center">
            <GridItem xs={12} sm={4} md={3}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                bgcolor: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: 1,
                pl: 2,
                pr: 1
              }}>
                <Search sx={{ color: 'rgba(255, 255, 255, 0.5)', mr: 1 }} />
                <TextField
                  placeholder="Search users..."
                  fullWidth
                  variant="standard"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    disableUnderline: true,
                    style: { color: 'white' }
                  }}
                />
              </Box>
            </GridItem>
            
            <GridItem xs={12} sm={8} md={9}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 120,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.25)'
                    }
                  }}
                >
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Role</InputLabel>
                  <Select
                    value={roleFilter}
                    label="Role"
                    onChange={(e) => setRoleFilter(e.target.value)}
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <MenuItem value="all">All Roles</MenuItem>
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="teacher">Faculty</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 150,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.25)'
                    }
                  }}
                >
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Campus</InputLabel>
                  <Select
                    value={campusFilter}
                    label="Campus"
                    onChange={(e) => setCampusFilter(e.target.value)}
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    {campuses.map(campus => (
                      <MenuItem key={campus} value={campus}>{campus}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </GridItem>
          </Grid>
        </Paper>
        
        {/* Users Table */}
        <TableContainer component={Paper} sx={{ 
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflowX: 'auto'
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ 
                '& th': { 
                  fontWeight: 'bold', 
                  bgcolor: 'rgba(0, 0, 0, 0.2)' 
                } 
              }}>
                <TableCell sx={{ color: 'white' }}>User</TableCell>
                <TableCell sx={{ color: 'white' }}>Role</TableCell>
                <TableCell sx={{ color: 'white' }}>Access Level</TableCell>
                <TableCell sx={{ color: 'white' }}>Campus</TableCell>
                <TableCell sx={{ color: 'white' }}>Permissions</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: 'primary.main', 
                          width: 36, 
                          height: 36,
                          mr: 1.5 
                        }}
                      >
                        {user.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 500 }}>
                          {user.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    <Chip 
                      label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      size="small"
                      sx={{ 
                        bgcolor: getRoleChipColor(user.role).bg,
                        color: getRoleChipColor(user.role).color,
                        border: '1px solid',
                        borderColor: getRoleChipColor(user.role).border
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    <Chip 
                      label={user.accessLevel.charAt(0).toUpperCase() + user.accessLevel.slice(1)}
                      size="small"
                      sx={{ 
                        bgcolor: getAccessLevelChipColor(user.accessLevel).bg,
                        color: getAccessLevelChipColor(user.accessLevel).color,
                        border: '1px solid',
                        borderColor: getAccessLevelChipColor(user.accessLevel).border
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>{user.campus}</TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {Object.entries(user.permissions)
                      .filter(([_, value]) => value === true)
                      .length} / {Object.keys(user.permissions).length} enabled
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Role & Permissions">
                      <IconButton 
                        onClick={() => handleEditUser(user)}
                        size="small"
                        sx={{ color: theme.palette.primary.main }}
                      >
                        <ManageAccounts />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Edit Dialog */}
        <Dialog 
          open={editDialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#111827',
              backgroundImage: 'none',
              color: 'white'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <Security sx={{ color: theme.palette.primary.main, mr: 1 }} />
            Edit User Role & Permissions
          </DialogTitle>
          
          <DialogContent sx={{ py: 3 }}>
            {currentUser && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'primary.main', 
                      width: 48, 
                      height: 48,
                      mr: 2 
                    }}
                  >
                    {currentUser.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" color="white">
                      {currentUser.name}
                    </Typography>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                      {currentUser.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <GridItem xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.15)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.25)'
                        }
                      }}
                    >
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Role</InputLabel>
                      <Select
                        value={tempRole}
                        label="Role"
                        onChange={handleRoleChange}
                        sx={{ color: 'white' }}
                      >
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="teacher">Faculty</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </FormControl>
                  </GridItem>
                  
                  <GridItem xs={12} md={6}>
                    <FormControl 
                      fullWidth
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.15)'
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.25)'
                        }
                      }}
                    >
                      <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Access Level</InputLabel>
                      <Select
                        value={tempAccessLevel}
                        label="Access Level"
                        onChange={handleAccessLevelChange}
                        sx={{ color: 'white' }}
                      >
                        <MenuItem value="basic">Basic</MenuItem>
                        <MenuItem value="advanced">Advanced</MenuItem>
                        <MenuItem value="full">Full Access</MenuItem>
                      </Select>
                    </FormControl>
                  </GridItem>
                </Grid>
                
                <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                  Permissions
                </Typography>
                
                <Paper sx={{ 
                  bgcolor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 1,
                  mb: 2
                }}>
                  {Object.entries(groupedPermissions).map(([category, permissions]) => (
                    <Box key={category}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        p: 1.5,
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        bgcolor: 'rgba(0, 0, 0, 0.3)'
                      }}>
                        <ListItemIcon sx={{ minWidth: 36, color: theme.palette.primary.main }}>
                          {getPermissionCategoryIcon(category)}
                        </ListItemIcon>
                        <Typography color="white" fontWeight="medium">
                          {getPermissionCategoryLabel(category)}
                        </Typography>
                      </Box>
                      <List dense>
                        {permissions.map(permission => (
                          <ListItem key={permission.id}>
                            <FormControlLabel
                              control={
                                <Checkbox 
                                  checked={tempPermissions[permission.id] || false}
                                  onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                  sx={{ 
                                    color: 'rgba(255, 255, 255, 0.7)', 
                                    '&.Mui-checked': { color: theme.palette.primary.main } 
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography color="white">{permission.name}</Typography>
                                  <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                                    {permission.description}
                                  </Typography>
                                </Box>
                              }
                              sx={{ width: '100%' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  ))}
                </Paper>
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', p: 2 }}>
            <Button 
              onClick={handleCloseDialog}
              startIcon={<Cancel />}
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveChanges}
              variant="contained"
              startIcon={<Save />}
              sx={{ 
                bgcolor: theme.palette.primary.main,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.8) }
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
};

export default RoleManagement; 