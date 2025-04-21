/**
 * LegacyRecords.tsx
 * 
 * Author: MARC MAURICE M. COSTILLAS
 * Date: April 6, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Student legacy records page for accessing archived academic
 * records, transcripts, and historical course information.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Tabs,
  Tab,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  Alert,
  Tooltip,
  CircularProgress,
  Pagination,
  Container
} from '@mui/material';
import {
  HistoryEdu,
  School,
  Search,
  MenuBook,
  Description,
  Info,
  Lock,
  Download,
  FilterList,
  CalendarMonth,
  Article
} from '@mui/icons-material';
import studentService from '../../services/StudentService';
import StudentLayout from '../../components/StudentLayout';

// Define interfaces for typing
interface LegacyRecord {
  id: number;
  title: string;
  recordType: 'transcript' | 'certificate' | 'award' | 'report' | 'other';
  issueDate: string;
  institution: string;
  description: string;
  fileUrl: string;
  fileSize: string;
  fileType: string;
  isVerified: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`legacy-tabpanel-${index}`}
      aria-labelledby={`legacy-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Main component
const LegacyRecords: React.FC = () => {
  const [records, setRecords] = useState<LegacyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [tabValue, setTabValue] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const recordsPerPage = 10;

  // Mock data for legacy records (replace with actual API call)
  const mockLegacyRecords: LegacyRecord[] = [
    {
      id: 1,
      title: 'High School Transcript',
      recordType: 'transcript',
      issueDate: '2018-05-15',
      institution: 'Galactic High School',
      description: 'Official high school transcript showing completed courses and grades.',
      fileUrl: '/records/transcript-2018.pdf',
      fileSize: '1.2 MB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 2,
      title: 'Certificate of Achievement in Quantum Physics',
      recordType: 'certificate',
      issueDate: '2019-06-20',
      institution: 'Quantum Institute',
      description: 'Certificate for outstanding performance in quantum physics summer program.',
      fileUrl: '/records/cert-quantum.pdf',
      fileSize: '842 KB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 3,
      title: 'Community College Transfer Credits',
      recordType: 'transcript',
      issueDate: '2020-12-10',
      institution: 'Nebula Community College',
      description: 'Transcript of courses completed at community college before transferring to ISCP.',
      fileUrl: '/records/transfer-credits.pdf',
      fileSize: '1.5 MB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 4,
      title: 'Academic Excellence Award',
      recordType: 'award',
      issueDate: '2021-03-05',
      institution: 'ISCP Foundation',
      description: 'Award certificate for academic excellence in first semester.',
      fileUrl: '/records/excellence-award.pdf',
      fileSize: '950 KB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 5,
      title: 'Prior Learning Assessment',
      recordType: 'report',
      issueDate: '2021-01-15',
      institution: 'ISCP Admissions',
      description: 'Assessment report for credits granted based on prior learning and experience.',
      fileUrl: '/records/prior-learning.pdf',
      fileSize: '2.1 MB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 6,
      title: 'Galactic Exchange Program Certificate',
      recordType: 'certificate',
      issueDate: '2021-08-30',
      institution: 'Andromeda University',
      description: 'Certificate of participation in the Galactic Exchange Program.',
      fileUrl: '/records/exchange-cert.pdf',
      fileSize: '1.1 MB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 7,
      title: 'Biannual Progress Report',
      recordType: 'report',
      issueDate: '2022-01-10',
      institution: 'ISCP Student Affairs',
      description: 'Biannual academic progress report with advisor comments.',
      fileUrl: '/records/progress-2022.pdf',
      fileSize: '1.8 MB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 8,
      title: 'Language Proficiency Certificate',
      recordType: 'certificate',
      issueDate: '2022-05-22',
      institution: 'Intergalactic Language Institute',
      description: 'Certificate of proficiency in Alien Communication Level 3.',
      fileUrl: '/records/language-cert.pdf',
      fileSize: '760 KB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 9,
      title: 'Previous University Transcript',
      recordType: 'transcript',
      issueDate: '2022-06-15',
      institution: 'Cosmic State University',
      description: 'Official transcript from previous university studies before transferring to ISCP.',
      fileUrl: '/records/previous-uni-transcript.pdf',
      fileSize: '2.3 MB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 10,
      title: 'Scholarship Award Letter',
      recordType: 'other',
      issueDate: '2022-08-01',
      institution: 'ISCP Financial Aid Office',
      description: 'Official scholarship award letter detailing terms and conditions.',
      fileUrl: '/records/scholarship-letter.pdf',
      fileSize: '580 KB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 11,
      title: 'International Credential Evaluation',
      recordType: 'report',
      issueDate: '2022-09-10',
      institution: 'Galactic Credential Services',
      description: 'Evaluation report of international educational credentials.',
      fileUrl: '/records/credential-eval.pdf',
      fileSize: '1.7 MB',
      fileType: 'PDF',
      isVerified: true
    },
    {
      id: 12,
      title: 'Transfer Credit Evaluation',
      recordType: 'report',
      issueDate: '2022-10-05',
      institution: 'ISCP Registrar',
      description: 'Official evaluation of transfer credits from previous institutions.',
      fileUrl: '/records/transfer-eval.pdf',
      fileSize: '1.4 MB',
      fileType: 'PDF',
      isVerified: true
    }
  ];

  // Load records on component mount
  useEffect(() => {
    const loadLegacyRecords = async () => {
      setLoading(true);
      try {
        // In a real implementation, this would call an API endpoint
        // const response = await studentService.getLegacyRecords();
        // setRecords(response);
        
        // Using mock data for now
        setTimeout(() => {
          setRecords(mockLegacyRecords);
          setLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching legacy records:', error);
        setLoading(false);
      }
    };

    loadLegacyRecords();
  }, []);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Filter records based on tab and search query
  const getFilteredRecords = () => {
    let filtered = [...records];
    
    // Filter by tab type
    if (tabValue === 1) {
      filtered = filtered.filter(record => record.recordType === 'transcript');
    } else if (tabValue === 2) {
      filtered = filtered.filter(record => record.recordType === 'certificate');
    } else if (tabValue === 3) {
      filtered = filtered.filter(record => record.recordType === 'award' || record.recordType === 'other');
    } else if (tabValue === 4) {
      filtered = filtered.filter(record => record.recordType === 'report');
    }
    
    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record => 
        record.title.toLowerCase().includes(query) ||
        record.institution.toLowerCase().includes(query) ||
        record.description.toLowerCase().includes(query) ||
        record.issueDate.includes(query)
      );
    }
    
    return filtered;
  };

  // Get current page records
  const getCurrentPageRecords = () => {
    const filtered = getFilteredRecords();
    const startIndex = (page - 1) * recordsPerPage;
    return filtered.slice(startIndex, startIndex + recordsPerPage);
  };

  // Calculate total pages
  const totalPages = Math.ceil(getFilteredRecords().length / recordsPerPage);

  // Get icon based on record type
  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'transcript':
        return <MenuBook />;
      case 'certificate':
        return <HistoryEdu />;
      case 'award':
        return <School />;
      case 'report':
        return <Description />;
      default:
        return <Article />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <StudentLayout title="Legacy Records">
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Box sx={{ width: '100%', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Legacy Records
            </Typography>
            
            <TextField
              placeholder="Search records..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ width: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            icon={<Lock />}
          >
            <Typography variant="body2">
              This is a read-only view of your historical academic records. These documents have been verified by the registrar's office and cannot be modified.
            </Typography>
          </Alert>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              aria-label="legacy records tabs"
              sx={{ mb: 2 }}
            >
              <Tab label="All Records" id="legacy-tab-0" />
              <Tab label="Transcripts" id="legacy-tab-1" />
              <Tab label="Certificates" id="legacy-tab-2" />
              <Tab label="Awards" id="legacy-tab-3" />
              <Tab label="Reports" id="legacy-tab-4" />
            </Tabs>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table sx={{ minWidth: 650 }} aria-label="legacy records table">
                  <TableHead>
                    <TableRow>
                      <TableCell>Document</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Institution</TableCell>
                      <TableCell>Issue Date</TableCell>
                      <TableCell>File Info</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentPageRecords().length > 0 ? (
                      getCurrentPageRecords().map((record) => (
                        <TableRow
                          key={record.id}
                          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography variant="subtitle1" fontWeight="medium">{record.title}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{record.description}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getRecordTypeIcon(record.recordType)}
                              label={record.recordType.charAt(0).toUpperCase() + record.recordType.slice(1)}
                              size="small"
                              color={
                                record.recordType === 'transcript' ? 'primary' :
                                record.recordType === 'certificate' ? 'success' :
                                record.recordType === 'award' ? 'secondary' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <School fontSize="small" />
                              <Typography variant="body2">{record.institution}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarMonth fontSize="small" />
                              <Typography variant="body2">{formatDate(record.issueDate)}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {record.fileType} • {record.fileSize}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Document">
                              <IconButton color="primary">
                                <Description />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                              <IconButton color="primary">
                                <Download />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Info sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            <Typography variant="h6">No records found</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Try adjusting your search or filter criteria
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {getFilteredRecords().length > recordsPerPage && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handlePageChange} 
                    color="primary" 
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>
    </StudentLayout>
  );
};

export default LegacyRecords; 