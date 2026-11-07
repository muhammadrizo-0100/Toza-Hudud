import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotificationItem } from '../../types';
import { playNotificationSound } from '../../utils/sound';

interface NotificationsState {
  items: AppNotificationItem[];
  unreadCount: number;
  totalCount: number;
  soundEnabled: boolean;
  locallyReadIds: string[];
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  totalCount: 0,
  soundEnabled: true,
  locallyReadIds: []
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    initNotifications: (
      state,
      action: PayloadAction<{ items: AppNotificationItem[]; unreadCount: number; totalCount?: number }>
    ) => {
      // Reconcile server items with local read state to prevent race-condition reversion
      const readSet = new Set(state.locallyReadIds);
      const reconciledItems = action.payload.items.map((it) => {
        if (readSet.has(String(it.id))) {
          return { ...it, isRead: true };
        }
        return it;
      });

      state.items = reconciledItems;
      const actualUnread = reconciledItems.filter((it) => !it.isRead).length;
      state.unreadCount = actualUnread;
      state.totalCount = Math.max(actualUnread, Number(action.payload.totalCount) || reconciledItems.length);
    },
    addNotification: (state, action: PayloadAction<AppNotificationItem>) => {
      const incomingId = String(action.payload.id);
      const isLocallyRead = state.locallyReadIds.includes(incomingId);
      const payload: AppNotificationItem = isLocallyRead ? { ...action.payload, isRead: true } : action.payload;

      const existingIndex = state.items.findIndex((it) => String(it.id) === incomingId);
      if (existingIndex >= 0) {
        const existing = state.items[existingIndex];
        // If already exists and marked read, NEVER flip back to unread!
        if (existing.isRead) {
          state.items[existingIndex] = { ...payload, isRead: true };
          return;
        }

        // If transitioning from unread to read
        if (!existing.isRead && payload.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items[existingIndex] = payload;
        return;
      }

      // Brand new incoming notification
      state.items.unshift(payload);
      if (state.items.length > 50) {
        state.items = state.items.slice(0, 50);
      }

      if (!payload.isRead) {
        state.unreadCount = Math.max(0, state.unreadCount + 1);
        if (state.soundEnabled) {
          playNotificationSound();
        }
      }
      state.totalCount = Math.max(state.unreadCount, state.totalCount + 1);
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const idStr = String(action.payload);
      if (!state.locallyReadIds.includes(idStr)) {
        state.locallyReadIds.push(idStr);
      }
      const item = state.items.find((it) => String(it.id) === idStr);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((it) => {
        const idStr = String(it.id);
        if (!state.locallyReadIds.includes(idStr)) {
          state.locallyReadIds.push(idStr);
        }
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
