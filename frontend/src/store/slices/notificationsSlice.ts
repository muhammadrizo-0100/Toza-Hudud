import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotificationItem } from '../../types';
import { playNotificationSound } from '../../utils/sound';

interface NotificationsState {
  items: AppNotificationItem[];
  unreadCount: number;
  totalCount: number;
  soundEnabled: boolean;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  totalCount: 0,
  soundEnabled: true
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    initNotifications: (
      state,
      action: PayloadAction<{ items: AppNotificationItem[]; unreadCount: number; totalCount?: number }>
    ) => {
      state.items = action.payload.items;
      state.unreadCount = Math.max(0, Number(action.payload.unreadCount) || 0);
      state.totalCount = Math.max(
        state.unreadCount,
        Number(action.payload.totalCount) || action.payload.items.length
      );
    },
    addNotification: (state, action: PayloadAction<AppNotificationItem>) => {
      const existingIndex = state.items.findIndex((it) => String(it.id) === String(action.payload.id));
      if (existingIndex >= 0) {
        const existing = state.items[existingIndex];
        if (existing.isRead && !action.payload.isRead) {
          state.unreadCount += 1;
        } else if (!existing.isRead && action.payload.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items[existingIndex] = action.payload;
        return;
      }

      state.items.unshift(action.payload);
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }
      if (!action.payload.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount + 1);
      }
      state.totalCount = Math.max(state.unreadCount, state.totalCount + 1);

      if (state.soundEnabled) {
        playNotificationSound();
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((it) => String(it.id) === String(action.payload));
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((it) => {
        it.isRead = true;
      });
      state.unreadCount = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const item = state.items.find((it) => String(it.id) === String(action.payload));
      if (item && !item.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.items = state.items.filter((it) => String(it.id) !== String(action.payload));
      state.totalCount = Math.max(0, state.totalCount - 1);
    },
    clearAllNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.totalCount = 0;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    }
  }
});

export const {
  initNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
  toggleSound
} = notificationsSlice.actions;

export const notificationsReducer = notificationsSlice.reducer;
