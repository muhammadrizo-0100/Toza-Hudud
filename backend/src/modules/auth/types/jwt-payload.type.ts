import { AdminRole } from '../../../database/entities/admin.entity';

export interface JwtPayload {
  id: number;
  username: string;
  role: AdminRole;
  districtId: number | null;
  workerId?: number | null;
  fullName: string;
}
