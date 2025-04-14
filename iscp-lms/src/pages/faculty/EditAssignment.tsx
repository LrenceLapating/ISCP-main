/**
 * EditAssignment.tsx
 * 
 * Author: Marc Laurence Lapating
 * Date: April 8, 2025
 * Assignment: ISCP Learning Management System
 * 
 * Description: Faculty assignment editing page for modifying existing
 * assignment details, due dates, and attachments.
 */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import facultyService from "../../services/FacultyService";
import { Typography, TextField, Button, Box, Paper, Grid, Container, CircularProgress, Snackbar, Alert } from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AttachFile } from "@mui/icons-material";
import FacultyLayout from "../../components/FacultyLayout";
import GridItem from "../../components/common/GridItem";

const EditAssignment: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: new Date(),
    totalPoints: 100,
    file: null as File | null,
    currentFileName: "",
  });

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) return;
      
      try {
        setLoading(true);
        const response = await facultyService.getAssignment(Number(assignmentId));
        
        if (response) {
          setFormData({
            title: response.title,
            description: response.description,
            dueDate: new Date(response.dueDate),
            totalPoints: response.points,
            file: null,
            currentFileName: response.attachmentUrl || "",
          });
        }
      } catch (error) {
        console.error("Error fetching assignment:", error);
        setSnackbar({
          open: true,
          message: "Failed to load assignment details",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData({
        ...formData,
        dueDate: date,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({
        ...formData,
        file: e.target.files[0],
        currentFileName: e.target.files[0].name,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId) return;

    try {
      setLoading(true);
      
      // Create assignment data for submission
      const assignmentData = {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate.toISOString(),
        points: formData.totalPoints,
      };
      
      // Handle file upload separately if needed
      if (formData.file) {
        // This is a simplified approach - you may need to adjust based on your API
        const formData2 = new FormData();
        formData2.append("file", formData.file);
        
        // Upload file first
        // await facultyService.uploadAssignmentFile(Number(assignmentId), formData2);
      }
      
      // Update assignment data
      await facultyService.updateAssignment(Number(assignmentId), assignmentData);
      
      setSnackbar({
        open: true,
        message: "Assignment updated successfully!",
        severity: "success",
      });
      
      // Navigate back to assignments page after a brief delay
      setTimeout(() => {
        navigate("/faculty/assignments");
      }, 1500);
    } catch (error) {
      console.error("Error updating assignment:", error);
      setSnackbar({
        open: true,
        message: "Failed to update assignment",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  if (loading && !formData.title) {
    return (
      <FacultyLayout title="Edit Assignment">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout title="Edit Assignment">
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: "#1e1e1e", color: "#e0e0e0" }}>
          <Typography variant="h4" gutterBottom sx={{ color: "#90caf9" }}>
            Edit Assignment
          </Typography>
          
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <GridItem xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  variant="outlined"
                  InputLabelProps={{ sx: { color: "#90caf9" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#555" },
                      "&:hover fieldset": { borderColor: "#90caf9" },
                      "&.Mui-focused fieldset": { borderColor: "#90caf9" },
                    },
                    "& .MuiInputBase-input": { color: "#e0e0e0" },
                  }}
                />
              </GridItem>
              
              <GridItem xs={12}>
                <TextField
                  required
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  variant="outlined"
                  multiline
                  rows={4}
                  InputLabelProps={{ sx: { color: "#90caf9" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#555" },
                      "&:hover fieldset": { borderColor: "#90caf9" },
                      "&.Mui-focused fieldset": { borderColor: "#90caf9" },
                    },
                    "& .MuiInputBase-input": { color: "#e0e0e0" },
                  }}
                />
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Due Date"
                    value={formData.dueDate}
                    onChange={handleDateChange}
                    sx={{
                      width: "100%",
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#555" },
                        "&:hover fieldset": { borderColor: "#90caf9" },
                        "&.Mui-focused fieldset": { borderColor: "#90caf9" },
                      },
                      "& .MuiInputBase-input": { color: "#e0e0e0" },
                    }}
                  />
                </LocalizationProvider>
              </GridItem>
              
              <GridItem xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Total Points"
                  name="totalPoints"
                  type="number"
                  value={formData.totalPoints}
                  onChange={handleChange}
                  variant="outlined"
                  InputProps={{ inputProps: { min: 0, max: 100 } }}
                  InputLabelProps={{ sx: { color: "#90caf9" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "#555" },
                      "&:hover fieldset": { borderColor: "#90caf9" },
                      "&.Mui-focused fieldset": { borderColor: "#90caf9" },
                    },
                    "& .MuiInputBase-input": { color: "#e0e0e0" },
                  }}
                />
              </GridItem>
              
              <GridItem xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<AttachFile />}
                    sx={{ 
                      mr: 2,
                      color: "#90caf9",
                      borderColor: "#555",
                      "&:hover": { borderColor: "#90caf9", backgroundColor: "rgba(144, 202, 249, 0.08)" }
                    }}
                  >
                    Upload File
                    <input
                      type="file"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  {formData.currentFileName && (
                    <Typography variant="body2" sx={{ color: "#90caf9" }}>
                      {formData.currentFileName}
                    </Typography>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: "#aaa" }}>
                  {formData.file ? "New file selected" : formData.currentFileName ? "Current file will be kept" : "No file attached"}
                </Typography>
              </GridItem>
              
              <GridItem xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/faculty/assignments")}
                  sx={{ 
                    color: "#e0e0e0",
                    borderColor: "#555",
                    "&:hover": { borderColor: "#e0e0e0", backgroundColor: "rgba(224, 224, 224, 0.08)" }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ 
                    backgroundColor: "#90caf9",
                    color: "#000",
                    "&:hover": { backgroundColor: "#64b5f6" }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Update Assignment"}
                </Button>
              </GridItem>
            </Grid>
          </Box>
        </Paper>
      </Container>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </FacultyLayout>
  );
};

export default EditAssignment; 