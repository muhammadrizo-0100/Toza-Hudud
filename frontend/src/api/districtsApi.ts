import { baseApi } from './baseApi';
import { District } from '../types';

export const districtsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDistricts: builder.query<District[], void>({
      query: () => '/districts',
      providesTags: ['DISTRICTS']
    }),
    getDistrictById: builder.query<District, number>({
      query: (id) => `/districts/${id}`,
      providesTags: (result, error, id) => [{ type: 'DISTRICTS', id }]
    }),
    createDistrict: builder.mutation<District, { name: string; code?: string; centerLat?: number; centerLng?: number; fetchOsmBoundary?: boolean }>({
      query: (body) => ({
        url: '/districts',
        method: 'POST',
        body
      }),
      invalidatesTags: ['DISTRICTS']
    }),
    updateDistrict: builder.mutation<District, { id: number; name?: string; centerLat?: number; centerLng?: number }>({
      query: ({ id, ...body }) => ({
        url: `/districts/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['DISTRICTS']
    }),
    deleteDistrict: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/districts/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['DISTRICTS']
    })
  })
});

export const {
  useGetDistrictsQuery,
  useGetDistrictByIdQuery,
  useCreateDistrictMutation,
  useUpdateDistrictMutation,
  useDeleteDistrictMutation
} = districtsApi;
