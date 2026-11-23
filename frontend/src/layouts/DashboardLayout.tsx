import React, { useState, useEffect, useCallback } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { initNotifications } from '../store/slices/notificationsSlice';
import { useGetNotificationsQuery } from '../api/notificationsApi';
import { useToast } from '../context/ToastContext';
import { DashboardSidebar } from './DashboardSidebar';
import { DashboardHeader } from './DashboardHeader';
import { LogoutDialog } from './LogoutDialog';
import { useDashboardSocket } from './useDashboardSocket';

const DRAWER_WIDTH = 250;

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { showInfo } = useToast();

  // Socket.IO real-time listener & window catch-up
  useDashboardSocket(user);

  // Notifications initial fetch & polling
  const { data: notifData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 8000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  useEffect(() => {
    if (notifData) {
      dispatch(
        initNotifications({
          items: notifData.items,
          unreadCount: notifData.unreadCount,
          totalCount: notifData.totalCount
        })
      );
    }
  }, [notifData, dispatch]);

  const handleOpenLogout = useCallback(() => {
    setLogoutDialogOpen(true);
    if (isMobile) setMobileOpen(false);
  }, [isMobile]);

  const handleConfirmLogout = useCallback(() => {
    setLogoutDialogOpen(false);
    dispatch(logout());
    showInfo('Tizimdan muvaffaqiyatli chiqdingiz.');
    navigate('/login');
  }, [dispatch, navigate, showInfo]);

  const handleOpenRequest = useCallback((requestId: number) => {
    navigate(`/admin/requests?requestId=${requestId}`);
  }, [navigate]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#FFFFFF', borderRight: '1px solid #E2E8F0' }
          }}
        >
          <DashboardSidebar
            user={user}
            onLogoutClick={handleOpenLogout}
            onNavigate={() => setMobileOpen(false)}
          />
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              bgcolor: '#FFFFFF',
              borderRight: '1px solid #E2E8F0',
              boxSizing: 'border-box'
            }
          }}
          open
        >
          <DashboardSidebar user={user} onLogoutClick={handleOpenLogout} />
        </Drawer>
      </Box>

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <DashboardHeader
          user={user}
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onOpenRequest={handleOpenRequest}
        />

        <Box component="main" sx={{ flexGrow: 1, px: { xs: 2, md: 3.5 }, py: 3, pb: 6 }}>
          {children}
        </Box>
      </Box>

      <LogoutDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </Box>
  );
};
