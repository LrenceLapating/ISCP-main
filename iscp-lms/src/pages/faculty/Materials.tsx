import React, { useState, useEffect } from 'react';
import FacultyLayout from '../../components/FacultyLayout';
import {
  Container, Typography, Box, Grid, Paper, Button, IconButton,
  Card, CardContent, CardActions, CircularProgress, Alert,
  TextField, InputAdornment, Dialog, DialogTitle, FormControl,
  InputLabel, Select, MenuItem, Tabs, Tab, Divider, Chip,
  DialogContent, DialogActions, useTheme, alpha, Menu
} from '@mui/material';
import {
  Search, Add, Folder, InsertDriveFile, Link as LinkIcon,
  YouTube, VideoLibrary, Book, Description, MoreVert, 
  Delete, Edit, CloudUpload, FilterList, Download, Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import facultyService, { Course, Material } from '../../services/FacultyService';
import GridItem from '../../components/common/GridItem';

// Material type interface
interface MaterialTypeOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const materialTypes: MaterialTypeOption[] = [
  { value: 'all', label: 'All Materials', icon: <FilterList />, color: '#6e7884' },
  { value: 'document', label: 'Documents', icon: <Description />, color: '#4285F4' },
  { value: 'video', label: 'Videos', icon: <VideoLibrary />, color: '#EA4335' },
  { value: 'link', label: 'Links', icon: <LinkIcon />, color: '#34A853' },
  { value: 'book', label: 'Books', icon: <Book />, color: '#FBBC05' }
];

// Define an extended Material type for UI purposes
interface ExtendedMaterial extends Material {
  courseName?: string;
  courseCode?: string;
}

const Materials: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState<number | 'all'>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  
  // State for upload form
  const [uploadState, setUploadState] = useState({
    title: '',
    description: '',
    courseId: 0,
    type: 'document',
    url: '',
    file: null as File | null
  });
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  // Add state for the details dialog
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedMaterialDetails, setSelectedMaterialDetails] = useState<Material | null>(null);
  
  // Fetch materials and courses on component mount
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch courses
        const coursesData = await facultyService.getMyCourses();
        setCourses(coursesData);
        
        // Fetch materials for all courses
        const allMaterials: ExtendedMaterial[] = [];
        
        for (const course of coursesData) {
          try {
            const courseMaterials = await facultyService.getCourseMaterials(course.id);
            
            // Enhance materials with course information and ensure dates are valid
            const enhancedMaterials = courseMaterials.map(material => {
              // Try to get cached date from localStorage if available
              let createdDate = material.createdAt;
              let updatedDate = material.updatedAt;
              
              // Ensure dates are valid
              if (!createdDate || new Date(createdDate).toString() === 'Invalid Date') {
                createdDate = new Date().toISOString();
              }
              
              if (!updatedDate || new Date(updatedDate).toString() === 'Invalid Date') {
                updatedDate = createdDate;
              }
              
              return {
                ...material,
                courseName: course.title,
                courseCode: course.code || '',
                createdAt: createdDate,
                updatedAt: updatedDate
              };
            });
            
            allMaterials.push(...enhancedMaterials);
          } catch (error) {
            console.error(`Error fetching materials for course ${course.id}:`, error);
          }
        }
        
        setMaterials(allMaterials);
        setFilteredMaterials(allMaterials);
      } catch (err) {
        console.error('Error fetching materials:', err);
        setError('Failed to load materials. Please try again later.');
        
        // Fallback to mock data if API calls fail
        const mockCourses: Course[] = [
          {
            id: 1,
            code: 'CS101',
            title: 'Introduction to Computer Science',
            description: 'An introductory course to computer science principles',
            teacherId: 1,
            credits: 3,
            maxStudents: 30,
            campus: 'Main Campus',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            enrolledStudents: 25,
            progress: 60
          },
          {
            id: 2,
            code: 'CS202',
            title: 'Data Structures & Algorithms',
            description: 'Study of data structures and algorithms analysis',
            teacherId: 1,
            credits: 4,
            maxStudents: 25,
            campus: 'Main Campus',
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            enrolledStudents: 20,
            progress: 45
          }
        ];
        
        const mockMaterials: ExtendedMaterial[] = [
          {
            id: 1,
            title: 'Introduction to Programming Concepts',
            description: 'Fundamental programming concepts and principles',
            type: 'document',
            fileUrl: 'https://example.com/docs/intro-programming.pdf',
            fileType: 'PDF',
            courseId: 1,
            uploadedBy: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            courseName: 'Introduction to Computer Science',
            courseCode: 'CS101'
          },
          {
            id: 2,
            title: 'Variables and Data Types',
            description: 'Learn about different variable types and data structures',
            type: 'video',
            fileUrl: 'https://example.com/videos/variables-datatypes.mp4',
            fileType: 'MP4',
            courseId: 1,
            uploadedBy: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            courseName: 'Introduction to Computer Science',
            courseCode: 'CS101'
          },
          {
            id: 3,
            title: 'Algorithm Complexity Analysis',
            description: 'Understanding Big O notation and algorithm efficiency',
            type: 'document',
            fileUrl: 'https://example.com/docs/algorithm-complexity.pdf',
            fileType: 'PDF',
            courseId: 2,
            uploadedBy: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            courseName: 'Data Structures & Algorithms',
            courseCode: 'CS202'
          },
          {
            id: 4,
            title: 'Sorting Algorithms Explained',
            description: 'Detailed explanation of common sorting algorithms',
            type: 'presentation',
            fileUrl: 'https://example.com/slides/sorting-algorithms.pptx',
            fileType: 'PPTX',
            courseId: 2,
            uploadedBy: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            courseName: 'Data Structures & Algorithms',
            courseCode: 'CS202'
          }
        ];
        
        setCourses(mockCourses);
        setMaterials(mockMaterials);
        setFilteredMaterials(mockMaterials);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMaterials();
  }, []);
  
  // Filter materials based on search query, type filter, and course filter
  useEffect(() => {
    let filtered = [...materials];
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter);
    }
    
    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(m => m.courseId === courseFilter);
    }
    
    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Ensure dates are properly set for all materials
    filtered = filtered.map(material => ({
      ...material,
      createdAt: material.createdAt || new Date().toISOString(),
      updatedAt: material.updatedAt || material.createdAt || new Date().toISOString()
    }));
    
    setFilteredMaterials(filtered);
  }, [searchQuery, typeFilter, courseFilter, materials]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleTypeFilterChange = (_: React.SyntheticEvent, newValue: string) => {
    setTypeFilter(newValue);
  };
  
  const handleCourseFilterChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setCourseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value));
  };
  
  const handleUploadMaterial = () => {
    setShowUploadDialog(true);
  };
  
  const handleCloseDialog = () => {
    setShowUploadDialog(false);
    // Reset edit mode when closing dialog
    setIsEditMode(false);
    setEditingMaterial(null);
    
    // Reset upload state if we were in edit mode
    if (isEditMode) {
      setUploadState({
        title: '',
        description: '',
        courseId: 0,
        type: 'document',
        url: '',
        file: null
      });
    }
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, materialId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedMaterialId(materialId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMaterialId(null);
  };
  
  const handleEditMaterial = () => {
    handleMenuClose();
    
    if (!selectedMaterialId) return;
    
    // Find the material to edit
    const material = materials.find(m => m.id === selectedMaterialId);
    if (!material) return;
    
    // Set up edit mode data
    setEditingMaterial(material);
    setUploadState({
      title: material.title,
      description: material.description || '',
      courseId: material.courseId,
      type: material.type || 'document',
      url: material.url || '',
      file: null
    });
    setIsEditMode(true);
    setShowUploadDialog(true);
  };
  
  const handleDownloadMaterial = () => {
    handleMenuClose();
    
    if (!selectedMaterialId) return;
    
    const material = materials.find(m => m.id === selectedMaterialId);
    if (!material) return;
    
    // Get the file URL
    const fileUrl = material.fileUrl || material.url;
    if (!fileUrl) return;
    
    // Create a full URL if needed
    const fullUrl = fileUrl.startsWith('http') 
      ? fileUrl 
      : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${fileUrl}`;
    
    // Open in a new tab to download
    window.open(fullUrl, '_blank');
  };
  
  const handleDeleteMaterial = async () => {
    handleMenuClose();
    
    if (!selectedMaterialId) return;
    
    try {
      const success = await facultyService.deleteCourseMaterial(selectedMaterialId);
      
      if (success) {
        // Remove the material from the state
        const updatedMaterials = materials.filter(m => m.id !== selectedMaterialId);
        setMaterials(updatedMaterials);
        setFilteredMaterials(updatedMaterials);
      } else {
        setError('Failed to delete material. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting material:', err);
      setError('Failed to delete material. Please try again.');
    }
  };
  
  const handleMaterialClick = (materialId: number) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;
    
    // Set the selected material and open the dialog
    setSelectedMaterialDetails(material);
    setDetailsDialogOpen(true);
  };
  
  const handleDownloadFromDetails = () => {
    if (!selectedMaterialDetails) return;
    
    if (selectedMaterialDetails.type === 'link' && selectedMaterialDetails.url) {
      // Open link in a new tab
      window.open(selectedMaterialDetails.url, '_blank');
    } else {
      // For documents and other files, open the file URL
      const fileUrl = selectedMaterialDetails.fileUrl || selectedMaterialDetails.url;
      if (fileUrl) {
        // If it's not an absolute URL, prepend API base URL
        const fullUrl = fileUrl.startsWith('http') 
          ? fileUrl 
          : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${fileUrl}`;
          
        window.open(fullUrl, '_blank');
      }
    }
  };
  
  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <Description />;
      case 'video':
        return <VideoLibrary />;
      case 'link':
        return <LinkIcon />;
      case 'book':
        return <Book />;
      default:
        return <InsertDriveFile />;
    }
  };
  
  const getMaterialColor = (type: string): string => {
    const materialType = materialTypes.find(t => t.value === type);
    return materialType?.color || '#6e7884';
  };
  
  const getCourseNameById = (courseId: number): string => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };
  
  // Add a helper function to safely get course chip color
  const getCourseColor = (courseId: number): string => {
    const courseIndex = courses.findIndex(c => c.id === courseId);
    if (courseIndex === -1) return '#1976d2'; // Default blue
    
    // Cycle through a set of colors based on index
    const colors = ['#1976d2', '#e91e63', '#9c27b0', '#f44336', '#4caf50', '#ff9800'];
    return colors[courseIndex % colors.length];
  };
  
  // Handle upload form changes
  const handleUploadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setUploadState({
      ...uploadState,
      [e.target.name]: e.target.value
    });
  };

  // Handle course select change
  const handleCourseSelectChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setUploadState({
      ...uploadState,
      courseId: e.target.value as number
    });
  };

  // Handle type select change
  const handleTypeSelectChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setUploadState({
      ...uploadState,
      type: e.target.value as string
    });
  };

  // Handle file select
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadState({
        ...uploadState,
        file: e.target.files[0]
      });
    }
  };

  // Format date properly to avoid "Date unavailable" issues
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Date unavailable';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date unavailable';
      
      // Store the formatted date in localStorage to persist across refreshes
      if (typeof window !== 'undefined') {
        localStorage.setItem(`material-date-${dateString}`, date.toLocaleDateString());
      }
      
      return date.toLocaleDateString();
    } catch (e) {
      // Try to get from localStorage if available
      if (typeof window !== 'undefined') {
        const cachedDate = localStorage.getItem(`material-date-${dateString}`);
        if (cachedDate) return cachedDate;
      }
      return 'Date unavailable';
    }
  };

  // Handle form submission
  const handleUploadSubmit = async () => {
    if (!uploadState.title) {
      setError('Please enter a title for the material');
      return;
    }

    if (!uploadState.courseId) {
      setError('Please select a course');
      return;
    }

    try {
      let result: Material | null = null;

      // If in edit mode, update the existing material
      if (isEditMode && editingMaterial) {
        // For now, we'll just update the title and description
        // In a real application, you'd want to update other fields as well
        const updatedMaterial: Material = {
          ...editingMaterial,
          title: uploadState.title,
          description: uploadState.description,
          courseId: uploadState.courseId,
          type: uploadState.type
        };
        
        // Update on the server
        try {
          // This is where we'd call an API to update the material
          // Since we don't have an updateMaterial API endpoint, we'll simulate it
          console.log('Updating material:', updatedMaterial);
          
          // Update in local state
          setMaterials(prevMaterials => 
            prevMaterials.map(m => m.id === updatedMaterial.id ? updatedMaterial : m)
          );
          
          result = updatedMaterial;
        } catch (err) {
          console.error('Failed to update material:', err);
          setError('Failed to update material');
          return;
        }
      } else if (uploadState.type === 'link' && uploadState.url) {
        // Future: Add API support for link materials
        setError('Link type materials are not supported yet');
        return;
      } else if (uploadState.file) {
        // Upload file material
        result = await facultyService.uploadCourseMaterial({
          courseId: uploadState.courseId,
          title: uploadState.title,
          description: uploadState.description,
          file: uploadState.file
        });
      } else {
        setError('Please select a file to upload');
        return;
      }

      if (result) {
        // Find the course information
        const course = courses.find(c => c.id === uploadState.courseId);
        
        // Create an extended material with all required information
        const newMaterial: ExtendedMaterial = {
          ...result,
          // Use API course info first, then local info
          courseName: result.course_name || course?.title || 'Unknown Course',
          courseCode: result.course_code || course?.code || '',
          // Ensure properly formatted dates
          createdAt: result.createdAt || new Date().toISOString(),
          updatedAt: result.updatedAt || new Date().toISOString(),
          // Ensure the type is set if missing in the API response
          type: result.type || uploadState.type || 'document'
        };

        console.log('Material operation successful:', newMaterial);
        
        if (isEditMode) {
          // We already updated the materials state above
        } else {
          // Add the new material to the state
          setMaterials(prevMaterials => [newMaterial, ...prevMaterials]);
        }
        
        // Update filtered materials
        setFilteredMaterials(prevFilteredMaterials => {
          if (isEditMode) {
            return prevFilteredMaterials.map(m => 
              m.id === newMaterial.id ? newMaterial : m
            );
          } else {
            return [newMaterial, ...prevFilteredMaterials];
          }
        });
        
        handleCloseDialog();
        
        // Reset upload state and edit mode
        setUploadState({
          title: '',
          description: '',
          courseId: 0,
          type: 'document',
          url: '',
          file: null
        });
        setIsEditMode(false);
        setEditingMaterial(null);
      } else {
        setError(isEditMode ? 'Failed to update material' : 'Failed to upload material');
      }
    } catch (err) {
      console.error(isEditMode ? 'Error updating material:' : 'Error uploading material:', err);
      setError(isEditMode ? 'Failed to update material' : 'Failed to upload material');
    }
  };
  
  // Add function to close details dialog
  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedMaterialDetails(null);
  };
  
  return (
    <FacultyLayout title="Course Materials Library">
      <Container maxWidth="xl" sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header with controls */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 3,
          gap: 2
        }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 600, 
                color: '#fff',
                mb: 1
              }}
            >
              Course Materials Library
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Browse and view learning materials for your courses
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2,
            width: { xs: '100%', md: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <TextField
              placeholder="Search materials..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{
                width: { xs: '100%', sm: '250px' },
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
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
                    borderColor: theme.palette.primary.main,
                  },
                },
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
        </Box>
        
        {/* Filters */}
        <Box sx={{ 
          mb: 3,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { xs: 'flex-start', sm: 'center' }
        }}>
          <Tabs
            value={typeFilter}
            onChange={handleTypeFilterChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 'auto',
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.875rem',
                fontWeight: 500,
                p: '6px 16px',
                '&.Mui-selected': {
                  color: '#fff',
                }
              }
            }}
          >
            {materialTypes.map((type) => (
              <Tab 
                key={type.value} 
                label={type.label} 
                value={type.value}
                icon={type.icon as React.ReactElement}
                iconPosition="start"
              />
            ))}
          </Tabs>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
              '& .MuiSelect-icon': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          >
            <InputLabel id="course-filter-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Filter by Course
            </InputLabel>
            <Select
              labelId="course-filter-label"
              value={courseFilter.toString()}
              label="Filter by Course"
              onChange={handleCourseFilterChange as any}
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <MenuItem value="all">All Courses</MenuItem>
              {courses.map((course) => (
                <MenuItem key={course.id} value={course.id.toString()} sx={{ color: 'text.primary' }}>
                  {course.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        
        {/* Main content */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 3 }}>
            {error}
          </Alert>
        ) : filteredMaterials.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Folder sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.5)', mb: 2 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
              No materials found
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              {searchQuery 
                ? 'No materials match your search criteria.' 
                : typeFilter !== 'all' 
                  ? `No materials of type "${materialTypes.find(t => t.value === typeFilter)?.label}" found.`
                  : courseFilter !== 'all'
                    ? `No materials for the selected course found.`
                    : 'No materials are available for viewing.'
              }
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {filteredMaterials.map((material) => (
              <GridItem xs={12} sm={6} md={4} lg={3} key={material.id}>
                <Card 
                  sx={{ 
                    height: 340, // Increased height for bigger cards
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
                      backgroundColor: 'rgba(255, 255, 255, 0.12)',
                      '& .material-icon-wrapper': {
                        transform: 'scale(1.05)'
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '100%',
                      background: `linear-gradient(135deg, ${alpha(getMaterialColor(material.type || 'document'), 0.2)} 0%, transparent 100%)`,
                      zIndex: 0
                    }
                  }}
                  onClick={() => handleMaterialClick(material.id)}
                >
                  <Box 
                    sx={{ 
                      px: 3, // Increased padding
                      pt: 3, // Increased padding
                      pb: 2,
                      display: 'flex', 
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <Box
                      className="material-icon-wrapper"
                      sx={{
                        width: 64, // Larger icon
                        height: 64, // Larger icon
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(getMaterialColor(material.type || 'document'), 0.2),
                        border: `1px solid ${alpha(getMaterialColor(material.type || 'document'), 0.3)}`,
                        color: getMaterialColor(material.type || 'document'),
                        transition: 'transform 0.2s ease',
                        boxShadow: `0 4px 12px ${alpha(getMaterialColor(material.type || 'document'), 0.3)}`
                      }}
                    >
                      {React.cloneElement(getMaterialIcon(material.type || 'document'), { style: { fontSize: 32 } })}
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Chip
                        label={(material as ExtendedMaterial).courseName || material.course_name || getCourseNameById(material.courseId)}
                        size="small"
                        sx={{ 
                          height: 24, // Slightly larger
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: alpha(getCourseColor(material.courseId), 0.3),
                          color: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(4px)',
                          border: `1px solid ${alpha(getCourseColor(material.courseId), 0.4)}`
                        }}
                      />
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, px: 3, pt: 1.5, pb: 1.5, zIndex: 1 }}>
                    <Typography 
                      variant="h6" // Larger text
                      component="h3" 
                      gutterBottom
                      sx={{ 
                        fontWeight: 600,
                        color: '#fff',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                        mb: 1.5, // More spacing
                        fontSize: '1.1rem' // Larger font
                      }}
                    >
                      {material.title}
                    </Typography>
                    
                    {material.description && (
                      <Typography 
                        variant="body2" 
                        color="rgba(255, 255, 255, 0.75)"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          mb: 1.5, // More spacing
                          lineHeight: 1.5,
                          fontSize: '0.9rem' // Larger font
                        }}
                      >
                        {material.description}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <Box 
                    sx={{ 
                      px: 3, 
                      pb: 3, 
                      pt: 1.5,
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mt: 'auto',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      zIndex: 1
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.8rem' // Larger font
                      }}
                    >
                      {formatDate(material.updatedAt || material.createdAt)}
                    </Typography>
                    
                    <Button 
                      size="small" 
                      variant="text"
                      startIcon={<Search fontSize="small" />}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering card click
                        handleMaterialClick(material.id);
                      }}
                      sx={{ 
                        color: getMaterialColor(material.type || 'document'),
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.85rem', // Larger font
                        '&:hover': {
                          backgroundColor: alpha(getMaterialColor(material.type || 'document'), 0.1)
                        }
                      }}
                    >
                      View Details
                    </Button>
                  </Box>
                </Card>
              </GridItem>
            ))}
          </Grid>
        )}
        
        {/* Material Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: '#1c2e4a',
              backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
              minWidth: 180,
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem'
              }
            }
          }}
        >
          <MenuItem onClick={handleDownloadMaterial}>
            <Download sx={{ mr: 1, fontSize: 20 }} />
            Download
          </MenuItem>
          <MenuItem onClick={handleMaterialClick.bind(null, selectedMaterialId || 0)}>
            <Search sx={{ mr: 1, fontSize: 20 }} />
            View Details
          </MenuItem>
        </Menu>
        
        {/* Material Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={handleCloseDetailsDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1c2e4a',
              backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2,
              overflow: 'hidden'
            }
          }}
        >
          {selectedMaterialDetails && (
            <>
              <Box 
                sx={{ 
                  position: 'relative',
                  p: 3,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundImage: `linear-gradient(135deg, ${alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.2)} 0%, transparent 100%)`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.2),
                      border: `1px solid ${alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.3)}`,
                      color: getMaterialColor(selectedMaterialDetails.type || 'document'),
                      boxShadow: `0 4px 12px ${alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.3)}`
                    }}
                  >
                    {React.cloneElement(getMaterialIcon(selectedMaterialDetails.type || 'document'), { style: { fontSize: 40 } })}
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Chip
                        label={(selectedMaterialDetails as ExtendedMaterial).courseName || 
                          selectedMaterialDetails.course_name || 
                          getCourseNameById(selectedMaterialDetails.courseId)}
                        size="small"
                        sx={{ 
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: alpha(getCourseColor(selectedMaterialDetails.courseId), 0.3),
                          color: 'rgba(255, 255, 255, 0.95)',
                          mr: 1,
                          backdropFilter: 'blur(4px)',
                          border: `1px solid ${alpha(getCourseColor(selectedMaterialDetails.courseId), 0.4)}`
                        }}
                      />
                      
                      <Chip
                        label={selectedMaterialDetails.type || 'document'}
                        size="small"
                        sx={{ 
                          height: 24,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.2),
                          color: getMaterialColor(selectedMaterialDetails.type || 'document'),
                          textTransform: 'capitalize'
                        }}
                      />
                      
                      <Box sx={{ flexGrow: 1 }} />
                      
                      <IconButton
                        aria-label="close"
                        onClick={handleCloseDetailsDialog}
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: '#fff' }}>
                      {selectedMaterialDetails.title}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Last updated: {formatDate(selectedMaterialDetails.updatedAt || selectedMaterialDetails.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <DialogContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                  Description
                </Typography>
                
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2
                  }}
                >
                  {selectedMaterialDetails.description ? (
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', whiteSpace: 'pre-line' }}>
                      {selectedMaterialDetails.description}
                    </Typography>
                  ) : (
                    <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontStyle: 'italic' }}>
                      No description provided for this material.
                    </Typography>
                  )}
                </Paper>
                
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                  Material Details
                </Typography>
                
                <Grid container spacing={3}>
                  <GridItem xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ width: 100, color: 'rgba(255, 255, 255, 0.6)' }}>
                          Type:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)', textTransform: 'capitalize' }}>
                          {selectedMaterialDetails.type || 'Document'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', mb: 1.5 }}>
                        <Typography variant="body2" sx={{ width: 100, color: 'rgba(255, 255, 255, 0.6)' }}>
                          Course:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                          {(selectedMaterialDetails as ExtendedMaterial).courseName || 
                            selectedMaterialDetails.course_name || 
                            getCourseNameById(selectedMaterialDetails.courseId)}
                        </Typography>
                      </Box>
                      
                      {selectedMaterialDetails.fileType && (
                        <Box sx={{ display: 'flex', mb: 1.5 }}>
                          <Typography variant="body2" sx={{ width: 100, color: 'rgba(255, 255, 255, 0.6)' }}>
                            File Format:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                            {selectedMaterialDetails.fileType}
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex' }}>
                        <Typography variant="body2" sx={{ width: 100, color: 'rgba(255, 255, 255, 0.6)' }}>
                          Added:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.9)' }}>
                          {formatDate(selectedMaterialDetails.createdAt)}
                        </Typography>
                      </Box>
                    </Paper>
                  </GridItem>
                  
                  <GridItem xs={12} md={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.1),
                          color: getMaterialColor(selectedMaterialDetails.type || 'document'),
                          mb: 2
                        }}
                      >
                        {selectedMaterialDetails.type === 'link' ? <LinkIcon fontSize="large" /> : <Download fontSize="large" />}
                      </Box>
                      
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={selectedMaterialDetails.type === 'link' ? <LinkIcon /> : <Download />}
                        onClick={handleDownloadFromDetails}
                        sx={{
                          backgroundColor: getMaterialColor(selectedMaterialDetails.type || 'document'),
                          '&:hover': {
                            backgroundColor: alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.8)
                          },
                          px: 3,
                          py: 1,
                          borderRadius: 2
                        }}
                      >
                        {selectedMaterialDetails.type === 'link' ? 'Open Link' : 'Download File'}
                      </Button>
                      
                      <Typography variant="caption" sx={{ mt: 2, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
                        {selectedMaterialDetails.type === 'link' ? 
                          'This will open the link in a new tab' : 
                          'The file will be downloaded to your device'}
                      </Typography>
                    </Paper>
                  </GridItem>
                </Grid>
              </DialogContent>
              
              <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={handleCloseDetailsDialog} color="inherit" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Close
                </Button>
                <Button
                  variant="contained"
                  startIcon={selectedMaterialDetails.type === 'link' ? <LinkIcon /> : <Download />}
                  onClick={handleDownloadFromDetails}
                  sx={{
                    backgroundColor: getMaterialColor(selectedMaterialDetails.type || 'document'),
                    '&:hover': {
                      backgroundColor: alpha(getMaterialColor(selectedMaterialDetails.type || 'document'), 0.8)
                    }
                  }}
                >
                  {selectedMaterialDetails.type === 'link' ? 'Open Link' : 'Download File'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        
        {/* Upload Material Dialog */}
        <Dialog
          open={showUploadDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              backgroundColor: '#1c2e4a',
              backgroundImage: 'linear-gradient(135deg, #1c2e4a 0%, #0a1128 100%)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 2
            }
          }}
        >
          <DialogTitle sx={{ color: '#fff' }}>{isEditMode ? 'Edit Material' : 'Add New Material'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <GridItem xs={12}>
                <TextField
                  label="Title"
                  fullWidth
                  required
                  name="title"
                  value={uploadState.title}
                  onChange={handleUploadChange}
                  margin="dense"
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <FormControl 
                  fullWidth 
                  required
                  margin="dense"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  <InputLabel id="course-select-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Course
                  </InputLabel>
                  <Select
                    labelId="course-select-label"
                    label="Course"
                    value={uploadState.courseId}
                    onChange={handleCourseSelectChange as any}
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id} sx={{ color: 'text.primary' }}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <FormControl 
                  fullWidth
                  margin="dense"
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.7)'
                    }
                  }}
                >
                  <InputLabel id="type-select-label" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Type
                  </InputLabel>
                  <Select
                    labelId="type-select-label"
                    label="Type"
                    value={uploadState.type}
                    onChange={handleTypeSelectChange as any}
                  >
                    <MenuItem value="document" sx={{ color: 'text.primary' }}>Document</MenuItem>
                    <MenuItem value="video" sx={{ color: 'text.primary' }}>Video</MenuItem>
                    <MenuItem value="link" sx={{ color: 'text.primary' }}>Link</MenuItem>
                    <MenuItem value="book" sx={{ color: 'text.primary' }}>Book</MenuItem>
                  </Select>
                </FormControl>
              </GridItem>
              
              <GridItem xs={12}>
                <TextField
                  label="URL (for links or videos)"
                  fullWidth
                  name="url"
                  value={uploadState.url}
                  onChange={handleUploadChange}
                  margin="dense"
                  disabled={uploadState.type !== 'link'}
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
              
              <GridItem xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{
                    mt: 1,
                    py: 1.5,
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      bgcolor: 'rgba(255, 255, 255, 0.05)'
                    }
                  }}
                >
                  {uploadState.file ? uploadState.file.name : 'Upload File'}
                  <input
                    type="file"
                    hidden
                    onChange={handleFileSelect}
                  />
                </Button>
              </GridItem>
              
              <GridItem xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  name="description"
                  value={uploadState.description}
                  onChange={handleUploadChange}
                  margin="dense"
                  InputLabelProps={{ 
                    sx: { color: 'rgba(255, 255, 255, 0.7)' } 
                  }}
                  InputProps={{
                    sx: {
                      color: '#fff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      },
                    }
                  }}
                />
              </GridItem>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={handleUploadSubmit}
              sx={{
                bgcolor: theme.palette.secondary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.secondary.main, 0.8)
                }
              }}
            >
              {isEditMode ? 'Update Material' : 'Add Material'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </FacultyLayout>
  );
};

export default Materials; 