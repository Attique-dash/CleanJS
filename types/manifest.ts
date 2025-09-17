import { PackageStatus, ServiceTypeID } from './api';

export type ManifestStatusHistoryItem = {
  status: string | keyof typeof PackageStatus | `${PackageStatus}`;
  timestamp: string | Date;
  location?: string;
  notes?: string;
  updatedBy?: string;
};

export type Manifest = {
  id?: string; // Mongo _id as string
  manifestID: string;
  courierID: string;
  serviceTypeID: ServiceTypeID;
  manifestStatus: '0' | '1' | '2' | '3' | '4';
  manifestCode: string;
  flightDate: string | Date;
  weight: number;
  itemCount: number;
  manifestNumber: number;
  staffName: string;
  entryDate: string | Date;
  entryDateTime: string | Date;
  awbNumber: string;

  packages?: string[]; // object ids of packages
  statusHistory?: ManifestStatusHistoryItem[];
  apiToken: string;

  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Virtuals
  serviceTypeName?: string;
  statusName?: string;
};


