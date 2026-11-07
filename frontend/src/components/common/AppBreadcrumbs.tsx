import React from 'react';
import { Breadcrumbs, Link, Typography, Stack, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export const AppBreadcrumbs: React.FC<AppBreadcrumbsProps> = ({ items, showHome = true }) => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const isLeadership = user?.role === 'SuperAdmin' || user?.role === 'Manager';
  const homePath = isLeadership ? '/admin' : '/admin/requests';

  // Dala xodimlari (Inspector, Driver) yoki Dispetcher uchun asosiy bosh sahifa /admin/requests hisoblanadi.
  // Ular o'zlarining asosiy sahifasida turganida, boshqaruv paneliga olib boruvchi "Bosh sahifa >" ortiqcha havolasi ko'rsatilmaydi.
  const isWorkerOnHome =
    !isLeadership &&
    items.length === 1 &&
    (items[0].label === 'Murojaatlar' || items[0].label === 'Mening vazifalarim');

  if (isWorkerOnHome) {
    return (
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography
            sx={{
              color: '#0F172A',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            {items[0].label}
          </Typography>
        </Stack>
      </Box>
    );
  }

  const homeLabel = isLeadership
    ? 'Bosh sahifa'
    : user?.role === 'Inspector' || user?.role === 'Driver'
      ? 'Mening vazifalarim'
      : 'Murojaatlar';

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 16, color: '#94A3B8' }} />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-ol': {
            alignItems: 'center'
          }
        }}
      >
        {showHome && (
          <Link
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: '#64748B',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 500,
              '&:hover': { color: 'primary.main' }
            }}
            onClick={() => navigate(homePath)}
          >
            <HomeOutlinedIcon sx={{ mr: 0.5, fontSize: 17 }} />
            {homeLabel}
          </Link>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          if (isLast || !item.path) {
            return (
              <Stack key={item.label} direction="row" spacing={0.5} alignItems="center">
                {item.icon && <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: '#0F172A' }}>{item.icon}</Box>}
                <Typography
                  sx={{
                    color: '#0F172A',
                    fontSize: '0.82rem',
                    fontWeight: 700
                  }}
                >
                  {item.label}
                </Typography>
              </Stack>
            );
          }

          return (
            <Link
              key={item.label}
              underline="hover"
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#64748B',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 500,
                '&:hover': { color: 'primary.main' }
              }}
              onClick={() => navigate(item.path!)}
            >
              {item.icon && <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>{item.icon}</Box>}
              {item.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default AppBreadcrumbs;
