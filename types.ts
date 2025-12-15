
export enum UserRole {
  USER = 'user',
  OPERATOR = 'operator',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  stationId?: string; // Only for operators
  favorites?: string[]; // Array of Station IDs
  preferences?: {
    email: boolean;
    whatsapp: boolean;
  };
}

export interface FuelStatus {
  gasoline: boolean; // Gasolina
  diesel: boolean;   // Gasóleo
  lastUpdated: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  phone: string;
  coords: { x: number; y: number }; // Percentage for the mock map
  location: { lat: number; lng: number }; // Real coordinates for distance calculation
  status: FuelStatus;
  imageUrl: string;
  stationCode: string; // The secret code for operators to link
  openHours: string;
  manager?: string; // Nome do responsável/gerente
}

export interface NotificationPreference {
  email: boolean;
  whatsapp: boolean;
}

export interface StationRequest {
  id: string;
  stationName: string;
  address: string;
  managerName: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

export interface AppNotification {
  id: string;
  userId: string; // 'admin', 'all_users', or specific user ID
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string;
  link?: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'failed';
}

// Reporting Types
export type ReportType = 'availability' | 'operator_activity' | 'popularity';

export interface AvailabilityReportItem {
  stationName: string;
  gasolineAvailability: number; // Percentage 0-100
  dieselAvailability: number; // Percentage 0-100
  totalHoursTracked: number;
  downtimeHours: number;
}

export interface OperatorActivityReportItem {
  operatorName: string;
  stationName: string;
  totalUpdates: number;
  averageResponseTime: number; // Minutes
  lastActive: string;
}

export interface PopularityReportItem {
  stationName: string;
  views: number;
  favorites: number;
  searchAppearances: number;
}