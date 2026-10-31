import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('toza_hudud_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['REQUESTS', 'DISTRICTS', 'MAHALLAS', 'WORKERS', 'STATS', 'NOTIFICATIONS', 'PUBLIC', 'ADMINS'],
  endpoints: () => ({})
});
