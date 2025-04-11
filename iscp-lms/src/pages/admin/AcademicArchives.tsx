import React from 'react';
import {
  Box, Typography, Paper, Grid as MuiGrid, 
  Button, useTheme, alpha, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip
} from '@mui/material';
import {
  School, Archive, FileDownload, Visibility, 
  DeleteOutline, History, CloudDownload
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';

// Create custom Grid components to avoid TypeScript errors
const Grid = MuiGrid;
const GridItem = (props: any) => <MuiGrid {...props} />;

// Archive data (academic years)
const archiveData = [
  { id: 1, year: '2023-2024', semesters: 2, courses: 156, students: 4567, status: 'Current' },
  { id: 2, year: '2022-2023', semesters: 2, courses: 145, students: 4350, status: 'Archived' },
  { id: 3, year: '2021-2022', semesters: 2, courses: 138, students: 4125, status: 'Archived' },
  { id: 4, year: '2020-2021', semesters: 2, courses: 130, students: 3980, status: 'Archived' },
  { id: 5, year: '2019-2020', semesters: 2, courses: 125, students: 3750, status: 'Archived' }
];

// Sample list of legacy archives
const legacyArchives = [
  { id: 1, name: 'Pre-Digital Records (2010-2015)', size: '15.3 GB', format: 'PDF Scans', date: '2015-07-15' },
  { id: 2, name: 'ISCP Legacy System Export', size: '8.7 GB', format: 'SQL + Documents', date: '2018-01-20' },
  { id: 3, name: 'Historic Transcripts Archive', size: '4.2 GB', format: 'PDF + CSV', date: '2017-12-05' },
  { id: 4, name: 'Alumni Database (2000-2018)', size: '3.5 GB', format: 'SQL Backup', date: '2019-03-10' }
];

const AcademicArchives: React.FC = () => {
  const theme = useTheme();
  
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <School sx={{ color: theme.palette.primary.main, mr: 1 }} />
                <Typography variant="h6" component="h2" color="white">
                  Academic Year Archives
                </Typography>
              </Box>
              
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
                    {archiveData.map((item) => (
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
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download Archive">
                              <IconButton 
                                size="small"
                                sx={{ color: theme.palette.success.main }}
                              >
                                <FileDownload fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
                              >
                                <CloudDownload fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button 
                  variant="contained" 
                  startIcon={<Archive />}
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
    </AdminLayout>
  );
};

export default AcademicArchives; 