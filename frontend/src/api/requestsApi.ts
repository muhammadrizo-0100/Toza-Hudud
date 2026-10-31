import { baseApi } from './baseApi';
import { RequestItem, RequestStatus } from '../types';

export interface RequestsResponse {
  items: RequestItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}

export interface MapPoint {
  id: number;
  lat: number;
  lng: number;
  status: RequestStatus;
  mahallaName: string | null;
  address: string | null;
  beforePhotoUrl: string;
  createdAt: string;
  completedAt?: string | null;
}

export const requestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRequests: builder.query<
      RequestsResponse,
      {
        districtId?: number;
        mahallaId?: number;
        status?: RequestStatus;
        wasteType?: string;
        page?: number;
        limit?: number;
        search?: string;
        startDate?: string;
        endDate?: string;
      }
    >({
      query: (params) => ({
        url: '/requests',
        method: 'GET',
        params
      }),
      // Provide both list tag and individual item tags so mutations that
      // invalidate a specific id also bust this list.
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'REQUESTS' as const, id })),
              { type: 'REQUESTS' as const, id: 'LIST' }
            ]
          : [{ type: 'REQUESTS' as const, id: 'LIST' }]
    }),
    getRequestById: builder.query<RequestItem, number>({
      query: (id) => `/requests/${id}`,
      providesTags: (result, error, id) => [{ type: 'REQUESTS', id }]
    }),
    getMapPoints: builder.query<MapPoint[], { districtId?: number }>({
      query: (params) => ({
        url: '/requests/map',
        method: 'GET',
        params
      }),
      providesTags: ['REQUESTS']
    }),
    assignWorker: builder.mutation<RequestItem, { id: number; workerId: number }>({
      query: ({ id, workerId }) => ({
        url: `/requests/${id}/assign`,
        method: 'PATCH',
        body: { workerId }
      }),
      invalidatesTags: ['REQUESTS', 'STATS']
    }),
    submitWork: builder.mutation<RequestItem, { id: number; afterPhotoUrl?: string; file?: File | null }>({
      query: ({ id, afterPhotoUrl, file }) => {
        if (file) {
          const formData = new FormData();
          formData.append('afterPhoto', file);
          return {
            url: `/requests/${id}/submit`,
            method: 'PATCH',
            body: formData
          };
        }
        return {
          url: `/requests/${id}/submit`,
          method: 'PATCH',
          body: { afterPhotoUrl }
        };
      },
      invalidatesTags: ['REQUESTS', 'STATS']
    }),
    verifyWork: builder.mutation<RequestItem, number>({
      query: (id) => ({
        url: `/requests/${id}/verify`,
        method: 'PATCH'
      }),
      invalidatesTags: ['REQUESTS', 'STATS']
    }),
    rejectWork: builder.mutation<RequestItem, { id: number; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/requests/${id}/reject`,
        method: 'PATCH',
        body: { reason }
      }),
      invalidatesTags: ['REQUESTS', 'STATS']
    })
  })
});

export const {
  useGetRequestsQuery,
  useLazyGetRequestsQuery,
  useGetRequestByIdQuery,
  useGetMapPointsQuery,
  useAssignWorkerMutation,
  useSubmitWorkMutation,
  useVerifyWorkMutation,
  useRejectWorkMutation
} = requestsApi;
