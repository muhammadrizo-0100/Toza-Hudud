import { baseApi } from './baseApi';

export interface DashboardStatsResponse {
  overall: {
    total: number;
    new: number;
    inProgress: number;
    submitted: number;
    completed: number;
    rejected: number;
    active: number;
  };
  dailyTrend: Array<{
    date: string;
    dateLabel?: string;
    total: number;
    completed: number;
    active: number;
  }>;
  mahallaBreakdown: Array<{
    name: string;
    value: number;
  }>;
  districtBreakdown: Array<{
    id: number;
    name: string;
    total: number;
    completed: number;
    active: number;
  }>;
  categoryBreakdown?: Record<string, number>;
  categoryList?: Array<{
    name: string;
    key: string;
    value: number;
    percent: number;
  }>;
}

export interface SystemInsightsResponse {
  overview: {
    totalDistricts: number;
    totalManagers: number;
    totalWorkers: number;
    totalVehicles: number;
    totalNeighborhoods: number;
    totalBuildings: number;
    totalClients: number;
    totalRequests: number;
    completedRequests: number;
    activeRequests: number;
    completionRate: number;
    newRequests: number;
    inProgressRequests: number;
    submittedRequests: number;
    reviewRequests: number;
  };
  districtCards: Array<{
    id: number;
    name: string;
    totalRequests: number;
    completedRequests: number;
    activeRequests: number;
    completionRate: number;
    workersCount: number;
    vehiclesCount: number;
  }>;
  topNeighborhoods: Array<{
    id: number;
    name: string;
    districtName: string;
    totalRequests: number;
    activeRequests: number;
    completedRequests: number;
  }>;
  topWorkers: Array<{
    id: number;
    name: string;
    districtName: string;
    vehiclePlate: string;
    activeRequests: number;
    completedRequests: number;
  }>;
  recentRequests: Array<{
    id: number;
    citizenFullName: string;
    citizenPhone: string;
    districtName: string;
    mahallaName: string;
    address: string;
    status: string;
    createdAt: string;
    beforePhotoUrl: string;
  }>;
}

export interface MyAccountResponse {
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    phone: string | null;
    district: string | null;
    vehicleNumber: string | null;
    workerRole: string | null;
    createdAt?: string;
  };
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    submitted: number;
    rejected: number;
    completionRate: number;
  };
  wasteBreakdown: Array<{
    type: string;
    count: number;
  }>;
  recentTasks: Array<{
    id: number;
    mahallaName: string | null;
    status: string;
    wasteType: string | null;
    createdAt: string;
    completedAt: string | null;
  }>;
}

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyAccount: builder.query<MyAccountResponse, void>({
      query: () => '/stats/my-account',
      providesTags: ['STATS', 'REQUESTS']
    }),
    getDashboardStats: builder.query<DashboardStatsResponse, { districtId?: number; startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: '/stats',
        method: 'GET',
        params: params || {}
      }),
      providesTags: ['STATS']
    }),
    getSystemInsights: builder.query<SystemInsightsResponse, { districtId?: number; startDate?: string; endDate?: string } | void>({
      query: (params) => ({
        url: '/stats/insights',
        method: 'GET',
        params: params || {}
      }),
      providesTags: ['STATS']
    })
  })
});

export const {
  useGetDashboardStatsQuery,
  useGetSystemInsightsQuery,
  useGetMyAccountQuery
} = statsApi;

