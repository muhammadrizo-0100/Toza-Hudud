import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Stack,
  Chip,
  Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AdminUser } from '../types';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import AppSelectField from '../components/common/AppSelectField';
import { useTranslation, Language } from '../i18n';

interface DashboardHeaderProps {
  user: AdminUser | null;
  isMobile: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onOpenRequest: (requestId: number) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  isMobile,
  mobileOpen,
  onToggleMobile,
  onOpenRequest
}) => {
  const { lang, setLang, t, formatDate, getRoleTitle } = useTranslation();

  const title =
    user?.role === 'SuperAdmin'
      ? t('nav.superAdminTitle')
      : user?.role === 'Manager'
      ? `${user?.district?.name || t('nav.district')} ${t('nav.managerTitle')}`
      : `${user?.district?.name || t('nav.district')} ${t('nav.dispatcherTitle')}`;

  const roleText = getRoleTitle(user?.role, user?.district?.name);

  return (
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
            <IconButton onClick={onToggleMobile} edge="start" sx={{ color: '#64748B' }}>
              <MenuIcon />
            </IconButton>
          )}

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.05rem', md: '1.2rem' }, color: '#0F172A' }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500, display: { xs: 'none', sm: 'block' } }}>
              {user?.fullName || user?.username || 'Xodim'} • {roleText}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            size="small"
            label={formatDate()}
            sx={{
              fontWeight: 600,
              fontSize: '0.74rem',
              bgcolor: '#F1F5F9',
              color: '#475569',
              display: { xs: 'none', md: 'inline-flex' }
            }}
          />

          <NotificationCenter onOpenRequest={onOpenRequest} />

          <Box sx={{ width: 140, display: { xs: 'none', sm: 'block' } }}>
            <AppSelectField
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              options={[
                { value: 'uz', label: 'O‘zbekcha' },
                { value: 'oz', label: 'Ўзбекча' }
              ]}
              sx={{ height: 36, fontSize: '0.82rem' }}
            />
          </Box>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
