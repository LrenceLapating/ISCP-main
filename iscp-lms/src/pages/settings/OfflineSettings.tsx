import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext, WifiOff } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../../components/common/PageLayout';
import OfflineMode from '../../components/student/OfflineMode';

const OfflineSettings: React.FC = () => {
  return (
    <PageLayout title="Offline Settings">
      <Box sx={{ p: 3 }}>
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label="breadcrumb"
          sx={{ mb: 3 }}
        >
          <Link
            component={RouterLink}
            to="/dashboard"
            color="inherit"
            underline="hover"
          >
            Dashboard
          </Link>
          <Link
            component={RouterLink}
            to="/settings"
            color="inherit"
            underline="hover"
          >
            Settings
          </Link>
          <Typography color="text.primary">Offline Settings</Typography>
        </Breadcrumbs>
        
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <WifiOff sx={{ mr: 1.5, fontSize: 30, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            Offline Settings
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Configure how your learning materials are stored and accessed when you don't have an internet connection.
        </Typography>
        
        <OfflineMode onStatusChange={(enabled) => {
          console.log(`Offline mode ${enabled ? 'enabled' : 'disabled'}`);
        }} />
      </Box>
    </PageLayout>
  );
};

export default OfflineSettings; 