/**
 * SystemManagement.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 13, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator system management interface for configuring
 * system settings, monitoring performance, and managing backups.
 */

import React from 'react';
import {
  Box, Typography, Paper, Grid as MuiGrid, Card, CardContent, 
  Button, Divider, useTheme, alpha, List, ListItem,
  ListItemText, ListItemIcon, Chip, Avatar
} from '@mui/material';
import {
  Storage, CloudUpload, CloudDownload, Backup,
  DeleteSweep, Security, Settings, Speed, 
  MiscellaneousServices, BarChart
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';

// Create custom Grid components to avoid TypeScript errors
const Grid = MuiGrid;
const GridItem = (props: any) => <MuiGrid {...props} />;

// System status data
const systemStatus = [
  { name: 'API Server', status: 'Operational', uptime: '99.98%', lastRestart: '25 days ago' },
  { name: 'Database', status: 'Operational', uptime: '99.99%', lastRestart: '30 days ago' },
  { name: 'File Storage', status: 'Operational', uptime: '99.95%', lastRestart: '15 days ago' },
  { name: 'Authentication Service', status: 'Operational', uptime: '99.97%', lastRestart: '20 days ago' },
  { name: 'Email Service', status: 'Degraded', uptime: '98.75%', lastRestart: '5 days ago' }
];

// Backup history
const backupHistory = [
  { id: 1, date: '2023-11-15 03:00 AM', size: '2.3 GB', status: 'Completed' },
  { id: 2, date: '2023-11-14 03:00 AM', size: '2.2 GB', status: 'Completed' },
  { id: 3, date: '2023-11-13 03:00 AM', size: '2.2 GB', status: 'Completed' },
  { id: 4, date: '2023-11-12 03:00 AM', size: '2.1 GB', status: 'Completed' },
  { id: 5, date: '2023-11-11 03:00 AM', size: '2.1 GB', status: 'Completed' }
];

// Archive data (academic years)
const archiveData = [
  { id: 1, year: '2023-2024', semesters: 2, courses: 156, students: 4567, status: 'Current' },
  { id: 2, year: '2022-2023', semesters: 2, courses: 145, students: 4350, status: 'Archived' },
  { id: 3, year: '2021-2022', semesters: 2, courses: 138, students: 4125, status: 'Archived' },
  { id: 4, year: '2020-2021', semesters: 2, courses: 130, students: 3980, status: 'Archived' }
];

const SystemManagement: React.FC = () => {
  const theme = useTheme();
  
  return (
    <AdminLayout title="System Management">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" color="white" mb={3}>
          System Management & Archives
        </Typography>
        
        <Grid container spacing={3}>
          {/* System Metrics */}
          <GridItem xs={12} md={6}>
            <Paper sx={{ 
              p: 2, 
              height: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Speed sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" component="h2" color="white">
                  System Status
                </Typography>
              </Box>
              
              <List sx={{ 
                '& .MuiListItem-root': { 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  py: 1 
                },
                '& .MuiListItem-root:last-child': { 
                  borderBottom: 'none' 
                }
              }}>
                {systemStatus.map((system, index) => (
                  <ListItem key={index}>
                    <ListItemText 
                      primary={
                        <Typography variant="body1" color="white">
                          {system.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          Uptime: {system.uptime} • Last restart: {system.lastRestart}
                        </Typography>
                      }
                    />
                    <Chip 
                      label={system.status}
                      size="small"
                      sx={{ 
                        bgcolor: system.status === 'Operational' 
                          ? alpha(theme.palette.success.main, 0.1) 
                          : alpha(theme.palette.warning.main, 0.1),
                        color: system.status === 'Operational' 
                          ? theme.palette.success.main 
                          : theme.palette.warning.main,
                        border: '1px solid',
                        borderColor: system.status === 'Operational' 
                          ? alpha(theme.palette.success.main, 0.3) 
                          : alpha(theme.palette.warning.main, 0.3),
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<MiscellaneousServices />}
                  sx={{ 
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  System Maintenance
                </Button>
              </Box>
            </Paper>
          </GridItem>
          
          {/* Backup & Restore */}
          <GridItem xs={12} md={6}>
            <Paper sx={{ 
              p: 2, 
              height: '100%',
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Backup sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" component="h2" color="white">
                  Backup & Restore
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mb={2}>
                  Automatic backups are scheduled daily at 3:00 AM.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="contained" 
                    startIcon={<CloudUpload />}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.9)
                      }
                    }}
                  >
                    Manual Backup
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    startIcon={<CloudDownload />}
                    sx={{ 
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        bgcolor: 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    Restore
                  </Button>
                </Box>
              </Box>
              
              <Typography variant="subtitle2" color="white" mb={1}>
                Recent Backups
              </Typography>
              
              <List sx={{ 
                maxHeight: 200,
                overflow: 'auto',
                '& .MuiListItem-root': { 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  py: 1 
                },
                '& .MuiListItem-root:last-child': { 
                  borderBottom: 'none' 
                }
              }}>
                {backupHistory.map((backup) => (
                  <ListItem key={backup.id}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Storage sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="white">
                          {backup.date}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                          Size: {backup.size}
                        </Typography>
                      }
                    />
                    <Chip 
                      label={backup.status}
                      size="small"
                      sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        border: '1px solid',
                        borderColor: alpha(theme.palette.success.main, 0.3),
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </GridItem>
          
          {/* Security & Logs */}
          <GridItem xs={12}>
            <Paper sx={{ 
              p: 2,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" component="h2" color="white">
                  Security & Logs
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <GridItem xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="white" mb={1}>
                      Recent Security Events
                    </Typography>
                    <List sx={{ 
                      bgcolor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 1,
                      maxHeight: 200,
                      overflow: 'auto',
                      '& .MuiListItem-root': { 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        py: 1 
                      },
                      '& .MuiListItem-root:last-child': { 
                        borderBottom: 'none' 
                      }
                    }}>
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="white">
                              Failed login attempts threshold reached
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Today, 10:45 AM • IP: 192.168.1.105
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="white">
                              Admin password changed
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Yesterday, 3:30 PM • User: admin@iscp.edu
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="white">
                              Scheduled security scan completed
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Yesterday, 2:00 AM • No issues found
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </Box>
                </GridItem>
                
                <GridItem xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="white" mb={1}>
                      System Logs
                    </Typography>
                    <List sx={{ 
                      bgcolor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 1,
                      maxHeight: 200,
                      overflow: 'auto',
                      '& .MuiListItem-root': { 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        py: 1 
                      },
                      '& .MuiListItem-root:last-child': { 
                        borderBottom: 'none' 
                      }
                    }}>
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="white">
                              Database backup completed successfully
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Today, 3:05 AM • Size: 2.3 GB
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="white">
                              System updates installed
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Today, 1:30 AM • Version: 2.5.3
                            </Typography>
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary={
                            <Typography variant="body2" color="white">
                              Storage cleanup completed
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2" color="rgba(255, 255, 255, 0.7)">
                              Yesterday, 11:00 PM • Reclaimed: 1.2 GB
                            </Typography>
                          }
                        />
                      </ListItem>
                    </List>
                  </Box>
                </GridItem>
              </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Storage />}
                  sx={{ 
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  View All Logs
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  startIcon={<Settings />}
                >
                  Security Settings
                </Button>
              </Box>
            </Paper>
          </GridItem>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default SystemManagement; 