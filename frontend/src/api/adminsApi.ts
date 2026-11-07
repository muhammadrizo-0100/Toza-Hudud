import { baseApi } from './baseApi';
import { AdminUser, AdminRole } from '../types';

export interface CreateAdminRequest {
  username: string;
  password: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  role: AdminRole;
  districtId?: number | null;
}

export interface UpdateAdminRequest {
  username?: string;
  fullName?: string;
  phone?: string;
  jobTitle?: string;
  password?: string;
  role?: AdminRole;
  districtId?: number | null;
  isActive?: boolean;
}

export const adminsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<AdminUser[], { districtId?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.districtId) {
          queryParams.append('districtId', params.districtId.toString());
        }
        const qs = queryParams.toString();
        return `/admins${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['ADMINS']
    }),

    getAdmin: builder.query<AdminUser, number>({
      query: (id) => `/admins/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'ADMINS', id }]
    }),

    createAdmin: builder.mutation<AdminUser, CreateAdminRequest>({
      query: (body) => ({
        url: '/admins',
        method: 'POST',
        body
      }),
      invalidatesTags: ['ADMINS', 'STATS']
    }),

    updateAdmin: builder.mutation<AdminUser, { id: number; body: UpdateAdminRequest }>({
      query: ({ id, body }) => ({
        url: `/admins/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['ADMINS', 'STATS']
    }),

    deleteAdmin: builder.mutation<{ success: boolean; message: string }, number>({
      query: (id) => ({
        url: `/admins/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ADMINS', 'STATS']
    })
  })
});

export const {
  useGetAdminsQuery,
  useGetAdminQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation
} = adminsApi;
