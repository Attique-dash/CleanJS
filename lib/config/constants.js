// Centralized constants used across services and API routes

export const SERVICE_TYPE_IDS = {
  AIR_STANDARD: '59cadcd4-7508-450b-85aa-9ec908d168fe',
  AIR_EXPRESS: '25a1d8e5-a478-4cc3-b1fd-a37d0d787302',
  AIR_PREMIUM: '8df142ca-0573-4ce9-b11d-7a3e5f8ba196',
  SEA_STANDARD: '7c9638e8-4bb3-499e-8af9-d09f757a099e',
};

export const PACKAGE_STATUS = {
  AT_WAREHOUSE: 0,
  DELIVERED_TO_AIRPORT: 1,
  IN_TRANSIT_TO_LOCAL_PORT: 2,
  AT_LOCAL_PORT: 3,
  AT_LOCAL_SORTING: 4,
};

export const STATUS_NAMES = {
  0: 'AT WAREHOUSE',
  1: 'DELIVERED TO AIRPORT',
  2: 'IN TRANSIT TO LOCAL PORT',
  3: 'AT LOCAL PORT',
  4: 'AT LOCAL SORTING',
};

export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  TASOKO_BASE_URL: process.env.TASOKO_BASE_URL || 'https://tasoko.example.com/api',
};


