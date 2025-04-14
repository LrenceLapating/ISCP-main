/**
 * AdminNotificationMenu.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 1, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Admin notification menu component for displaying and managing
 * system notifications, alerts, and messages for administrators.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  Notifications,
  School,
  Message,
  Announcement,
  Info,
  Done,
  ClearAll,
  AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import adminService, { Notification } from '../services/AdminService';

const AdminNotificationMenu: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const open = Boolean(anchorEl);
  const refreshInterval = useRef<number | null>(null);
  const navigate = useNavigate();

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
      const data = await adminService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await adminService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications(); // Refresh notifications when menu is opened
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await adminService.markNotificationAsRead(notification.id);
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(prev - 1, 0));
      
      // Navigate based on notification type
      if (notification.related_id) {
        switch (notification.type) {
          case 'course':
            // Navigate to pending course requests
            navigate('/admin/courses?tab=pending');
            break;
          case 'message':
            navigate('/admin/messages');
            break;
          case 'announcement':
            navigate('/admin/dashboard');
            break;
          default:
            // No navigation for other types
            break;
        }
      }
      
      handleClose();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await adminService.markAllNotificationsAsRead();
      setNotifications(prevNotifications =>
        prevNotifications.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await adminService.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      handleClose();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <School fontSize="small" color="info" />;
      case 'message':
        return <Message fontSize="small" color="warning" />;
      case 'announcement':
        return <Announcement fontSize="small" color="secondary" />;
      case 'system':
        return <AdminPanelSettings fontSize="small" color="primary" />;
      default:
        return <Info fontSize="small" color="disabled" />;
    }
  };

  const formatNotificationTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown time';
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        color="inherit"
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Notifications sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
        </Badge>
      </IconButton>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 2,
          sx: {
            maxHeight: 400,
            width: 360,
            overflow: 'auto',
            mt: 1.5,
            bgcolor: '#0d1b2a',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Notifications</Typography>
          {notifications.length > 0 && (
            <Box>
              <Button 
                size="small" 
                startIcon={<Done />} 
                onClick={handleMarkAllAsRead}
                sx={{ mr: 1, color: 'primary.main' }}
              >
                Mark all read
              </Button>
              <Button 
                size="small" 
                startIcon={<ClearAll />} 
                onClick={handleClearAll}
                color="error"
              >
                Clear all
              </Button>
            </Box>
          )}
        </Box>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <MenuItem 
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft: notification.is_read 
                  ? 'none' 
                  : '3px solid #1976d2',
                bgcolor: notification.is_read 
                  ? 'transparent' 
                  : 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                }
              }}
            >
              <ListItemIcon>
                {getNotificationIcon(notification.type)}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2" fontWeight={notification.is_read ? 'normal' : 'bold'}>
                    {notification.title}
                  </Typography>
                }
                secondary={
                  <Box component="span" sx={{ display: 'block' }}>
                    <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" sx={{ fontSize: '0.85rem' }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="rgba(255, 255, 255, 0.5)" sx={{ mt: 0.5, display: 'block' }}>
                      {formatNotificationTime(notification.created_at)}
                    </Typography>
                  </Box>
                }
                primaryTypographyProps={{
                  color: 'white'
                }}
                secondaryTypographyProps={{
                  component: 'div'
                }}
              />
            </MenuItem>
          ))
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
              No notifications available!
            </Typography>
          </Box>
        )}
      </Menu>
    </>
  );
};

export default AdminNotificationMenu; 