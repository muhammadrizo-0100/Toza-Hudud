export type RequestStatus = 'new' | 'in_progress' | 'submitted' | 'completed' | 'rejected';
export type RequestSource = 'telegram' | 'web_portal';
export type AdminRole = 'SuperAdmin' | 'Manager' | 'Dispatcher' | 'Inspector' | 'Driver';

export interface District {
  id: number;
  name: string;
  code: string;
  centerLat: number;
  centerLng: number;
  polygon?: [number, number][] | null;
  isActive: boolean;
}

export interface Mahalla {
  id: number;
  districtId: number;
  name: string;
  centerLat?: number | null;
  centerLng?: number | null;
}

export interface Worker {
  id: number;
  districtId: number;
  fullName: string;
  phone: string;
  role?: 'Driver' | 'Inspector';
  vehicleNumber?: string | null;
  telegramId?: string | null;
  adminId?: number | null;
  isActive: boolean;
}

export interface RequestItem {
  id: number;
  districtId: number;
  mahallaId?: number | null;
  mahallaName?: string | null;
  source: RequestSource;
  citizenPhone?: string | null;
  citizenFullName?: string | null;
  citizenTelegramId?: string | null;
  beforePhotoUrl: string;
  afterPhotoUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  description?: string | null;
  status: RequestStatus;
  wasteType?: string | null;
  assignedWorkerId?: number | null;
  assignedWorker?: Worker | null;
  district?: District | null;
  mahalla?: Mahalla | null;
  assignedAt?: string | null;
  submittedAt?: string | null;
  completedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotificationItem {
  id: string;
  requestId: number;
  kind: string;
  title: string;
  message: string;
  status: string;
  districtId?: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  phone?: string | null;
  jobTitle?: string | null;
  role: AdminRole;
  districtId: number | null;
  district?: District | null;
  workerId?: number | null;
  isActive?: boolean;
  createdAt?: string;
}
