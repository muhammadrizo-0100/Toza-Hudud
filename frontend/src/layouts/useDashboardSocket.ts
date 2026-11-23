import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '../store/hooks';
import { baseApi } from '../api/baseApi';
import {
  addNotification,
  markAsRead,
  markAllAsRead,
  clearAllNotifications
} from '../store/slices/notificationsSlice';
import { useToast } from '../context/ToastContext';
import { AdminUser, AppNotificationItem } from '../types';

export function useDashboardSocket(user: AdminUser | null) {
  const dispatch = useAppDispatch();
  const { showInfo } = useToast();

  // Window Focus / Visibility listener: instant catch-up
  useEffect(() => {
    const handleCatchUp = () => {
      if (document.visibilityState === 'visible') {
        dispatch(baseApi.util.invalidateTags(['NOTIFICATIONS', 'REQUESTS', 'STATS']));
      }
    };

    window.addEventListener('focus', handleCatchUp);
    document.addEventListener('visibilitychange', handleCatchUp);
    return () => {
      window.removeEventListener('focus', handleCatchUp);
      document.removeEventListener('visibilitychange', handleCatchUp);
    };
  }, [dispatch]);

  // Real-time Socket.IO listener with auto-reconnection
  useEffect(() => {
    if (!user) return;

    const socket: Socket = io({
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 4000,
      timeout: 10000
    });

    const doSubscribe = () => {
      socket.emit('subscribe', {
        role: user.role,
        districtId: user.districtId,
        adminId: user.id
      });
    };

    socket.on('connect', doSubscribe);
    socket.on('reconnect', () => {
      doSubscribe();
      dispatch(baseApi.util.invalidateTags(['NOTIFICATIONS', 'REQUESTS', 'STATS']));
    });

    socket.on('notification.new', (event: AppNotificationItem & { actorAdminId?: number }) => {
      if (event.actorAdminId && Number(event.actorAdminId) === Number(user.id)) {
        return;
      }
      if ((user.role === 'Inspector' || user.role === 'Driver') && Number(event.recipientAdminId) !== Number(user.id)) {
        return;
      }
      if (user.role === 'Manager' || user.role === 'Dispatcher') {
        if (event.recipientAdminId && Number(event.recipientAdminId) !== Number(user.id)) return;
        if (event.districtId && user.districtId && Number(event.districtId) !== Number(user.districtId)) return;
      }

      dispatch(addNotification(event));
      dispatch(baseApi.util.invalidateTags(['REQUESTS', 'STATS']));
      showInfo(`🔔 ${event.title}: ${event.message}`, 5000);
    });

    socket.on('request.assigned', () => dispatch(baseApi.util.invalidateTags(['REQUESTS', 'STATS'])));
    socket.on('request.updated', () => dispatch(baseApi.util.invalidateTags(['REQUESTS', 'STATS'])));
    socket.on('request.created', () => dispatch(baseApi.util.invalidateTags(['REQUESTS', 'STATS'])));
    socket.on('notification.read', (data: { id: string }) => {
      if (data?.id) dispatch(markAsRead(data.id));
    });
    socket.on('notification.readAll', () => dispatch(markAllAsRead()));
    socket.on('notification.cleared', () => dispatch(clearAllNotifications()));

    return () => {
      socket.removeAllListeners();
      socket.close();
    };
  }, [user, dispatch, showInfo]);
}
