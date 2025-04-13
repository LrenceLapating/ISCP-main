import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, FormControl, InputLabel,
  Select, Chip, SelectChangeEvent, Tooltip, useTheme, alpha, MenuItem,
  CircularProgress, Snackbar, Alert
} from '@mui/material';
import {
  Add as AddIcon, Edit, Delete, Refresh,
  Check, Block, Search, Announcement
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import adminService, { Announcement as AnnouncementType } from '../../services/AdminService';

// Announcement interface extended from service type
interface AnnouncementUI extends AnnouncementType {
  status?: 'active' | 'inactive';
}

const AnnouncementManagement: React.FC = () => {
  const theme = useTheme();
  
  // State
  const [announcements, setAnnouncements] = useState<AnnouncementUI[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<AnnouncementUI[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<Record<string, boolean>>({});
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<AnnouncementUI>>({
    title: '',
    content: '',
    target: 'all',
    campus: 'All Campuses',
    status: 'active'
  });
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<AnnouncementUI | null>(null);
  
  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);
  
  // Fetch announcements from API
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnnouncements();
      
      // Log the raw data from API
      console.log('Raw data from API:', data);
      
      // Add a status property based on the absence of a real status field
      // and ensure target field is properly formatted
      const processedData = data.map(announcement => {
        // Check if the target field needs conversion from DB format
        let targetValue = announcement.target || 'all';
        
        return {
          ...announcement,
          target: targetValue,
          status: 'active' as 'active' | 'inactive'
        };
      });
      
      setAnnouncements(processedData);
      console.log('Processed announcements:', processedData);
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setError(err.message || 'Failed to load announcements');
      showNotification('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter announcements based on search and filters
  useEffect(() => {
    let result = [...announcements];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        announcement => 
          announcement.title.toLowerCase().includes(query) ||
          announcement.content.toLowerCase().includes(query)
      );
    }
    
    // Apply target filter
    if (targetFilter !== 'all') {
      result = result.filter(announcement => announcement.target === targetFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(announcement => announcement.status === statusFilter);
    }
    
    setFilteredAnnouncements(result);
  }, [announcements, searchQuery, targetFilter, statusFilter]);
  
  // Snackbar functions
  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Open dialog to create a new announcement
  const handleCreateAnnouncement = () => {
    setIsEditing(false);
    setCurrentAnnouncement({
      title: '',
      content: '',
      target: 'all',
      campus: 'All Campuses',
      status: 'active'
    });
    setDialogOpen(true);
  };
  
  // Open dialog to edit an announcement
  const handleEditAnnouncement = (announcement: AnnouncementUI) => {
    setIsEditing(true);
    setCurrentAnnouncement({ ...announcement });
    setDialogOpen(true);
  };
  
  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentAnnouncement(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    console.log(`Select changed: ${name} = ${value}`);
    setCurrentAnnouncement(prev => ({ ...prev, [name]: value }));
  };
  
  // Save announcement (create or update)
  const handleSaveAnnouncement = async () => {
    if (!currentAnnouncement.title || !currentAnnouncement.content) {
      showNotification('Title and content are required', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Make sure target is a string and is one of the valid values
      const targetValue = currentAnnouncement.target || 'all';
      console.log('Current target before save:', targetValue);
      
      if (isEditing && currentAnnouncement.id) {
        // Update existing announcement
        console.log('Updating announcement with data:', {
          id: currentAnnouncement.id,
          title: currentAnnouncement.title,
          content: currentAnnouncement.content,
          target: targetValue,
          campus: currentAnnouncement.campus
        });

        const updatedAnnouncement = await adminService.updateAnnouncement(
          currentAnnouncement.id,
          {
            title: currentAnnouncement.title,
            content: currentAnnouncement.content,
            target: targetValue,
            campus: currentAnnouncement.campus
          }
        );
        
        console.log('Received updated announcement:', updatedAnnouncement);
        
        setAnnouncements(prev =>
          prev.map(announcement =>
            announcement.id === currentAnnouncement.id 
              ? { ...updatedAnnouncement, status: 'active' } 
              : announcement
          )
        );
        
        showNotification('Announcement updated successfully');
      } else {
        // Create new announcement
        console.log('Creating announcement with data:', {
          title: currentAnnouncement.title,
          content: currentAnnouncement.content,
          target: targetValue,
          campus: currentAnnouncement.campus
        });

        const newAnnouncement = await adminService.createAnnouncement({
          title: currentAnnouncement.title || '',
          content: currentAnnouncement.content || '',
          target: targetValue,
          campus: currentAnnouncement.campus
        });
        
        console.log('Received new announcement:', newAnnouncement);
        
        setAnnouncements(prev => [
          ...prev, 
          { ...newAnnouncement, status: 'active' as 'active' | 'inactive' }
        ]);
        
        showNotification('Announcement created successfully');
      }
    } catch (err: any) {
      console.error('Error saving announcement:', err);
      showNotification(err.message || 'Failed to save announcement', 'error');
    } finally {
      setLoading(false);
      handleCloseDialog();
    }
  };
  
  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (announcement: AnnouncementUI) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };
  
  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAnnouncementToDelete(null);
  };
  
  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    
    try {
      setActionInProgress(prev => ({ ...prev, [`delete-${announcementToDelete.id}`]: true }));
      
      await adminService.deleteAnnouncement(announcementToDelete.id!);
      
      setAnnouncements(prev => 
        prev.filter(announcement => announcement.id !== announcementToDelete.id)
      );
      
      showNotification('Announcement deleted successfully');
    } catch (err: any) {
      console.error('Error deleting announcement:', err);
      showNotification(err.message || 'Failed to delete announcement', 'error');
    } finally {
      setActionInProgress(prev => ({ ...prev, [`delete-${announcementToDelete.id}`]: false }));
      handleCloseDeleteDialog();
    }
  };
  
  // Toggle announcement status (active/inactive)
  const handleToggleStatus = (announcement: AnnouncementUI) => {
    const newStatus = announcement.status === 'active' ? 'inactive' : 'active';
    
    // Update local state for UI only (we don't have this in database)
    setAnnouncements(prev =>
      prev.map(a =>
        a.id === announcement.id ? { ...a, status: newStatus } : a
      )
    );
    
    showNotification(`Announcement ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
  };
  
  return (
    <AdminLayout title="Announcement Management">
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
            Announcement Management
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateAnnouncement}
            sx={{
              bgcolor: theme.palette.success.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.success.main, 0.9)
              }
            }}
          >
            Create Announcement
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
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 2, 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <TextField
              placeholder="Search announcements..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.5)' }} />,
                sx: { 
                  color: 'white',
                  minWidth: '250px',
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
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Target</InputLabel>
                <Select
                  value={targetFilter}
                  label="Target"
                  onChange={(e) => setTargetFilter(e.target.value)}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.2)'
                  }}
                >
                  <MenuItem value="all">All Targets</MenuItem>
                  <MenuItem value="students">Students</MenuItem>
                  <MenuItem value="teachers">Teachers</MenuItem>
                  <MenuItem value="admins">Admins</MenuItem>
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
          </Box>
        </Paper>
        
        {/* Announcements Table */}
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
                <TableCell sx={{ color: 'white' }}>Title</TableCell>
                <TableCell sx={{ color: 'white' }}>Target</TableCell>
                <TableCell sx={{ color: 'white' }}>Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Status</TableCell>
                <TableCell sx={{ color: 'white' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAnnouncements.map((announcement) => (
                <TableRow key={announcement.id} sx={{ 
                  '& td': { 
                    borderColor: 'rgba(255, 255, 255, 0.1)' 
                  },
                  '&:hover': { 
                    bgcolor: 'rgba(255, 255, 255, 0.1)' 
                  } 
                }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                    {announcement.title}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {/* Log the target value for debugging */}
                    {(() => {
                      console.log('Announcement target value:', announcement.id, announcement.target, typeof announcement.target);
                      return null;
                    })()}
                    <Chip 
                      label={
                        !announcement.target ? 'All Users' :
                        announcement.target === 'all' ? 'All Users' :
                        announcement.target === 'students' ? 'Students' :
                        announcement.target === 'teachers' ? 'Teachers' : 
                        announcement.target === 'admins' ? 'Admins' : 
                        String(announcement.target)
                      }
                      size="small"
                      sx={{ 
                        bgcolor: 
                          !announcement.target || announcement.target === 'all' ? alpha(theme.palette.primary.main, 0.1) :
                          announcement.target === 'students' ? alpha(theme.palette.success.main, 0.1) :
                          announcement.target === 'teachers' ? alpha(theme.palette.info.main, 0.1) :
                          announcement.target === 'admins' ? alpha(theme.palette.warning.main, 0.1) :
                          alpha(theme.palette.secondary.main, 0.1),
                        color: 
                          !announcement.target || announcement.target === 'all' ? theme.palette.primary.main :
                          announcement.target === 'students' ? theme.palette.success.main :
                          announcement.target === 'teachers' ? theme.palette.info.main :
                          announcement.target === 'admins' ? theme.palette.warning.main :
                          theme.palette.secondary.main,
                        border: '1px solid',
                        borderColor: 
                          !announcement.target || announcement.target === 'all' ? alpha(theme.palette.primary.main, 0.3) :
                          announcement.target === 'students' ? alpha(theme.palette.success.main, 0.3) :
                          announcement.target === 'teachers' ? alpha(theme.palette.info.main, 0.3) :
                          announcement.target === 'admins' ? alpha(theme.palette.warning.main, 0.3) :
                          alpha(theme.palette.secondary.main, 0.3)
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    {new Date(announcement.created_at || Date.now()).toLocaleDateString()}
                  </TableCell>
                  <TableCell sx={{ color: 'white' }}>
                    <Chip 
                      label={announcement.status === 'active' ? 'Active' : 'Inactive'}
                      size="small"
                      sx={{ 
                        bgcolor: announcement.status === 'active' 
                          ? alpha(theme.palette.success.main, 0.1) 
                          : alpha(theme.palette.error.main, 0.1),
                        color: announcement.status === 'active' 
                          ? theme.palette.success.main 
                          : theme.palette.error.main,
                        border: '1px solid',
                        borderColor: announcement.status === 'active' 
                          ? alpha(theme.palette.success.main, 0.3) 
                          : alpha(theme.palette.error.main, 0.3),
                      }}
                      icon={
                        announcement.status === 'active' 
                          ? <Check fontSize="small" /> 
                          : <Block fontSize="small" />
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Announcement">
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditAnnouncement(announcement)}
                        sx={{ color: theme.palette.info.main }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={announcement.status === 'active' ? 'Deactivate' : 'Activate'}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleToggleStatus(announcement)}
                        sx={{ 
                          color: announcement.status === 'active' 
                            ? theme.palette.warning.main 
                            : theme.palette.success.main 
                        }}
                      >
                        {announcement.status === 'active' ? <Block fontSize="small" /> : <Check fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Announcement">
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDeleteDialog(announcement)}
                        sx={{ color: theme.palette.error.main }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {/* Create/Edit Announcement Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#1c2e4a',
            backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontSize: 18, fontWeight: 'bold' }}>
          {isEditing ? 'Edit Announcement' : 'Create New Announcement'}
        </DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, my: 1 }}>
            <TextField
              name="title"
              label="Announcement Title"
              value={currentAnnouncement.title || ''}
              onChange={handleInputChange}
              fullWidth
              required
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
              InputProps={{
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
            />
            
            <TextField
              name="content"
              label="Announcement Content"
              value={currentAnnouncement.content || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={4}
              required
              InputLabelProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)' }
              }}
              InputProps={{
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
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
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
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Target</InputLabel>
                <Select
                  name="target"
                  value={currentAnnouncement.target || 'all'}
                  onChange={handleSelectChange}
                  label="Target"
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="students">Students Only</MenuItem>
                  <MenuItem value="teachers">Teachers Only</MenuItem>
                  <MenuItem value="admins">Admins Only</MenuItem>
                </Select>
              </FormControl>
              
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
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Campus</InputLabel>
                <Select
                  name="campus"
                  value={currentAnnouncement.campus || 'All Campuses'}
                  onChange={handleSelectChange}
                  label="Campus"
                  sx={{ color: 'white' }}
                >
                  <MenuItem value="All Campuses">All Campuses</MenuItem>
                  <MenuItem value="Main Campus: Undisclosed location, Philippines">Main Campus: Undisclosed location, Philippines</MenuItem>
                  <MenuItem value="Biringan Campus">Biringan Campus</MenuItem>
                  <MenuItem value="Sun and Moon Campus">Sun and Moon Campus</MenuItem>
                  <MenuItem value="Galactic Campus">Galactic Campus</MenuItem>
                  <MenuItem value="Atlantis Campus">Atlantis Campus</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAnnouncement} 
            variant="contained"
            sx={{
              bgcolor: theme.palette.success.main,
              '&:hover': {
                bgcolor: alpha(theme.palette.success.main, 0.9)
              }
            }}
          >
            {isEditing ? 'Update Announcement' : 'Create Announcement'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            bgcolor: '#1c2e4a',
            backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the announcement <strong>{announcementToDelete?.title}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog} 
            color="inherit"
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default AnnouncementManagement; 