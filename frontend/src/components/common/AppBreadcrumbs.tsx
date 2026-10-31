import React from 'react';
import { Breadcrumbs, Link, Typography, Stack, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import { useNavigate } from 'react-router-dom';

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
            onClick={() => navigate('/admin')}
          >
            <HomeOutlinedIcon sx={{ mr: 0.5, fontSize: 17 }} />
            Bosh sahifa
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
