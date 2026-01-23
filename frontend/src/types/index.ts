export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Professional {
  id: number;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: number;
  parentId: number | null;
  title: string;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  thumbnailPath: string | null;
  fileSizeBytes: number;
  durationSeconds: number;
  customDurationSeconds: number | null;
  widthPixels: number;
  heightPixels: number;
  resolutionLabel: string;
  isTv: boolean;
  tvTitle: string | null;
  requestDate: string;
  completionDate: string;
  professionalId: number;
  uploadedBy: number;
  includeInReport: boolean; // F-011
  createdAt: string;
  updatedAt: string;
  professional?: Professional;
  uploader?: User;
  versions?: Video[];
  parent?: Video;
}

export interface DownloadLog {
  id: number;
  videoId: number;
  userId: number;
  downloadedAt: string;
  ipAddress: string | null;
  video?: Video;
  user?: User;
}

export interface NotificationRecipient {
  id: number;
  type: 'email' | 'whatsapp';
  value: string;
  active: boolean;
  createdAt: string;
}

export interface Settings {
  company_name: string;
  company_phone: string;
  company_address: string;
  company_cnpj: string;
  company_logo_path: string;
  monthly_limit_seconds: number;
  rollover_months: number;
  compression_threshold_mb: number;
  ffmpeg_preset: {
    videoBitrate: string;
    audioBitrate: string;
    resolution: string;
    crf: number;
  };
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  smtp_from?: string;
  evolution_api_url?: string;
  evolution_api_token?: string;
  evolution_instance?: string;
}

export interface MonthlyUsage {
  used: number;
  limit: number;
  remaining: number;
  rollover: number;
}

export interface VideoWithCalculation {
  video: Video;
  calculatedDuration: number;
  versions: {
    video: Video;
    calculatedDuration: number;
  }[];
  totalDuration: number;
}

export interface ReportData {
  month: number;
  year: number;
  usage: MonthlyUsage;
  videosByProfessional: {
    professional: Professional;
    videos: VideoWithCalculation[];
    totalDuration: number;
  }[];
  totalVideos: number;
  totalDuration: number;
}

export interface DashboardStats {
  currentMonth: MonthlyUsage;
  totalVideos: number;
  totalDuration: number;
  recentVideos: Video[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface ShareLink {
  id: number;
  token: string;
  customSlug: string | null;
  name: string | null;
  message: string | null;
  expiresAt: string | null;
  downloads: number;
  maxDownloads: number | null;
  active: boolean;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  videos?: Video[];
  creator?: User;
}
