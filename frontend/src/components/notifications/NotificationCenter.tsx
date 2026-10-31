import React, { useState, useMemo, useCallback } from 'react';
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Avatar,
  Popover,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DeleteSweepOutlinedIcon from '@mui/icons-material/DeleteSweepOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassTopOutlinedIcon from '@mui/icons-material/HourglassTopOutlined';
import AddAlertOutlinedIcon from '@mui/icons-material/AddAlertOutlined';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  toggleSound
} from '../../store/slices/notificationsSlice';
import {
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationApiMutation,
  useClearAllNotificationsApiMutation
} from '../../api/notificationsApi';
import { AppNotificationItem } from '../../types';

interface NotificationCenterProps {
  onOpenRequest?: (requestId: number) => void;
}

function formatNotificationTime(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Hozirgina';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} daqiqa oldin`;
    if (diffSec < 86400 && d.getDate() === now.getDate()) {
      return `Bugun, ${d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function getIcon(kind: string, status: string) {
  if (status === 'completed') {
    return <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#059669' }} />;
  }
  if (status === 'submitted') {
    return <HourglassTopOutlinedIcon sx={{ fontSize: 18, color: '#0284C7' }} />;
  }
  if (status === 'in_progress') {
    return <EngineeringOutlinedIcon sx={{ fontSize: 18, color: '#D97706' }} />;
  }
  return <AddAlertOutlinedIcon sx={{ fontSize: 18, color: '#DC2626' }} />;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onOpenRequest }) => {
  const dispatch = useAppDispatch();
  const { items, unreadCount, totalCount, soundEnabled } = useAppSelector((state) => state.notifications);

  const [markReadApi] = useMarkNotificationAsReadMutation();
  const [markAllReadApi] = useMarkAllNotificationsAsReadMutation();
  const [deleteApi] = useDeleteNotificationApiMutation();
  const [clearAllApi] = useClearAllNotificationsApiMutation();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'unread'>('all');

  const open = Boolean(anchorEl);

  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const filteredItems = useMemo(
    () => (filterTab === 'unread' ? items.filter((it) => !it.isRead) : items),
    [filterTab, items]
  );

  const totalDisplayCount = useMemo(
    () => (totalCount > 0 ? totalCount : Math.max(items.length, unreadCount)),
    [totalCount, items.length, unreadCount]
  );

  const handleItemClick = useCallback(
    (item: AppNotificationItem) => {
      if (!item.isRead) {
        dispatch(markAsRead(item.id));
        markReadApi(item.id).catch(() => undefined);
      }
      handleClose();
      if (onOpenRequest && item.requestId) {
        onOpenRequest(item.requestId);
      }
    },
    [dispatch, markReadApi, handleClose, onOpenRequest]
  );

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllAsRead());
    markAllReadApi().catch(() => undefined);
  }, [dispatch, markAllReadApi]);

  const handleClearAll = useCallback(() => {
    dispatch(clearAllNotifications());
    clearAllApi().unwrap().catch((err) => {
      console.error('Clear notifications failed:', err);
    });
  }, [dispatch, clearAllApi]);

  const handleMarkItemRead = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      dispatch(markAsRead(id));
      markReadApi(id).catch(() => undefined);
    },
    [dispatch, markReadApi]
  );

  const handleDeleteItem = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      dispatch(removeNotification(id));
      deleteApi(id).catch(() => undefined);
    },
    [dispatch, deleteApi]
  );

  return (
    <>
      <Tooltip title="Bildirishnomalar">
        <IconButton
          onClick={handleClick}
          color={open ? 'primary' : 'default'}
          sx={(t) => ({
            width: 40,
            height: 40,
            borderRadius: '10px',
            bgcolor: open ? alpha(t.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: alpha(t.palette.primary.main, 0.12)
            }
          })}
        >
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            invisible={unreadCount <= 0}
            overlap="circular"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.68rem',
                height: 18,
                minWidth: 18,
                px: 0.5,
                fontWeight: 700,
                color: '#FFFFFF',
                bgcolor: '#EF4444',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
                pointerEvents: 'none'
              }
            }}
          >
            <NotificationsOutlinedIcon
              sx={{
                color: unreadCount > 0 ? 'primary.main' : '#64748B',
                fontSize: 22,
                transition: 'color 0.2s ease'
              }}
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              width: { xs: 340, sm: 400 },
              maxWidth: '92vw',
              borderRadius: 2.5,
              boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.14)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden'
            }
          }
        }}
      >
        <Box sx={{ px: 2.5, pt: 2, pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle1" fontWeight={700}>
                Bildirishnomalar
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  size="small"
                  label={`${unreadCount} ta yangi`}
                  color="primary"
                  sx={{ height: 22, fontWeight: 700, fontSize: '0.72rem' }}
                />
              )}
            </Stack>

            <Stack direction="row" spacing={0.5}>
              <Tooltip title={soundEnabled ? 'Ovoz yoniq' : 'Ovoz o‘chiq'}>
                <IconButton size="small" onClick={() => dispatch(toggleSound())}>
                  {soundEnabled ? (
                    <VolumeUpOutlinedIcon fontSize="small" color="action" />
                  ) : (
                    <VolumeOffOutlinedIcon fontSize="small" color="disabled" />
                  )}
                </IconButton>
              </Tooltip>

              {unreadCount > 0 && (
                <Tooltip title="Barchasini o‘qilgan qilish">
                  <IconButton size="small" onClick={handleMarkAllRead}>
                    <DoneAllOutlinedIcon fontSize="small" color="primary" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          <Tabs
            value={filterTab}
            onChange={(_, val) => setFilterTab(val)}
            sx={{
              minHeight: 34,
              mt: 1,
              '& .MuiTab-root': {
                minHeight: 30,
                py: 0.5,
                px: 1.5,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab value="all" label={`Barchasi (${totalDisplayCount})`} />
            <Tab value="unread" label={`O‘qilmagan (${unreadCount})`} />
          </Tabs>
        </Box>

        <Divider />

        <List sx={{ p: 0, maxHeight: 360, overflowY: 'auto' }}>
          {filteredItems.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {filterTab === 'unread' ? 'O‘qilmagan bildirishnomalar yo‘q' : 'Bildirishnomalar mavjud emas'}
              </Typography>
            </Box>
          ) : (
            filteredItems.map((item) => (
              <ListItemButton
                key={item.id}
                onClick={() => handleItemClick(item)}
                sx={{
                  px: 2,
                  py: 1.2,
                  borderLeft: item.isRead ? '3px solid transparent' : '3px solid #059669',
                  bgcolor: item.isRead ? 'transparent' : 'rgba(5, 150, 105, 0.04)',
                  '&:hover': {
                    bgcolor: item.isRead ? 'rgba(0, 0, 0, 0.03)' : 'rgba(5, 150, 105, 0.08)'
                  }
                }}
              >
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#F1F5F9' }}>
                    {getIcon(item.kind, item.status)}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Typography variant="body2" fontWeight={item.isRead ? 600 : 700} color={item.isRead ? 'text.primary' : '#047857'}>
                      {item.title}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'block' }}>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.3
                        }}
                      >
                        {item.message}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        sx={{
                          color: '#94A3B8',
                          fontSize: '0.68rem',
                          fontWeight: 500,
                          mt: 0.3,
                          display: 'block'
                        }}
                      >
                        {formatNotificationTime(item.createdAt)}
                      </Typography>
                    </Box>
                  }
                />

                <Stack direction="row" spacing={0.25} alignItems="center">
                  {!item.isRead && (
                    <IconButton size="small" onClick={(e) => handleMarkItemRead(e, item.id)}>
                      <DoneAllOutlinedIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={(e) => handleDeleteItem(e, item.id)}>
                    <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </ListItemButton>
            ))
          )}
        </List>

        <Divider />

        <Box sx={{ p: 1, px: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#F8FAFC' }}>
          <Button
            size="small"
            startIcon={<DeleteSweepOutlinedIcon sx={{ fontSize: 16 }} />}
            onClick={handleClearAll}
            disabled={items.length === 0}
            color="inherit"
            sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}
          >
            Tarixni tozalash
          </Button>
        </Box>
      </Popover>
    </>
  );
};
