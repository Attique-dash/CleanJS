import { ServiceTypeID, Nullable } from './api';

export type CustomerAddress = {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
};

export type CustomerPackageStats = {
  totalPackages: number;
  pendingPackages: number;
  deliveredPackages: number;
  totalWeight: number;
  lastPackageDate: Nullable<string | Date>;
};

export type CustomerPreferences = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  language: 'en' | 'es' | 'fr';
  timezone: string;
};

export type Customer = {
  id?: string; // Mongo _id as string when serialized
  userCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: CustomerAddress;
  branch: string;

  customerServiceTypeID: '' | ServiceTypeID;
  customerLevelInstructions: string;
  courierServiceTypeID: '' | ServiceTypeID;
  courierLevelInstructions: string;

  isActive: boolean;
  lastActivity?: string | Date;

  packageStats?: CustomerPackageStats;
  preferences?: CustomerPreferences;
  notes?: string;
  tags?: string[];

  createdBy?: string;
  updatedBy?: string;

  createdAt?: string | Date;
  updatedAt?: string | Date;

  // Derived/virtuals often present in API responses
  fullName?: string;
  formattedAddress?: string;
  customerServiceTypeName?: string;
  courierServiceTypeName?: string;
};


