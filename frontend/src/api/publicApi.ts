import { baseApi } from './baseApi';
import { District, Mahalla, RequestStatus } from '../types';

export interface TrackedRequest {
  id: number;
  status: RequestStatus;
  mahallaName: string | null;
  address: string | null;
  beforePhotoUrl: string;
  afterPhotoUrl?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export const publicApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicLocations: builder.query<{ districts: District[]; mahallas: Mahalla[] }, { districtId?: number } | void>({
      query: (params) => ({
        url: '/public/locations',
        method: 'GET',
        params: params || {}
      }),
      providesTags: ['PUBLIC']
    }),
    submitPublicRequest: builder.mutation<{ success: boolean; requestId: number; message: string }, FormData>({
      query: (formData) => ({
        url: '/public/requests',
        method: 'POST',
        body: formData
      }),
      invalidatesTags: ['REQUESTS', 'STATS']
    }),
    trackRequest: builder.query<TrackedRequest | TrackedRequest[], { id?: string; phone?: string }>({
      query: (params) => ({
        url: '/public/track',
        method: 'GET',
        params
      }),
      providesTags: ['PUBLIC']
    })
  })
});

export const {
  useGetPublicLocationsQuery,
  useSubmitPublicRequestMutation,
  useLazyTrackRequestQuery
} = publicApi;
