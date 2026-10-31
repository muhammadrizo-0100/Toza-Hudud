import { baseApi } from './baseApi';
import { Worker } from '../types';

export const workersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWorkers: builder.query<Worker[], { districtId?: number } | void>({
      query: (params) => ({
        url: '/workers',
        method: 'GET',
        params: params || {}
      }),
      providesTags: ['WORKERS']
    }),
    createWorker: builder.mutation<Worker, { districtId: number; fullName: string; phone: string; role?: string; vehicleNumber?: string }>({
      query: (body) => ({
        url: '/workers',
        method: 'POST',
        body
      }),
      invalidatesTags: ['WORKERS']
    }),
    updateWorker: builder.mutation<Worker, { id: number; fullName?: string; phone?: string; role?: string; vehicleNumber?: string }>({
      query: ({ id, ...body }) => ({
        url: `/workers/${id}`,
        method: 'PUT',
        body
      }),
      invalidatesTags: ['WORKERS']
    }),
    deleteWorker: builder.mutation<{ success: boolean }, number>({
      query: (id) => ({
        url: `/workers/${id}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['WORKERS']
    })
  })
});

export const {
  useGetWorkersQuery,
  useCreateWorkerMutation,
  useUpdateWorkerMutation,
  useDeleteWorkerMutation
} = workersApi;
