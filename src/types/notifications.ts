export interface PendingNotification {
  id: string;
  title: string;
  body: string;
  tag: string;
}

export interface NotificationContextVehicle {
  vehicleId: string;
  plate: string;
  cityCode: string;
  vehicleType: import('./index').VehicleType;
  tireTreadDepthMm: number;
  complianceItems: import('./index').ComplianceItem[];
  taxRecords: import('./index').TaxRecord[];
  picoPlacaAppliesToday: boolean;
  picoPlacaCityName: string;
  picoPlacaDigits: number[];
}

export interface NotificationContext {
  userId: string;
  activeVehicleId: string | null;
  vehicles: NotificationContextVehicle[];
  driverLicenses: import('./index').DriverLicenses;
}
