import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Stack,
  Chip,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Tooltip,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogContent,
  DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import QueryStatsOutlinedIcon from '@mui/icons-material/QueryStatsOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ArrowOutwardOutlinedIcon from '@mui/icons-material/ArrowOutwardOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import {
  addNotification,
  initNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications
} from '../store/slices/notificationsSlice';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { useGetNotificationsQuery } from '../api/notificationsApi';
import { useToast } from '../context/ToastContext';
import { AppNotificationItem } from '../types';
import { getUserRoleBadgeText } from '../utils/roles';
import AppSelectField from '../components/common/AppSelectField';

const DRAWER_WIDTH = 250;

function formatTodayDate() {
  const d = new Date();
  const monthsUz = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  return `${d.getDate()} ${monthsUz[d.getMonth()]} ${d.getFullYear()}`;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState('uz');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { showInfo } = useToast();

  const { data: notifData } = useGetNotificationsQuery(undefined, {
    pollingInterval: 30000
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

  // Real-time Socket.IO listener
  useEffect(() => {
    if (!user) return;

    const socket: Socket = io({
      transports: ['polling', 'websocket'],
      withCredentials: true
    });

    socket.on('connect', () => {
      socket.emit('subscribe', {
        role: user.role,
        districtId: user.districtId,
        adminId: user.id
      });
    });

    socket.on('notification.new', (event: AppNotificationItem & { actorAdminId?: number }) => {
      // 1. Never notify the user about their own action
      if (event.actorAdminId && Number(event.actorAdminId) === Number(user.id)) {
        return;
      }

      // 2. Field executors (Driver/Inspector) only receive notifications directly assigned to them
      if ((user.role === 'Inspector' || user.role === 'Driver') && Number(event.recipientAdminId) !== Number(user.id)) {
        return;
      }

      // 3. District Managers and Dispatchers only receive district-specific or direct notifications
      if (user.role === 'Manager' || user.role === 'Dispatcher') {
        if (event.recipientAdminId && Number(event.recipientAdminId) !== Number(user.id)) {
          return;
        }
        if (event.districtId && user.districtId && Number(event.districtId) !== Number(user.districtId)) {
          return;
        }
      }

      dispatch(addNotification(event));
    });

    socket.on('notification.read', (data: { id: string }) => {
      if (data?.id) {
        dispatch(markAsRead(data.id));
      }
    });

    socket.on('notification.readAll', () => {
      dispatch(markAllAsRead());
    });

    socket.on('notification.cleared', () => {
      dispatch(clearAllNotifications());
    });

    return () => {
      socket.disconnect();
    };
  }, [user, dispatch]);

  const handleLogout = useCallback(() => {
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

  const todayLabel = useMemo(() => formatTodayDate(), []);

  // Navigation items matching role
  const navItems = useMemo(() => {
    const role = user?.role;
    const districtName = user?.district?.name;

    if (role === 'SuperAdmin') {
      return [
        { label: 'Viloyat boshqaruv markazi', path: '/admin', icon: <DashboardOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Barcha murojaatlar', path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Viloyat chiqindi xaritasi', path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Tahlil va statistika', path: '/admin/stats', icon: <QueryStatsOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Tuman va mahallalar', path: '/admin/districts', icon: <PlaceOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Tuman rahbarlari va xodimlar', path: '/admin/staff', icon: <GroupOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Mening hisobim', path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
      ];
    }

    if (role === 'Manager') {
      return [
        { label: `${districtName || 'Tuman'} boshqaruvi`, path: '/admin', icon: <DashboardOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Tuman murojaatlari', path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Tuman xaritasi', path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Tuman statistikasi', path: '/admin/stats', icon: <QueryStatsOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Tuman xodimlari va brigadalari', path: '/admin/staff', icon: <GroupOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Mening hisobim', path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
      ];
    }

    if (role === 'Inspector') {
      return [
        { label: 'Mening vazifalarim', path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Hudud xaritasi', path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Mening hisobim', path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
      ];
    }

    if (role === 'Driver') {
      return [
        { label: 'Mening reyslarim', path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Marshrut xaritasi', path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
        { label: 'Mening hisobim', path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
      ];
    }

    // Dispatcher
    return [
      { label: 'Murojaatlar ro‘yxati', path: '/admin/requests', icon: <DeleteSweepOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: 'Chiqindi xaritasi', path: '/admin/map', icon: <MapOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: 'Haydovchilar va brigadalar', path: '/admin/staff', icon: <GroupOutlinedIcon sx={{ fontSize: 19 }} /> },
      { label: 'Mening hisobim', path: '/admin/my-account', icon: <AccountCircleOutlinedIcon sx={{ fontSize: 19 }} /> }
    ];
  }, [user]);

  // Sidebar Content - Inspired directly by Chrono desk (Image 2)
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
      {/* Top Brand & Organization (Chrono desk style) */}
      <Box sx={{ p: 2.5, pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              bgcolor: 'primary.main',
              color: '#FFFFFF',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
            }}
          >
            <DeleteSweepOutlinedIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', lineHeight: 1.2 }}>
              Toza Hudud
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.74rem' }}>
              Sanitar tozalash tizimi
            </Typography>
          </Box>
        </Stack>

        {/* Clean Context Pill */}
        <Box
          sx={{
            mt: 2,
            px: 1.5,
            py: 0.75,
            borderRadius: '8px',
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.78rem' }}>
            {getUserRoleBadgeText(user)}
          </Typography>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
        </Box>
      </Box>

      {/* Navigation Menu (Chrono desk style) */}
      <List sx={{ px: 1.5, py: 1, flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active =
            item.path === '/admin'
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: '10px',
                  py: 1,
                  px: 1.5,
                  bgcolor: active ? '#F0FDF4' : 'transparent',
                  color: active ? 'primary.main' : '#64748B',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: active ? '#ECFDF5' : '#F8FAFC',
                    color: active ? 'primary.main' : '#0F172A'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: active ? 'primary.main' : '#94A3B8' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.84rem',
                    fontWeight: active ? 600 : 500,
                    letterSpacing: '-0.01em'
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Profile Card Docked at Bottom */}
      <Box sx={{ p: 1.5, borderTop: '1px solid #F1F5F9' }}>
        <Box
          onClick={() => {
            navigate('/admin/my-account');
            if (isMobile) setMobileOpen(false);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1.25,
            borderRadius: '10px',
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: '#F1F5F9',
              borderColor: '#CBD5E1'
            }
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'rgba(5, 150, 105, 0.15)',
              color: 'primary.main',
              fontWeight: 700,
              fontSize: '0.85rem',
              mr: 1.25
            }}
          >
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'A'}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle2"
              noWrap
              sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.82rem', lineHeight: 1.2 }}
            >
              {user?.fullName || user?.username || 'Xodim'}
            </Typography>
            <Typography
              variant="caption"
              noWrap
              sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block', mt: 0.25 }}
            >
              {getUserRoleBadgeText(user)}
            </Typography>
          </Box>
        </Box>

        {/* Dedicated Separate Logout Button */}
        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="small"
          startIcon={<LogoutOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={handleLogout}
          sx={{
            mt: 1.25,
            fontSize: '0.78rem',
            color: '#DC2626',
            borderColor: '#FECACA',
            bgcolor: '#FEF2F2',
            borderRadius: '8px',
            py: 0.75,
            fontWeight: 700,
            textTransform: 'none',
            '&:hover': {
              borderColor: '#F87171',
              bgcolor: '#FEE2E2',
              color: '#B91C1C'
            }
          }}
        >
          Tizimdan chiqish
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      {/* Sidebar Navigation */}
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
          {drawerContent}
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
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Sticky Header (Chrono desk style) */}
        <AppBar
          position="sticky"
          color="inherit"
          elevation={0}
          sx={{
            bgcolor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            zIndex: 1100
          }}
        >
          <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, md: 3.5 }, justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {isMobile && (
                <IconButton onClick={() => setMobileOpen(!mobileOpen)} edge="start" sx={{ color: '#64748B' }}>
                  <MenuIcon />
                </IconButton>
              )}

              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: '#0F172A' }}>
                  {user?.role === 'SuperAdmin'
                    ? 'Viloyat Boshqaruv Markazi'
                    : user?.role === 'Manager'
                    ? `${user?.district?.name || 'Tuman'} Tozalik Boshqarmasi`
                    : `${user?.district?.name || 'Tuman'} Dispetcherlik Xizmati`}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
                  {user?.fullName || user?.username || 'Xodim'} • {getUserRoleBadgeText(user)}
                </Typography>
              </Box>
            </Stack>

            {/* Global Search & Actions (Chrono desk style) */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Chip
                size="small"
                label={todayLabel}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.74rem',
                  bgcolor: '#F1F5F9',
                  color: '#475569',
                  display: { xs: 'none', md: 'inline-flex' }
                }}
              />

              <NotificationCenter onOpenRequest={handleOpenRequest} />

              <Box sx={{ width: 130, display: { xs: 'none', sm: 'block' } }}>
                <AppSelectField
                  value={lang}
                  onChange={(e) => setLang(String(e.target.value))}
                  options={[
                    { value: 'uz', label: 'O‘zbekcha' },
                    { value: 'ru', label: 'Русский' }
                  ]}
                  sx={{ height: 36, fontSize: '0.82rem' }}
                />
              </Box>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Content Body */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 2, md: 3.5 },
            py: 3,
            pb: 6
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Logout Confirmation Dialog Modal */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 1.5,
            border: '1px solid #E2E8F0',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.16)'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                bgcolor: '#FEE2E2',
                color: '#DC2626',
                display: 'grid',
                placeItems: 'center'
              }}
            >
              <LogoutOutlinedIcon sx={{ fontSize: 20 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0F172A' }}>
              Tizimdan chiqish
            </Typography>
          </Stack>
          <IconButton
            size="small"
            onClick={() => setLogoutDialogOpen(false)}
            sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: 2, py: 2 }}>
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6 }}>
            Haqiqatan ham tizimdagi hisobingizdan chiqmoqchimisiz? Qayta kirish uchun foydalanuvchi nomi va parolingizni kiritishingiz kerak bo‘ladi.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2, pt: 0.5, pb: 1.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setLogoutDialogOpen(false)}
            sx={{
              flex: 1,
              height: 40,
              borderRadius: '10px',
              color: '#64748B',
              borderColor: '#E2E8F0',
              fontWeight: 600,
              fontSize: '0.88rem',
              textTransform: 'none',
              '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' }
            }}
          >
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmLogout}
            sx={{
              flex: 1,
              height: 40,
              borderRadius: '10px',
              bgcolor: '#DC2626',
              fontWeight: 700,
              fontSize: '0.88rem',
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: '#B91C1C', boxShadow: 'none' }
            }}
          >
            Ha, chiqish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
