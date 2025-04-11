import React from 'react';
import StudentLayout from '../../components/StudentLayout';
import { Container, Typography } from '@mui/material';
import OfflineMode from '../../components/student/OfflineMode';

const OfflineModePage: React.FC = () => {
  return (
    <StudentLayout title="Offline Mode">
      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Offline Mode
        </Typography>
        
        <OfflineMode onStatusChange={(enabled: boolean) => {
          console.log(`Offline mode ${enabled ? 'enabled' : 'disabled'}`);
        }} />
      </Container>
    </StudentLayout>
  );
};

export default OfflineModePage; 