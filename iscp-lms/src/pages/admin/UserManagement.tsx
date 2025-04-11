import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, MenuItem, FormControl, InputLabel,
  Select, Chip, Avatar, SelectChangeEvent, Tooltip, useTheme, alpha,
  Grid as MuiGrid, CircularProgress, Snackbar, Alert
} from '@mui/material';
import {
  Edit, Delete, Refresh, Search, FilterList, CheckCircle,
  Block, SupervisedUserCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import adminService from '../../services/AdminService';

// Create custom Grid components to avoid TypeScript errors
const Grid = MuiGrid;
const GridItem = (props: any) => <MuiGrid {...props} />;

// User type definition
interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  campus: string;
  status: 'active' | 'inactive';
  profileImage?: string;
}

// Sample campus data
const campuses = [
  'All Campuses', 'Biringan Campus', 'Wakanda Campus', 'Atlantis Campus', 
  'El Dorado Campus', 'Asgard Campus'
];

const UserManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [campusFilter, setCampusFilter] = useState('All Campuses');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Notification state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'error' | 'warning' | 'info' | 'success'
  });
  
  // Create/Edit user dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'student',
    campus: 'Main Campus',
    status: 'active'
  });
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  
  // State for tracking ongoing operations
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});
  
  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const usersData = await adminService.getUsers();
        setUsers(usersData);
        console.log('Fetched users:', usersData);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        let errorMessage = 'Failed to load users from database. Please check your connection and try again.';
        
        if (err.response && err.response.status === 404) {
          errorMessage = 'User listing API endpoint was not found. This may not be implemented in the backend yet.';
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
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
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter);
    }
    
    setFilteredUsers(result);
  }, [users, searchQuery, roleFilter, campusFilter, statusFilter]);
  
  // Open edit user dialog
  const handleEditUser = (user: User) => {
    const userId = `edit-${user.id}`;
    setActionInProgress(prev => ({ ...prev, [userId]: true }));
    
    setIsEditing(true);
    setCurrentUser({ ...user });
    setOpenDialog(true);
    
    // Remove the loading state after opening the dialog
    setTimeout(() => {
      setActionInProgress(prev => ({ ...prev, [userId]: false }));
    }, 300);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCurrentUser(prev => ({ ...prev, [name]: value }));
  };
  
  // Save user (create or update)
  const handleSaveUser = async () => {
    if (!currentUser.name || !currentUser.email || !currentUser.role || !currentUser.campus) {
      showNotification('All fields are required', 'error');
      return;
    }
    
    if (isEditing && currentUser.id) {
      try {
        setLoading(true);
        // Update user in the backend
        const updatedUser = await adminService.updateUser({
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role as 'student' | 'teacher' | 'admin',
          campus: currentUser.campus,
          status: currentUser.status || 'active'
        });
        
        // Update the UI
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === currentUser.id ? { ...user, ...currentUser as User } : user
          )
        );
        
        showNotification(`User ${currentUser.name} updated successfully`, 'success');
      } catch (error: any) {
        console.error('Error updating user:', error);
        showNotification(error.message || 'Failed to update user', 'error');
      } finally {
        setLoading(false);
      }
    }
    
    handleCloseDialog();
  };
  
  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };
  
  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };
  
  // Handle Snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show notification
  const showNotification = (message: string, severity: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  // Toggle user status (active/inactive)
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const userId = `status-${user.id}`;
    
    // Set this specific user action to loading
    setActionInProgress(prev => ({ ...prev, [userId]: true }));
    
    try {
      await adminService.toggleUserStatus(user.id, newStatus);
      
      // Update the UI after successful API call
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      );
      
      showNotification(
        `User ${user.name} has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
        'success'
      );
    } catch (err: any) {
      console.error('Error toggling user status:', err);
      showNotification(
        err.message || `Failed to update status for ${user.name}. This feature may not be implemented yet in the backend.`,
        'error'
      );
    } finally {
      setActionInProgress(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Confirm delete user
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    setDeleteInProgress(true);
    const userId = `delete-${userToDelete.id}`;
    setActionInProgress(prev => ({ ...prev, [userId]: true }));
    
    try {
      await adminService.deleteUser(userToDelete.id);
      
      // Update the UI after successful deletion
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      showNotification(`User ${userToDelete.name} has been deleted.`, 'success');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      showNotification(
        err.message || `Failed to delete ${userToDelete.name}. This feature may not be implemented yet in the backend.`,
        'error'
      );
    } finally {
      setDeleteInProgress(false);
      setActionInProgress(prev => ({ ...prev, [userId]: false }));
      handleCloseDeleteDialog();
    }
  };
  
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const usersData = await adminService.getUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error refreshing users:', err);
      setError('Failed to refresh users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <AdminLayout title="User Management">
      <Box sx={{ py: 3 }}>
        {/* Header with controls */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 3 
        }}>
          <Typography variant="h5" component="h1" fontWeight="bold" color="white">
            User Management
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
                bgcolor: 'rgba(255, 255, 255, 0.05)'
              }
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
        
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
            <GridItem xs={12} sm={4} md={5} lg={6}>
              <TextField
                placeholder="Search users..."
                variant="outlined"
                fullWidth
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.5)' }} />,
                  sx: { 
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.25)'
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main
                    }
                  }
                }}
                sx={{ bgcolor: 'rgba(0, 0, 0, 0.2)' }}
              />
            </GridItem>
            
            <GridItem xs={12} sm={8} md={7} lg={6}>
              <Box sx={{ display: 'flex', gap: 2 }}>
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
                    <MenuItem value="teacher">Teacher</MenuItem>
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
                  <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ 
                      color: 'white',
                      bgcolor: 'rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center', color: 'white' }}>
              <Typography color="error">{error}</Typography>
              <Button 
                variant="outlined" 
                onClick={handleRefresh}
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  '& th': { 
                    fontWeight: 'bold', 
                    bgcolor: 'rgba(0, 0, 0, 0.2)' 
                  } 
                }}>
                  <TableCell sx={{ color: 'white' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white' }}>Email</TableCell>
                  <TableCell sx={{ color: 'white' }}>Role</TableCell>
                  <TableCell sx={{ color: 'white' }}>Campus</TableCell>
                  <TableCell sx={{ color: 'white' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} sx={{ 
                      '& td': { 
                        borderColor: 'rgba(255, 255, 255, 0.1)' 
                      },
                      '&:hover': { 
                        bgcolor: 'rgba(255, 255, 255, 0.1)' 
                      } 
                    }}>
                      <TableCell sx={{ color: 'white', display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: user.role === 'admin' 
                              ? theme.palette.error.main 
                              : user.role === 'teacher' 
                                ? theme.palette.warning.main 
                                : theme.palette.primary.main,
                            mr: 1.5
                          }}
                          src={user.profileImage}
                        >
                          {user.name.charAt(0)}
                        </Avatar>
                        {user.name}
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{user.email}</TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Chip 
                          label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          size="small"
                          sx={{ 
                            bgcolor: user.role === 'admin' 
                              ? alpha(theme.palette.error.main, 0.1) 
                              : user.role === 'teacher' 
                                ? alpha(theme.palette.warning.main, 0.1) 
                                : alpha(theme.palette.primary.main, 0.1),
                            color: user.role === 'admin' 
                              ? theme.palette.error.main 
                              : user.role === 'teacher' 
                                ? theme.palette.warning.main 
                                : theme.palette.primary.main,
                            border: '1px solid',
                            borderColor: user.role === 'admin' 
                              ? alpha(theme.palette.error.main, 0.3) 
                              : user.role === 'teacher' 
                                ? alpha(theme.palette.warning.main, 0.3) 
                                : alpha(theme.palette.primary.main, 0.3)
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{user.campus}</TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <Chip 
                          label={user.status === 'active' ? 'Active' : 'Inactive'}
                          size="small"
                          sx={{ 
                            bgcolor: user.status === 'active' 
                              ? alpha(theme.palette.success.main, 0.1) 
                              : alpha(theme.palette.error.main, 0.1),
                            color: user.status === 'active' 
                              ? theme.palette.success.main 
                              : theme.palette.error.main,
                            border: '1px solid',
                            borderColor: user.status === 'active' 
                              ? alpha(theme.palette.success.main, 0.3) 
                              : alpha(theme.palette.error.main, 0.3),
                          }}
                          icon={
                            user.status === 'active' 
                              ? <CheckCircle fontSize="small" /> 
                              : <Block fontSize="small" />
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(user)}
                            disabled={actionInProgress[`edit-${user.id}`]}
                            sx={{ color: theme.palette.info.main }}
                          >
                            {actionInProgress[`edit-${user.id}`] ? (
                              <CircularProgress size={16} sx={{ color: 'inherit' }} />
                            ) : (
                              <Edit fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleStatus(user)}
                            disabled={actionInProgress[`status-${user.id}`]}
                            sx={{ 
                              color: user.status === 'active' 
                                ? theme.palette.warning.main 
                                : theme.palette.success.main 
                            }}
                          >
                            {actionInProgress[`status-${user.id}`] ? (
                              <CircularProgress size={16} sx={{ color: 'inherit' }} />
                            ) : user.status === 'active' ? (
                              <Block fontSize="small" />
                            ) : (
                              <CheckCircle fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDeleteDialog(user)}
                            disabled={actionInProgress[`delete-${user.id}`]}
                            sx={{ color: theme.palette.error.main }}
                          >
                            {actionInProgress[`delete-${user.id}`] ? (
                              <CircularProgress size={16} sx={{ color: 'inherit' }} />
                            ) : (
                              <Delete fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ color: 'white', textAlign: 'center', py: 3 }}>
                      {searchQuery || roleFilter !== 'all' || campusFilter !== 'All Campuses' || statusFilter !== 'all' ? (
                        <>
                          No users match the current filters.
                          <Button 
                            size="small" 
                            onClick={() => {
                              setSearchQuery('');
                              setRoleFilter('all');
                              setCampusFilter('All Campuses');
                              setStatusFilter('all');
                            }}
                            sx={{ ml: 2, color: theme.palette.primary.main }}
                          >
                            Clear Filters
                          </Button>
                        </>
                      ) : (
                        'No users found in the database. The user table appears to be empty.'
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        
        {/* Edit User Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {isEditing ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ py: 1 }}>
              <TextField
                name="name"
                label="Full Name"
                value={currentUser.name || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <TextField
                name="email"
                label="Email"
                value={currentUser.email || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={currentUser.role || 'student'}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="student">Student</MenuItem>
                  <MenuItem value="teacher">Teacher</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Campus</InputLabel>
                <Select
                  name="campus"
                  value={currentUser.campus || 'Biringan Campus'}
                  onChange={handleSelectChange}
                >
                  {campuses.slice(1).map(campus => (
                    <MenuItem key={campus} value={campus}>{campus}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={currentUser.status || 'active'}
                  onChange={handleSelectChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSaveUser} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog} maxWidth="xs">
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the user "{userToDelete?.name}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDeleteDialog} disabled={deleteInProgress}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDelete} 
              color="error" 
              variant="contained"
              disabled={deleteInProgress}
            >
              {deleteInProgress ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
};

export default UserManagement; 