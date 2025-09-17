import { PackageStatus, ServiceTypeID, Nullable } from './api';

export type PackageStatusHistoryItem = {
  status: PackageStatus | number;
  timestamp: string | Date;
  location?: string;
  notes?: string;
  updatedBy?: string;
};

export type PackageDimensions = {
  length: number;
  width: number;
  height: number;
  cubes: number;
};

export type PackageNotification = {
  type: 'status_update' | 'delivery' | 'exception' | 'pickup';
  message?: string;
  sent?: boolean;
  sentAt?: string | Date;
  createdAt?: string | Date;
};

export type PackageEntity = {
  id?: string; // Mongo _id as string when serialized
  packageID: string;
  courierID?: string;
  manifestID?: string;
  collectionID?: string;

  trackingNumber: string;
  controlNumber: string;

  firstName: string;
  lastName: string;
  userCode: string;
  customerRef?: string | null; // ObjectId as string

  weight: number;
  dimensions?: PackageDimensions;
  pieces: number;

  shipper: string;
  description: string;
  hsCode?: string;

  branch: string;
  serviceTypeID: '' | ServiceTypeID;
  hazmatCodeID?: string;

  packageStatus: PackageStatus | number;
  claimed: boolean;
  unknown: boolean;
  aiProcessed: boolean;

  entryDate: string | Date;
  entryDateTime: string | Date;
  entryStaff?: string;

  originalHouseNumber?: string;
  discrepancy: boolean;
  discrepancyDescription?: string;
  coloaded: boolean;
  coloadIndicator?: string;
  packagePayments?: string;

  apiToken: string;
  showControls: boolean;

  statusHistory: PackageStatusHistoryItem[];
  notifications?: PackageNotification[];

  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Virtuals from model
  customerName?: string;
  serviceTypeName?: string;
  statusName?: string;
};


