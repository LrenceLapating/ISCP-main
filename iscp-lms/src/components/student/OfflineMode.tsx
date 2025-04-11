import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Grid,
  Alert,
  Tooltip,
  Chip
} from '@mui/material';
import {
  WifiOff,
  CloudDownload,
  Check,
  Delete,
  Storage,
  InfoOutlined,
  Sync,
  BookOutlined,
  AssignmentOutlined,
  NotesOutlined,
  VideoLibraryOutlined,
  SettingsBackupRestoreOutlined,
  CloudDoneOutlined,
  CloudOffOutlined
} from '@mui/icons-material';
import studentService from '../../services/StudentService';

// Define types
interface CachedResource {
  id: string;
  name: string;
  type: 'course' | 'material' | 'assignment' | 'note' | 'video';
  size: string;
  lastSynced: Date;
  course: string;
  status: 'synced' | 'pending' | 'error';
}

interface OfflineModeProps {
  onStatusChange?: (isEnabled: boolean) => void;
}

const OfflineMode: React.FC<OfflineModeProps> = ({ onStatusChange }) => {
  const [offlineEnabled, setOfflineEnabled] = useState<boolean>(false);
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [cachedResources, setCachedResources] = useState<CachedResource[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<number>(0);
  const [storageUsed, setStorageUsed] = useState<string>('0 MB');
  const [storageLimit, setStorageLimit] = useState<string>('500 MB');
  const [storagePercentage, setStoragePercentage] = useState<number>(0);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Mock cached resources
  const mockCachedResources: CachedResource[] = [
    {
      id: '1',
      name: 'Astrobiology 101',
      type: 'course',
      size: '45 MB',
      lastSynced: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      course: 'Astrobiology 101',
      status: 'synced'
    },
    {
      id: '2',
      name: 'Introduction to Extraterrestrial Life - Lecture Notes',
      type: 'material',
      size: '3.2 MB',
      lastSynced: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      course: 'Astrobiology 101',
      status: 'synced'
    },
    {
      id: '3',
      name: 'Research Paper - Week 3',
      type: 'assignment',
      size: '1.8 MB',
      lastSynced: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      course: 'Astrobiology 101',
      status: 'synced'
    },
    {
      id: '4',
      name: 'Intergalactic Politics',
      type: 'course',
      size: '32 MB',
      lastSynced: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      course: 'Intergalactic Politics',
      status: 'synced'
    },
    {
      id: '5',
      name: 'Diplomatic Relations Simulation - Video',
      type: 'video',
      size: '128 MB',
      lastSynced: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      course: 'Intergalactic Politics',
      status: 'synced'
    },
    {
      id: '6',
      name: 'Personal Study Notes - Midterm Prep',
      type: 'note',
      size: '0.5 MB',
      lastSynced: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
      course: 'Astrobiology 101',
      status: 'synced'
    }
  ];

  // Initialize state on component mount
  useEffect(() => {
    // Load offline mode settings
    const loadOfflineSettings = async () => {
      try {
        // In a real implementation, this would be fetched from localStorage or an API
        // const settings = await studentService.getOfflineSettings();
        const isOfflineMode = localStorage.getItem('offlineMode') === 'true';
        const isAutoSync = localStorage.getItem('autoSync') === 'true';
        
        setOfflineEnabled(isOfflineMode);
        setAutoSync(isAutoSync ?? true);
        setCachedResources(mockCachedResources);
        
        // Calculate storage used
        const totalStorage = mockCachedResources.reduce((total, resource) => {
          const sizeInMB = parseFloat(resource.size.replace(' MB', ''));
          return total + sizeInMB;
        }, 0);
        
        setStorageUsed(`${totalStorage.toFixed(1)} MB`);
        setStoragePercentage((totalStorage / 500) * 100); // Assuming 500MB limit
        setLastSyncDate(new Date(Date.now() - 45 * 60 * 1000)); // 45 minutes ago
      } catch (error) {
        console.error('Error loading offline settings:', error);
      }
    };
    
    loadOfflineSettings();
    
    // Set up online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Handle offline mode toggle
  const handleOfflineModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setOfflineEnabled(newState);
    localStorage.setItem('offlineMode', newState.toString());
    
    if (onStatusChange) {
      onStatusChange(newState);
    }
    
    if (newState && isOnline) {
      // Trigger sync when enabling offline mode
      handleSyncAll();
    }
  };
  
  // Handle auto-sync toggle
  const handleAutoSyncToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newState = event.target.checked;
    setAutoSync(newState);
    localStorage.setItem('autoSync', newState.toString());
  };
  
  // Handle sync all button
  const handleSyncAll = () => {
    if (!isOnline) {
      alert('You are currently offline. Unable to sync.');
      return;
    }
    
    setSyncing(true);
    setSyncProgress(0);
    
    // Simulate sync progress
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setSyncing(false);
          setLastSyncDate(new Date());
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };
  
  // Handle clear cache
  const handleClearCache = () => {
    // Use window.confirm explicitly to avoid ESLint no-restricted-globals warning
    if (window.confirm('Are you sure you want to clear all cached content? You will need to re-download resources to use them offline.')) {
      setCachedResources([]);
      setStorageUsed('0 MB');
      setStoragePercentage(0);
      localStorage.removeItem('cachedResources');
      window.alert('Cache cleared successfully.');
    }
  };
  
  // Handle remove cached resource
  const handleRemoveResource = (id: string) => {
    const resource = cachedResources.find(r => r.id === id);
    if (!resource) return;
    
    const newResources = cachedResources.filter(r => r.id !== id);
    setCachedResources(newResources);
    
    // Recalculate storage used
    const totalStorage = newResources.reduce((total, resource) => {
      const sizeInMB = parseFloat(resource.size.replace(' MB', ''));
      return total + sizeInMB;
    }, 0);
    
    setStorageUsed(`${totalStorage.toFixed(1)} MB`);
    setStoragePercentage((totalStorage / 500) * 100);
  };
  
  // Format date to relative time (e.g., "2 hours ago")
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInMins > 0) {
      return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };
  
  // Get icon for resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOutlined />;
      case 'material':
        return <NotesOutlined />;
      case 'assignment':
        return <AssignmentOutlined />;
      case 'video':
        return <VideoLibraryOutlined />;
      case 'note':
        return <NotesOutlined />;
      default:
        return <BookOutlined />;
    }
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WifiOff sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight="bold">
            Offline Mode
          </Typography>
          
          {!isOnline && (
            <Chip 
              label="You are offline" 
              color="warning" 
              size="small" 
              icon={<CloudOffOutlined />}
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<InfoOutlined />}
        >
          <Typography variant="body2">
            Offline mode allows you to access your courses, materials, and assignments even when you don't have an internet connection. 
            Enable this feature to download and sync content for offline use.
          </Typography>
        </Alert>
        
        <Grid container spacing={3}>
          <Grid sx={{ gridColumn: 'span 7' }}>
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={offlineEnabled}
                    onChange={handleOfflineModeToggle}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" fontWeight="medium">Enable Offline Mode</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Download course content for offline access
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={autoSync}
                    onChange={handleAutoSyncToggle}
                    color="primary"
                    disabled={!offlineEnabled}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" fontWeight="medium">Auto-Sync When Online</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatically sync content when connected to the internet
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2 }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Button
                  variant="contained"
                  startIcon={<Sync />}
                  onClick={handleSyncAll}
                  disabled={syncing || !offlineEnabled || !isOnline}
                  sx={{ mr: 2 }}
                >
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={handleClearCache}
                  disabled={!offlineEnabled || cachedResources.length === 0}
                >
                  Clear Cache
                </Button>
              </Box>
              
              {syncing && (
                <Box sx={{ width: '100%', mb: 3 }}>
                  <LinearProgress variant="determinate" value={syncProgress} sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Syncing content... {syncProgress}% complete
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Storage Used
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={storagePercentage} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 1,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: storagePercentage > 90 ? 'error.main' : 'primary.main',
                        }
                      }} 
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2, whiteSpace: 'nowrap' }}>
                    {storageUsed} / {storageLimit}
                  </Typography>
                </Box>
              </Box>
              
              {lastSyncDate && (
                <Typography variant="body2" color="text.secondary">
                  Last synced: {formatRelativeTime(lastSyncDate)}
                </Typography>
              )}
            </Box>
          </Grid>
          
          <Grid sx={{ gridColumn: 'span 5' }}>
            <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                What's Available Offline
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                When offline mode is enabled, you'll have access to:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Check color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Course materials (PDF, documents)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Check color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Assignments & submission drafts" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Check color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Course announcements" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Check color="success" />
                  </ListItemIcon>
                  <ListItemText primary="Your grades and academic records" />
                </ListItem>
              </List>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Cached Content
        </Typography>
        
        {cachedResources.length > 0 ? (
          <List>
            {cachedResources.map((resource) => (
              <ListItem 
                key={resource.id}
                divider
                sx={{ 
                  py: 1.5, 
                  '&:hover': { 
                    bgcolor: 'rgba(0, 0, 0, 0.02)' 
                  }
                }}
              >
                <ListItemIcon>
                  {getResourceIcon(resource.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{resource.name}</Typography>
                      {resource.status === 'synced' && (
                        <Tooltip title="Synced and available offline">
                          <CloudDoneOutlined color="success" sx={{ ml: 1, fontSize: 18 }} />
                        </Tooltip>
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary" component="span">
                        {resource.course} • {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)} • {resource.size}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        Last synced: {formatRelativeTime(resource.lastSynced)}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleRemoveResource(resource.id)}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Storage sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle1">No cached content</Typography>
            <Typography variant="body2" color="text.secondary">
              {offlineEnabled 
                ? 'Enable offline mode and click "Sync Now" to download content.' 
                : 'No content has been cached for offline use yet.'}
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default OfflineMode; 