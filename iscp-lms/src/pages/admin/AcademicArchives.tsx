/**
 * AcademicArchives.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 13, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Administrator academic archives management interface for
 * archiving past academic terms and managing archived data.
 */

import React from 'react';
import {
  Box, Typography, Paper, Grid as MuiGrid, 
  Button, useTheme, alpha, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress
} from '@mui/material';
import {
  School, Archive, FileDownload, Visibility, 
  DeleteOutline, History, CloudDownload, AddCircleOutline
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';
import adminService, { AcademicArchive, LegacyArchive } from '../../services/AdminService';

// Create custom Grid components to avoid TypeScript errors
const Grid = MuiGrid;
const GridItem = (props: any) => <MuiGrid {...props} />;

const AcademicArchives: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState<boolean>(true);
  const [academicArchives, setAcademicArchives] = useState<AcademicArchive[]>([]);
  const [legacyArchives, setLegacyArchives] = useState<LegacyArchive[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [newArchiveName, setNewArchiveName] = useState<string>('');
  const [newArchiveFormat, setNewArchiveFormat] = useState<string>('');
  const [newArchiveFile, setNewArchiveFile] = useState<File | null>(null);
  const [newAcademicYear, setNewAcademicYear] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<{[key: number]: boolean}>({});
  
  useEffect(() => {
    const fetchArchiveData = async () => {
      setLoading(true);
      try {
        // Fetch academic archives
        const academicData = await adminService.getAcademicArchives();
        setAcademicArchives(academicData);
        
        // Fetch legacy archives
        const legacyData = await adminService.getLegacyArchives();
        setLegacyArchives(legacyData);
      } catch (error) {
        console.error('Error fetching archive data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArchiveData();
  }, []);
  
  const handleViewAcademicArchive = async (archiveId: number) => {
    try {
      const details = await adminService.getAcademicArchiveDetails(archiveId);
      console.log('Archive details:', details);
      // In a real application, you would show these details in a modal or navigate to a details page
      alert(`Archive details for Year ${details.year}:\n- ${details.courses} courses\n- ${details.students} students\n- ${details.departments.length} departments`);
    } catch (error) {
      console.error('Error viewing archive:', error);
    }
  };
  
  const handleDownloadArchive = async (archiveId: number, type: 'academic' | 'legacy') => {
    try {
      setDownloadProgress({ ...downloadProgress, [archiveId]: true });
      await adminService.downloadArchive(archiveId, type);
    } catch (error) {
      console.error('Error downloading archive:', error);
      alert('Error downloading archive. Please try again later.');
    } finally {
      setDownloadProgress({ ...downloadProgress, [archiveId]: false });
    }
  };
  
  const handleUploadLegacyArchive = async () => {
    if (!newArchiveName || !newArchiveFormat || !newArchiveFile) {
      alert('Please fill in all fields and select a file');
      return;
    }
    
    setIsUploading(true);
    try {
      const uploadedArchive = await adminService.uploadLegacyArchive({
        name: newArchiveName,
        format: newArchiveFormat,
        file: newArchiveFile
      });
      
      // Add the new archive to the list
      setLegacyArchives([...legacyArchives, uploadedArchive]);
      
      // Close the dialog and reset form
      setUploadDialogOpen(false);
      setNewArchiveName('');
      setNewArchiveFormat('');
      setNewArchiveFile(null);
      
      alert('Archive uploaded successfully!');
    } catch (error) {
      console.error('Error uploading archive:', error);
      alert('Error uploading archive. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCreateAcademicArchive = async () => {
    if (!newAcademicYear) {
      alert('Please enter an academic year');
      return;
    }
    
    setIsUploading(true);
    try {
      const createdArchive = await adminService.createAcademicArchive(newAcademicYear);
      
      // Add the new archive to the list
      setAcademicArchives([...academicArchives, createdArchive]);
      
      // Close the dialog and reset form
      setCreateDialogOpen(false);
      setNewAcademicYear('');
      
      alert('Academic year archive created successfully!');
    } catch (error) {
      console.error('Error creating academic archive:', error);
      alert('Error creating academic archive. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setNewArchiveFile(event.target.files[0]);
    }
  };
  
  const renderUploadDialog = () => (
    <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#0a1128', color: 'white' }}>
        Upload Legacy Archive
      </DialogTitle>
      <DialogContent sx={{ bgcolor: '#0a1128', color: 'white', pt: 2 }}>
        <TextField
          label="Archive Name"
          fullWidth
          margin="normal"
          value={newArchiveName}
          onChange={(e) => setNewArchiveName(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
          }}
        />
        <TextField
          label="Format (e.g., PDF, SQL Backup)"
          fullWidth
          margin="normal"
          value={newArchiveFormat}
          onChange={(e) => setNewArchiveFormat(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
          }}
        />
        <Box sx={{ mt: 2 }}>
          <input
            accept="application/zip,application/x-zip-compressed,application/x-compressed"
            id="archive-file-upload"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor="archive-file-upload">
            <Button
              variant="outlined"
              component="span"
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': { borderColor: 'white' }
              }}
              startIcon={<CloudDownload />}
            >
              Select Archive File
            </Button>
          </label>
          {newArchiveFile && (
            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
              Selected: {newArchiveFile.name} ({(newArchiveFile.size / (1024 * 1024)).toFixed(2)} MB)
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#0a1128', px: 3, pb: 3 }}>
        <Button
          onClick={() => setUploadDialogOpen(false)}
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleUploadLegacyArchive}
          disabled={isUploading || !newArchiveName || !newArchiveFormat || !newArchiveFile}
          startIcon={isUploading ? <CircularProgress size={20} /> : <CloudDownload />}
        >
          {isUploading ? 'Uploading...' : 'Upload Archive'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  const renderCreateAcademicArchiveDialog = () => (
    <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ bgcolor: '#0a1128', color: 'white' }}>
        Create Academic Year Archive
      </DialogTitle>
      <DialogContent sx={{ bgcolor: '#0a1128', color: 'white', pt: 2 }}>
        <TextField
          label="Academic Year (e.g., 2023-2024)"
          fullWidth
          margin="normal"
          value={newAcademicYear}
          onChange={(e) => setNewAcademicYear(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
              '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
          }}
        />
        <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
          Creating an archive will preserve the current state of courses, enrollments, and academic data for this academic year.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#0a1128', px: 3, pb: 3 }}>
        <Button
          onClick={() => setCreateDialogOpen(false)}
          sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateAcademicArchive}
          disabled={isUploading || !newAcademicYear}
          startIcon={isUploading ? <CircularProgress size={20} /> : <AddCircleOutline />}
        >
          {isUploading ? 'Creating...' : 'Create Archive'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  return (
    <AdminLayout title="Academic Archives">
      <Box sx={{ py: 3 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" color="white" mb={2}>
          Academic Archives
        </Typography>
        <Typography variant="body1" color="rgba(255, 255, 255, 0.7)" mb={4}>
          Access and manage historical academic data, course archives, and legacy records
        </Typography>
        
        <Grid container spacing={3}>
          {/* Academic Year Archives */}
          <GridItem xs={12}>
            <Paper sx={{ 
              p: 3,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mb: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <School sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant="h6" component="h2" color="white">
                    Academic Year Archives
                  </Typography>
                </Box>
                <Button 
                  variant="contained" 
                  startIcon={<AddCircleOutline />}
                  onClick={() => setCreateDialogOpen(true)}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.9)
                    }
                  }}
                >
                  Create Academic Archive
                </Button>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ 
                        '& th': { 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 'bold',
                          bgcolor: 'rgba(0, 0, 0, 0.2)' 
                        } 
                      }}>
                        <TableCell>Academic Year</TableCell>
                        <TableCell>Semesters</TableCell>
                        <TableCell>Total Courses</TableCell>
                        <TableCell>Student Count</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {academicArchives.map((item) => (
                        <TableRow key={item.id} sx={{ 
                          '& td': { color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
                          '&:last-child td': { borderBottom: 'none' },
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                        }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Archive sx={{ color: theme.palette.primary.main, mr: 1, fontSize: 20 }} />
                              <Typography fontWeight={500}>{item.year}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{item.semesters}</TableCell>
                          <TableCell>{item.courses}</TableCell>
                          <TableCell>{item.students.toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={item.status}
                              size="small"
                              sx={{ 
                                bgcolor: item.status === 'Current' 
                                  ? alpha(theme.palette.primary.main, 0.1)
                                  : alpha(theme.palette.warning.main, 0.1),
                                color: item.status === 'Current' 
                                  ? theme.palette.primary.main
                                  : theme.palette.warning.main,
                                border: '1px solid',
                                borderColor: item.status === 'Current' 
                                  ? alpha(theme.palette.primary.main, 0.3)
                                  : alpha(theme.palette.warning.main, 0.3),
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="View Academic Year">
                                <IconButton 
                                  size="small"
                                  sx={{ color: theme.palette.primary.main }}
                                  onClick={() => handleViewAcademicArchive(item.id)}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Archive">
                                <IconButton 
                                  size="small"
                                  sx={{ color: theme.palette.success.main }}
                                  onClick={() => handleDownloadArchive(item.id, 'academic')}
                                  disabled={downloadProgress[item.id]}
                                >
                                  {downloadProgress[item.id] ? (
                                    <CircularProgress size={18} sx={{ color: theme.palette.success.main }} />
                                  ) : (
                                    <FileDownload fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </GridItem>
          
          {/* Legacy Data Archives */}
          <GridItem xs={12}>
            <Paper sx={{ 
              p: 3,
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <History sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" component="h2" color="white">
                  Legacy Data Archives
                </Typography>
              </Box>
              
              <Typography variant="body2" color="rgba(255, 255, 255, 0.7)" mb={3}>
                Historical data from previous systems and digitized records.
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ 
                        '& th': { 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 'bold',
                          bgcolor: 'rgba(0, 0, 0, 0.2)' 
                        } 
                      }}>
                        <TableCell>Archive Name</TableCell>
                        <TableCell>Size</TableCell>
                        <TableCell>Format</TableCell>
                        <TableCell>Date Uploaded</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {legacyArchives.map((item) => (
                        <TableRow key={item.id} sx={{ 
                          '& td': { color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
                          '&:last-child td': { borderBottom: 'none' },
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' }
                        }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Archive sx={{ color: theme.palette.warning.main, mr: 1, fontSize: 20 }} />
                              <Typography fontWeight={500}>{item.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{item.size}</TableCell>
                          <TableCell>{item.format}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <Tooltip title="Download Archive">
                                <IconButton 
                                  size="small"
                                  sx={{ color: theme.palette.success.main }}
                                  onClick={() => handleDownloadArchive(item.id, 'legacy')}
                                  disabled={downloadProgress[item.id]}
                                >
                                  {downloadProgress[item.id] ? (
                                    <CircularProgress size={18} sx={{ color: theme.palette.success.main }} />
                                  ) : (
                                    <CloudDownload fontSize="small" />
                                  )}
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Archive />}
                  onClick={() => setUploadDialogOpen(true)}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.9)
                    }
                  }}
                >
                  Upload Legacy Archive
                </Button>
              </Box>
            </Paper>
          </GridItem>
        </Grid>
      </Box>
      
      {/* Dialogs */}
      {renderUploadDialog()}
      {renderCreateAcademicArchiveDialog()}
    </AdminLayout>
  );
};

export default AcademicArchives; 