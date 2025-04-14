/**
 * Materials.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 5, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Student materials page for accessing course materials,
 * documents, and resources with download capabilities.
 */

import React, { useState, useEffect } from 'react';
import StudentLayout from '../../components/StudentLayout';
import {
  Container,
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Search,
  FilterList,
  Description,
  PictureAsPdf,
  VideoLibrary,
  InsertDriveFile,
  GetApp,
  Link as LinkIcon,
  StarBorder,
  Star,
  ExpandMore,
  School,
  CloudDownload,
  Book,
  FolderOpen,
  Image,
  PresentToAll,
  FolderSpecial
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import studentService from '../../services/StudentService';

// Material item interface
interface Material {
  id: number;
  title: string;
  description?: string;
  fileType: 'pdf' | 'doc' | 'ppt' | 'video' | 'image' | 'link' | 'other';
  fileSize?: string;
  uploadDate: string;
  course: {
    id: number;
    code: string;
    title: string;
    color: string;
  };
  url: string;
  starred: boolean;
  downloadCount?: number;
  author?: string;
  fileUrl?: string;
}

// Get icon based on filetype
const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
      return <PictureAsPdf />;
    case 'doc':
      return <Description />;
    case 'ppt':
      return <PresentToAll />;
    case 'video':
      return <VideoLibrary />;
    case 'image':
      return <Image />;
    case 'link':
      return <LinkIcon />;
    default:
      return <InsertDriveFile />;
  }
};

// Get color based on filetype
const getFileColor = (fileType: string) => {
  switch (fileType) {
    case 'pdf':
      return '#f44336';
    case 'doc':
      return '#2196f3';
    case 'ppt':
      return '#ff9800';
    case 'video':
      return '#9c27b0';
    case 'image':
      return '#4caf50';
    case 'link':
      return '#795548';
    default:
      return '#607d8b';
  }
};

const Materials: React.FC = () => {
  const { authState } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);

  // Load materials and courses
  useEffect(() => {
    // In a real app, fetch from API
    const loadMaterials = async () => {
      try {
        // Get enrolled courses
        const courses = await studentService.getEnrolledCourses();
        setEnrolledCourses(courses);
        
        // Get materials from the API
        const fetchedMaterials = await studentService.getMaterials();
        
        setMaterials(fetchedMaterials);
        setFilteredMaterials(fetchedMaterials);
      } catch (error) {
        console.error('Error loading materials:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load materials',
          severity: 'error'
        });
      }
    };
    
    loadMaterials();
  }, []);

  // Filter materials based on search query and tab
  useEffect(() => {
    let filtered = [...materials];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material => 
        material.title.toLowerCase().includes(query) || 
        (material.description && material.description.toLowerCase().includes(query)) ||
        material.course.title.toLowerCase().includes(query) ||
        material.course.code.toLowerCase().includes(query)
      );
    }
    
    // Apply tab filter
    if (tabValue === 1) { // Recent
      filtered = filtered.sort((a, b) => 
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      ).slice(0, 5);
    } else if (tabValue === 2) { // Starred
      filtered = filtered.filter(material => material.starred);
    }
    
    setFilteredMaterials(filtered);
  }, [searchQuery, tabValue, materials]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Toggle star
  const handleStarToggle = (id: number) => {
    setMaterials(prevMaterials => 
      prevMaterials.map(material => 
        material.id === id ? { ...material, starred: !material.starred } : material
      )
    );
  };

  // Handle file download
  const handleDownload = (id: number) => {
    const material = materials.find(m => m.id === id);
    
    if (!material) {
      setSnackbar({
        open: true,
        message: 'Material not found',
        severity: 'error'
      });
      return;
    }
    
    // Get the file URL from the material
    const fileUrl = material.url || material.fileUrl;
    
    if (!fileUrl) {
      setSnackbar({
        open: true,
        message: 'File URL not available',
        severity: 'error'
      });
      return;
    }
    
    // Create a full URL with the API base URL if needed
    const fullUrl = fileUrl.startsWith('http') 
      ? fileUrl 
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${fileUrl}`;
    
    // Open the URL in a new tab or use the browser's download mechanism
    window.open(fullUrl, '_blank');
    
    // In a real application, would also record the download count
    setMaterials(prevMaterials => 
      prevMaterials.map(material => 
        material.id === id ? 
          { ...material, downloadCount: (material.downloadCount || 0) + 1 } : 
          material
      )
    );
    
    setSnackbar({
      open: true,
      message: 'Download started',
      severity: 'success'
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <StudentLayout title="Learning Materials">
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#fff' }}>
            Course Materials
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Access lecture notes, readings, and other resources for your courses
          </Typography>
        </Box>

        {/* Controls */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 4, alignItems: 'center', justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search materials..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            fullWidth
            sx={{ 
              maxWidth: { sm: 400 },
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Tabs */}
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            mb: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#fff',
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main'
            }
          }}
        >
          <Tab label="All Materials" />
          <Tab label="Recently Added" />
          <Tab label="Starred" />
        </Tabs>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              borderRadius: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Book sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              No materials found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              {searchQuery ? "Try adjusting your search" : "No materials available yet"}
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', mx: -1.5 }}>
            {filteredMaterials.map((material) => (
              <Box key={material.id} sx={{ width: { xs: '100%', md: '50%', lg: '33.33%' }, p: 1.5 }}>
                <Card sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{ 
                    p: 2, 
                    display: 'flex', 
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <Chip
                      label={material.course.code}
                      size="small"
                      sx={{ 
                        bgcolor: material.course.color,
                        color: '#fff',
                        fontWeight: 500
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 'auto',
                        color: 'rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5
                      }}
                    >
                      {material.uploadDate}
                    </Typography>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', mb: 2 }}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: getFileColor(material.fileType),
                          color: '#fff',
                          mr: 2,
                          width: 40,
                          height: 40
                        }}
                      >
                        {getFileIcon(material.fileType)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h2" sx={{ 
                          fontWeight: 500, 
                          color: '#fff',
                          fontSize: '1rem',
                          lineHeight: 1.3,
                          mb: 0.5
                        }}>
                          {material.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}>
                          {material.fileSize && `${material.fileSize} • `}
                          {material.author}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {material.description && (
                      <Typography variant="body2" color="textSecondary" sx={{ 
                        mb: 2,
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        {material.description}
                      </Typography>
                    )}
                    
                    {material.downloadCount !== undefined && (
                      <Typography variant="caption" color="textSecondary" sx={{ 
                        color: 'rgba(255, 255, 255, 0.5)',
                        display: 'block',
                        mt: 1
                      }}>
                        Downloaded {material.downloadCount} times
                      </Typography>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ 
                    p: 2, 
                    pt: 0,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <IconButton 
                      onClick={() => handleStarToggle(material.id)}
                      color={material.starred ? 'primary' : 'default'}
                      sx={{ color: material.starred ? 'primary.main' : 'rgba(255, 255, 255, 0.5)' }}
                    >
                      {material.starred ? <Star /> : <StarBorder />}
                    </IconButton>
                    
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<GetApp />}
                      onClick={() => handleDownload(material.id)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: '#fff',
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.2)'
                        }
                      }}
                    >
                      Download
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Snackbar for notifications */}
        <Snackbar 
          open={snackbar.open} 
          autoHideDuration={5000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
      </Container>
    </StudentLayout>
  );
};

export default Materials; 