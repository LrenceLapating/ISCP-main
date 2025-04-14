/**
 * NotificationDropdown.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: March 30, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Common notification dropdown component for displaying
 * user notifications with read/unread status and navigation.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  MenuItem,
  Badge,
  IconButton,
  Typography,
  Box,
  Divider,
  ListItemText,
  CircularProgress,
  Button,
  Tooltip,
  ListItemIcon
} from '@mui/material';
import {
  Notifications,
  Assignment,
  Grade as GradeIcon,
  Message,
  Announcement,
  School,
  Info,
  DoneAll,
  Done,
  Send,
  ClearAll
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import studentService, { Notification } from '../../services/StudentService';
import { format, formatDistanceToNow } from 'date-fns';

const NotificationDropdown: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const refreshInterval = useRef<number | null>(null);
  const navigate = useNavigate();
  
  const isOpen = Boolean(anchorEl);
  
  useEffect(() => {
    fetchUnreadCount();
    
    // Set up interval to refresh notifications
    refreshInterval.current = window.setInterval(() => {
      fetchUnreadCount();
    }, 60000); // Check every minute
    
    return () => {
      if (refreshInterval.current) {
        window.clearInterval(refreshInterval.current);
      }
    };
  }, []);
  
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await studentService.getNotifications();
      setNotifications(data);
      
      // Calculate unread count
      const unreadNotifications = data.filter(notification => !notification.is_read);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUnreadCount = async () => {
    try {
      const count = await studentService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };
  
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if it's unread
    if (!notification.is_read) {
      await studentService.markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'assignment':
        navigate(`/assignments/${notification.related_id}`);
        break;
      case 'grade':
        navigate('/grades');
        break;
      case 'course':
        navigate(`/courses/${notification.related_id}`);
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'announcement':
        navigate('/dashboard');
        break;
      default:
        // For system notifications, just close the dropdown
        break;
    }
    
    handleClose();
  };
  
  const handleMarkAllAsRead = async () => {
    await studentService.markAllNotificationsAsRead();
    setNotifications(prevNotifications => 
      prevNotifications.map(n => ({ ...n, is_read: true }))
    );
    setUnreadCount(0);
  };

  const handleClearAll = async () => {
    try {
      await studentService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      handleClose();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <Assignment fontSize="small" color="primary" />;
      case 'grade':
        return <GradeIcon fontSize="small" color="success" />;
      case 'course':
        return <School fontSize="small" color="info" />;
      case 'message':
        return <Message fontSize="small" color="warning" />;
      case 'announcement':
        return <Announcement fontSize="small" color="secondary" />;
      case 'submission':
        return <Send fontSize="small" sx={{ color: '#f44336' }} />;
      default:
        return <Info fontSize="small" color="disabled" />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If within the last hour, show minutes ago
    if (now.getTime() - date.getTime() < 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    
    // If today, show time
    if (now.toDateString() === date.toDateString()) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    
    // Within the last day, show "Yesterday at time"
    if (now.getTime() - date.getTime() < 24 * 60 * 60 * 1000) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    
    // Within the last week
    if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return format(date, 'EEEE, h:mm a');
    }
    
    // Older
    return format(date, 'MMM d, yyyy');
  };
  
  return (
    <>
      <IconButton
        size="large"
        aria-label="show new notifications"
        color="inherit"
        onClick={handleOpen}
        sx={{ color: '#fff', mr: 1, p: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            bgcolor: '#0a1128',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            backgroundImage: 'none',
            '& .MuiMenuItem-root': {
              py: 1.5,
              borderLeft: '3px solid transparent',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.05)',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
            Notifications
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
            <CircularProgress size={24} sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ py: 5, px: 2, textAlign: 'center' }}>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No notifications to display
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ maxHeight: 350, overflowY: 'auto', py: 1 }}>
              {notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.is_read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                    borderLeftColor: notification.is_read ? 'transparent' : 'primary.main',
                    py: 2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: notification.is_read ? 'rgba(255, 255, 255, 0.7)' : '#fff',
                          fontWeight: notification.is_read ? 400 : 600,
                          mb: 0.5
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)', 
                          fontSize: '0.75rem',
                          display: 'block',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word'
                        }}
                      >
                        {notification.message}
                      </Typography>
                    }
                  />
                  <Typography
                    variant="caption"
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.4)', 
                      fontSize: '0.7rem',
                      ml: 1,
                      alignSelf: 'flex-start',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {formatDate(notification.created_at)}
                  </Typography>
                  {!notification.is_read && (
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        ml: 1
                      }}
                    />
                  )}
                </MenuItem>
              ))}
            </Box>
            
            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 1 
            }}>
              {unreadCount > 0 && (
                <Button 
                  startIcon={<Done />} 
                  color="primary" 
                  onClick={handleMarkAllAsRead}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    color: 'primary.light'
                  }}
                >
                  Mark all as read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button 
                  startIcon={<ClearAll />} 
                  color="error" 
                  onClick={handleClearAll}
                  sx={{ 
                    textTransform: 'none',
                    fontSize: '0.8rem',
                    color: 'error.light'
                  }}
                >
                  Clear all
                </Button>
              )}
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationDropdown; 