import { Context } from 'telegraf';

export interface UserSession {
  step:
    | 'idle'
    | 'await_photo'
    | 'await_waste_type'
    | 'await_location'
    | 'await_mahalla'
    | 'await_custom_mahalla'
    | 'await_landmark'
    | 'await_confirm'
    | 'await_worker_after_photo';
  districtId?: number;
  districtName?: string;
  mahallaId?: number;
  mahallaName?: string;
  wasteType?: string;
  beforePhotoUrl?: string;
  lat?: number;
  lng?: number;
  address?: string;
  description?: string;
  activeRequestId?: number;
}

export interface WorkerSession {
  step: 'idle' | 'awaiting_worker_username' | 'awaiting_worker_password' | 'await_after_photo';
  pendingUsername?: string;
  activeRequestId?: number;
}

export const UPLOAD_DIR = './uploads';

export const WASTE_LABELS: Record<string, string> = {
  maishiy: '🗑 Maishiy chiqindi',
  qurilish: '🧱 Qurilish chiqindisi',
  xazon: '🍂 Xazon va shoxlar',
  katta_hajmli: '🛋 Katta hajmli chiqindi',
  noqonuniy: '⚠️ Noqonuniy tashlandiq'
};

export type BotContext = Context;
