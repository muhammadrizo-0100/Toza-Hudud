import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { AdminUser, AdminRole } from '../../types';

interface AdminsStatsCardsProps {
  admins: AdminUser[];
  currentUserRole?: AdminRole;
}

export const AdminsStatsCards: React.FC<AdminsStatsCardsProps> = ({ admins, currentUserRole = 'SuperAdmin' }) => {
  const isManager = currentUserRole === 'Manager';
  const total = admins.length;
  const superAdminCount = admins.filter((a) => a.role === 'SuperAdmin').length;
  const managerCount = admins.filter((a) => a.role === 'Manager').length;
  const dispatcherCount = admins.filter((a) => a.role === 'Dispatcher').length;
  const activeCount = admins.filter((a) => a.isActive !== false).length;

  if (isManager) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.84rem' }}>
            Tuman dispetcherlari (Operatorlar)
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#0284C7', fontSize: '1.75rem' }}>
            {dispatcherCount}
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.25,
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.84rem' }}>
            Faol ishlayotgan xodimlar
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669', fontSize: '1.75rem' }}>
            {activeCount}
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.84rem' }}>
          Jami mas’ul xodimlar
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '1.75rem' }}>
          {total}
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.84rem' }}>
          Tuman tozalik boshliqlari
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#059669', fontSize: '1.75rem' }}>
          {managerCount}
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.84rem' }}>
          Tuman dispetcherlari
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#0284C7', fontSize: '1.75rem' }}>
          {dispatcherCount}
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.25,
          borderRadius: '14px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.84rem' }}>
          Viloyat bosh administratorlari
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#4F46E5', fontSize: '1.75rem' }}>
          {superAdminCount}
        </Typography>
      </Paper>
    </Box>
  );
};
