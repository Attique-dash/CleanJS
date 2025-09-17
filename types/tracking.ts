import { PackageStatus } from './api';

export type TrackingHistoryItem = {
  status: PackageStatus | number;
  timestamp: string | Date;
  location?: string;
  notes?: string;
};

export type TrackingSummary = {
  trackingNumber: string;
  status: PackageStatus | number;
  statusName: string;
  branch: string;
  lastUpdated: string | Date;
  statusHistory: TrackingHistoryItem[];
};


