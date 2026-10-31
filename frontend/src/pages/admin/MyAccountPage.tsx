import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  CircularProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { useNavigate } from 'react-router-dom';

import { useGetMyAccountQuery } from '../../api/statsApi';
import { useToast } from '../../context/ToastContext';
import DataTableCard from '../../components/common/DataTableCard';
import AppButton from '../../components/common/AppButton';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import { StatusBadge } from '../../components/common/StatusBadge';
import { getUserRoleBadgeText } from '../../utils/roles';

export const MyAccountPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { data, isLoading, refetch } = useGetMyAccountQuery();

  if (isLoading || !data) {
    return (
      <Box sx={{ py: 12, textAlign: 'center' }}>
        <CircularProgress size={36} />
      </Box>
    );
  }

  const { user, stats, wasteBreakdown = [], recentTasks = [] } = data;
  const isDriver = user.role === 'Driver' || user.workerRole === 'Driver';
  const isInsp = user.role === 'Inspector' || user.workerRole === 'Inspector';

  const roleLabel = isInsp
    ? 'Hudud nazoratchisi / Usta'
    : isDriver
    ? 'Maxsus texnika haydovchisi'
    : user.role === 'Manager'
    ? 'Tuman Bo‘limi Boshlig‘i'
    : user.role === 'Dispatcher'
    ? 'Tuman Dispetcheri'
    : 'Viloyat Bosh Administratori';

  const wasteTypeLabels: Record<string, string> = {
    maishiy: 'Maishiy chiqindilar',
    qurilish: 'Qurilish chiqindilari',
    xazon: 'Xazon va shoxlar',
    katta_hajmli: 'Katta hajmli chiqindilar',
    noqonuniy: 'Noqonuniy tashlandiq'
  };

  const wasteColors: Record<string, string> = {
    maishiy: '#059669',
    qurilish: '#D97706',
    xazon: '#65A30D',
    katta_hajmli: '#0284C7',
    noqonuniy: '#DC2626'
  };

  return (
    <Stack spacing={2.5}>
      <AppBreadcrumbs items={[{ label: 'Mening hisobim' }]} />

      {/* Header bar */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.35rem', md: '1.65rem' } }}>
            Mening hisobim
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Shaxsiy ma’lumotlar, biriktirilgan vazifalar va shaxsiy samaradorlik ko‘rsatkichlari
          </Typography>
        </Box>

        <AppButton
          variant="secondary"
          size="small"
          onClick={() => {
            refetch();
            showSuccess('Ma’lumotlar yangilandi');
          }}
        >
          Yangilash
        </AppButton>
      </Stack>

      {/* 2-Column Responsive Dashboard Layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '360px 1fr' },
          gap: 3,
          alignItems: 'start'
        }}
      >
        {/* Left Column: Profile Card & Waste types */}
        <Stack spacing={3}>
            {/* User Profile Overview */}
            <DataTableCard sx={{ p: 3, position: 'relative', overflow: 'hidden' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 90,
                  bgcolor: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                  background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                }}
              />

              <Stack alignItems="center" sx={{ position: 'relative', pt: 4, mb: 2 }}>
                <Avatar
                  sx={{
                    width: 84,
                    height: 84,
                    bgcolor: '#FFFFFF',
                    color: '#059669',
                    fontSize: '2rem',
                    fontWeight: 800,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    border: '3px solid #FFFFFF'
                  }}
                >
                  {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
                </Avatar>

                <Typography variant="h6" fontWeight={800} sx={{ mt: 1.5, textAlign: 'center' }}>
                  {user.fullName || user.username}
                </Typography>

                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  @{user.username}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                  <Chip
                    icon={<BadgeOutlinedIcon sx={{ fontSize: '15px !important' }} />}
                    label={roleLabel}
                    size="small"
                    sx={{
                      bgcolor: '#ECFDF5',
                      color: '#065F46',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      border: '1px solid #A7F3D0'
                    }}
                  />
                  <Chip
                    label="Faol"
                    size="small"
                    sx={{
                      bgcolor: '#F0FDF4',
                      color: '#166534',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      '&::before': {
                        content: '""',
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#22C55E',
                        mr: 0.75
                      }
                    }}
                  />
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {/* Profile Details List */}
              <Stack spacing={1.75}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <LocationOnOutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Hudud / Tuman
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {user.district || 'Namangan viloyati'}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <PhoneOutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Aloqa telefoni
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {user.phone || 'Kiritilmagan'}
                    </Typography>
                  </Box>
                </Stack>

                {user.vehicleNumber && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <LocalShippingOutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Maxsus texnika davlat raqami
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          bgcolor: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          letterSpacing: 0.5
                        }}
                      >
                        {user.vehicleNumber}
                      </Typography>
                    </Box>
                  </Stack>
                )}

                {user.createdAt && (
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CalendarTodayOutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Tizimda ro‘yxatdan o‘tgan sana
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {(() => {
                          const d = new Date(user.createdAt);
                          const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
                          return `${d.getDate()}-${months[d.getMonth()]}, ${d.getFullYear()}-yil`;
                        })()}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Stack>
            </DataTableCard>

            {/* Waste type breakdown card */}
            <DataTableCard sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2, fontSize: '1rem' }}>
                Chiqindi yo‘nalishlari taqsimoti
              </Typography>

              {wasteBreakdown.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Hozircha biriktirilgan vazifalar yo‘q
                </Typography>
              ) : (
                <Stack spacing={1.75}>
                  {wasteBreakdown.map((wb) => {
                    const label = wasteTypeLabels[wb.type] || wb.type;
                    const color = wasteColors[wb.type] || '#059669';
                    const pct = stats.total > 0 ? Math.round((wb.count / stats.total) * 100) : 0;
                    return (
                      <Box key={wb.type}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.825rem' }}>
                            {label}
                          </Typography>
                          <Typography variant="body2" fontWeight={700} color="text.secondary">
                            {wb.count} ta ({pct}%)
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#F1F5F9',
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </DataTableCard>
          </Stack>

        {/* Right Column: KPI Cards, Efficiency Gauge & Recent tasks */}
        <Stack spacing={3}>
          {/* KPI Stat Cards Row */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 2
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#EEF2FF', color: '#4F46E5' }}>
                  <AssignmentOutlinedIcon fontSize="small" />
                </Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Jami ishlar
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800} color="#0F172A">
                {stats.total}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#DCFCE7', color: '#16A34A' }}>
                  <CheckCircleOutlinedIcon fontSize="small" />
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#166534' }}>
                  Bajarildi
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800} color="#15803D">
                {stats.completed}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#DBEAFE', color: '#2563EB' }}>
                  <HourglassEmptyOutlinedIcon fontSize="small" />
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#1E40AF' }}>
                  Jarayonda
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800} color="#1D4ED8">
                {stats.inProgress + stats.submitted}
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                bgcolor: '#FEF2F2',
                border: '1px solid #FECACA',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-2px)' }
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: '#FEE2E2', color: '#DC2626' }}>
                  <HighlightOffOutlinedIcon fontSize="small" />
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ color: '#991B1B' }}>
                  Rad etildi
                </Typography>
              </Stack>
              <Typography variant="h4" fontWeight={800} color="#B91C1C">
                {stats.rejected}
              </Typography>
            </Paper>
          </Box>

            {/* Efficiency / Completion Rate Card */}
            <DataTableCard sx={{ p: 3 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                alignItems="center"
                justifyContent="space-between"
              >
                <Box sx={{ flex: 1, minWidth: { sm: 260 } }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <TrendingUpOutlinedIcon sx={{ color: '#059669', fontSize: 24 }} />
                    <Typography variant="h6" fontWeight={800} color="#0F172A">
                      Samaradorlik va Bajarilish Ko‘rsatkichi
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {user.role === 'SuperAdmin'
                      ? 'Viloyat miqyosidagi murojaatlarni sifatli va o‘z vaqtida bartaraf etilishini nazorat qilish va boshqarish samaradorligi.'
                      : user.role === 'Manager'
                      ? 'Tuman bo‘yicha kelib tushgan murojaatlarni o‘z vaqtida hal etish va tozalash brigadalarini boshqarish samaradorligi.'
                      : user.role === 'Dispatcher'
                      ? 'Murojaatlarni qabul qilish, brigadalarga taqsimlash va ijrosini nazorat qilish ko‘rsatkichi.'
                      : 'Sizga biriktirilgan murojaatlarni sifatli tozalash, fotosurat hisobotlarini taqdim etish va mas’ullar tomonidan qabul qilinish ko‘rsatkichi.'}
                  </Typography>

                  <Box sx={{ mt: 2.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        Umumiy holat nisbati:
                      </Typography>
                      <Chip
                        size="small"
                        label={`${stats.completed} / ${stats.total} ta yakunlangan`}
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          height: 24,
                          bgcolor: '#ECFDF5',
                          color: '#059669',
                          borderRadius: '8px'
                        }}
                      />
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={stats.completionRate}
                      sx={{
                        height: 9,
                        borderRadius: 5,
                        bgcolor: '#F1F5F9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: stats.completionRate >= 80 ? '#059669' : stats.completionRate >= 50 ? '#D97706' : '#DC2626',
                          borderRadius: 5
                        }
                      }}
                    />
                  </Box>
                </Box>

                {/* Circular Percentage Meter - Centered and Gorgeous */}
                <Box
                  sx={{
                    position: 'relative',
                    width: 136,
                    height: 136,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#F8FAFC',
                    borderRadius: '50%',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
                  }}
                >
                  {/* Background Track Circle */}
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={118}
                    thickness={4}
                    sx={{
                      color: '#E2E8F0',
                      position: 'absolute'
                    }}
                  />
                  {/* Active Value Circle */}
                  <CircularProgress
                    variant="determinate"
                    value={stats.completionRate}
                    size={118}
                    thickness={4.5}
                    sx={{
                      color: stats.completionRate >= 80 ? '#059669' : stats.completionRate >= 50 ? '#D97706' : '#DC2626',
                      strokeLinecap: 'round',
                      position: 'absolute',
                      transition: 'all 0.5s ease-in-out'
                    }}
                  />
                  {/* Centered Label inside the Ring */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      zIndex: 1
                    }}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 900,
                        color: '#0F172A',
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        fontSize: '1.45rem'
                      }}
                    >
                      {stats.completionRate}%
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.65rem',
                        color: '#64748B',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        mt: 0.5
                      }}
                    >
                      KPI Ball
                    </Typography>
                    <Chip
                      size="small"
                      label={stats.completionRate >= 90 ? "A'lo" : stats.completionRate >= 70 ? "Yaxshi" : stats.completionRate >= 50 ? "O‘rtacha" : "Qoniqarsiz"}
                      sx={{
                        height: 18,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        mt: 0.5,
                        bgcolor: stats.completionRate >= 80 ? '#ECFDF5' : stats.completionRate >= 50 ? '#FEF3C7' : '#FEF2F2',
                        color: stats.completionRate >= 80 ? '#059669' : stats.completionRate >= 50 ? '#D97706' : '#DC2626',
                        borderRadius: '6px'
                      }}
                    />
                  </Box>
                </Box>
              </Stack>
            </DataTableCard>

            {/* Recent Tasks Table */}
            <DataTableCard sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 2.5, pb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.05rem' }}>
                    So‘nggi vazifalar tarixi
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Oxirgi biriktirilgan murojaatlar va ularning holati
                  </Typography>
                </Box>

                <AppButton
                  variant="secondary"
                  size="small"
                  endIcon={<ArrowForwardOutlinedIcon fontSize="small" />}
                  onClick={() => navigate('/admin/requests')}
                >
                  Barcha vazifalar
                </AppButton>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#475569', py: 1.5 }}># ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Mahalla</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Chiqindi turi</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Holat</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#475569' }} align="right">Amal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ py: 4, textAlign: 'center', color: '#64748B' }}>
                          Biriktirilgan topshiriqlar mavjud emas
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentTasks.map((t) => (
                        <TableRow key={t.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                            #{t.id}
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            {t.mahallaName || 'Mahalla ko‘rsatilmagan'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={wasteTypeLabels[t.wasteType || 'maishiy'] || t.wasteType}
                              size="small"
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: 600,
                                bgcolor: '#F1F5F9',
                                color: '#334155'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={t.status as any} />
                          </TableCell>
                          <TableCell align="right">
                            <AppButton
                              variant="action"
                              size="small"
                              onClick={() => navigate(`/admin/requests?requestId=${t.id}`)}
                            >
                              Ko‘rish
                            </AppButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DataTableCard>
        </Stack>
      </Box>
    </Stack>
  );
};

export default MyAccountPage;
