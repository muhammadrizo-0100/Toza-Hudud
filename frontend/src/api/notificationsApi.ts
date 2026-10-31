import { baseApi } from './baseApi';
import { AppNotificationItem } from '../types';

export interface NotificationsResponse {
  items: AppNotificationItem[];
  unreadCount: number;
  totalCount: number;
}

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, { limit?: number } | void>({
      query: (params) => ({
        url: '/notifications',
        method: 'GET',
        params: params || { limit: 30 }
      }),
      providesTags: ['NOTIFICATIONS']
    }),
    markNotificationAsRead: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH'
      }),
      invalidatesTags: ['NOTIFICATIONS']
    }),
    markAllNotificationsAsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH'
      }),
      invalidatesTags: ['NOTIFICATIONS']
    }),
    deleteNotificationApi: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/notifications/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['NOTIFICATIONS']
    }),
    clearAllNotificationsApi: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/notifications/clear',
        method: 'DELETE'
      }),
      invalidatesTags: ['NOTIFICATIONS']
    })
  })
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationApiMutation,
  useClearAllNotificationsApiMutation
} = notificationsApi;
