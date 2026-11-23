import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Stack,
  Button
} from '@mui/material';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import { useNavigate, useLocation } from 'react-router-dom';
import { AdminUser } from '../types';
import { useTranslation } from '../i18n';
import { buildNavItems } from './navItems';

interface DashboardSidebarProps {
  user: AdminUser | null;
  onLogoutClick: () => void;
  onNavigate?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  user,
  onLogoutClick,
  onNavigate
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, getRoleTitle } = useTranslation();

  const navItems = useMemo(() => buildNavItems(user, t), [user, t]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FFFFFF' }}>
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
              {t('nav.brandTitle')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, fontSize: '0.74rem' }}>
              {t('nav.brandSubtitle')}
            </Typography>
          </Box>
        </Stack>

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
            {getRoleTitle(user?.role, user?.district?.name)}
          </Typography>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
        </Box>
      </Box>

      <List sx={{ px: 1.5, py: 1, flex: 1, overflowY: 'auto' }}>
        {navItems.map((item) => {
          const active = item.path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (onNavigate) onNavigate();
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

      <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#F1F5F9', color: '#334155', fontSize: '0.85rem', fontWeight: 700 }}>
            {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.82rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.fullName || user?.username || 'Foydalanuvchi'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block' }}>
              @{user?.username || 'user'}
            </Typography>
          </Box>
        </Stack>

        <Button
          fullWidth
          variant="outlined"
          size="small"
          startIcon={<LogoutOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={onLogoutClick}
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
            '&:hover': { borderColor: '#F87171', bgcolor: '#FEE2E2', color: '#B91C1C' }
          }}
        >
          {t('nav.logout')}
        </Button>
      </Box>
    </Box>
  );
};
