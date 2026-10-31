import { baseApi } from './baseApi';
import { AdminUser } from '../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<{ token: string; user: AdminUser }, { username: string; password: string }>({
      query: (body) => ({
        url: '/auth/login',
        method: 'POST',
        body
      })
    }),
    getMe: builder.query<{ user: AdminUser }, void>({
      query: () => '/auth/me'
    })
  })
});

export const { useLoginMutation, useGetMeQuery, useLazyGetMeQuery } = authApi;
