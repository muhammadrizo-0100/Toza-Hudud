import { baseApi } from './baseApi';
import { Mahalla } from '../types';

export const mahallasApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMahallas: builder.query<Mahalla[], { districtId?: number } | void>({
      query: (params) => ({
        url: '/mahallas',
        method: 'GET',
        params: params || {}
      }),
      providesTags: ['MAHALLAS']
    }),
    createMahalla: builder.mutation<Mahalla, { districtId: number; name: string; centerLat?: number; centerLng?: number }>({
      query: (body) => ({
        url: '/mahallas',
        method: 'POST',
        body
      }),
      invalidatesTags: ['MAHALLAS']
    }),
    updateMahalla: builder.mutation<Mahalla, { id: number; name?: string; centerLat?: number; centerLng?: number }>({
      query: ({ id, ...body }) => ({
        url: `/mahallas/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['MAHALLAS']
    }),
    deleteMahalla: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/mahallas/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['MAHALLAS']
    })
  })
});

export const {
  useGetMahallasQuery,
  useCreateMahallaMutation,
  useUpdateMahallaMutation,
  useDeleteMahallaMutation
} = mahallasApi;
