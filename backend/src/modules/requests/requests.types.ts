import { RequestStatus, RequestSource, RequestEntity } from '../../database/entities/request.entity';

export interface CreateRequestInput {
  districtId: number;
  mahallaId?: number | null;
  mahallaName?: string | null;
  source?: RequestSource;
  citizenPhone?: string | null;
  citizenTelegramId?: string | null;
  citizenFullName?: string | null;
  beforePhotoUrl: string;
  wasteType?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  description?: string | null;
}

export interface RequestFilterParams {
  districtId?: number;
  mahallaId?: number;
  workerId?: number;
  status?: RequestStatus;
  wasteType?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface PaginatedRequestsResult {
  items: RequestEntity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
}

export interface MapPointItem {
  id: number;
  lat: number;
  lng: number;
  status: RequestStatus;
  mahallaName: string | null;
  address: string | null;
  beforePhotoUrl: string;
  createdAt: Date;
  completedAt: Date | null;
}
