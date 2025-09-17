// Shared enums and API helpers

export enum ServiceTypeID {
  AirStandard = '59cadcd4-7508-450b-85aa-9ec908d168fe',
  AirExpress = '25a1d8e5-a478-4cc3-b1fd-a37d0d787302',
  AirPremium = '8df142ca-0573-4ce9-b11d-7a3e5f8ba196',
  SeaStandard = '7c9638e8-4bb3-499e-8af9-d09f757a099e',
}

export type Nullable<T> = T | null;

export enum PackageStatus {
  AtWarehouse = 0,
  DeliveredToAirport = 1,
  InTransitToLocalPort = 2,
  AtLocalPort = 3,
  AtLocalSorting = 4,
}

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ApiError = {
  success: false;
  error: string;
  code?: string | number;
};

export type ApiResult<T> = ApiSuccess<T> | ApiError;

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
};


