/** Reglas de negocio globales (ver 00-system-prompt) */
export const MAX_VEHICLES = 2 as const;
export const TIRE_TREAD_CRITICAL_MM = 1.6 as const;

export type VehicleType = 'CAR' | 'MOTORCYCLE';

export type LegalDocumentType =
  | 'SOAT'
  | 'TECNOMECANICA'
  | 'SEGURO_TODO_RIESGO'
  | 'BOTIQUIN'
  | 'EXTINTOR';

/** Alias de dominio para cumplimiento normativo (persistido en legalDocuments) */
export type ComplianceItemType = LegalDocumentType;

export type TaxStatus = 'PENDING' | 'PAID';

/** Subcategorías de licencia de conducción (Colombia / RUNT) */
export type DriverLicenseClass = 'A1' | 'A2' | 'B1' | 'B2' | 'B3';

export interface DriverLicenseEntry {
  active: boolean;
  expiryDate: string | null;
  alertDaysBefore: number;
}

export type DriverLicenses = Record<DriverLicenseClass, DriverLicenseEntry>;

/** @deprecated Estructura anterior — migrar a DriverLicenses */
export interface LegacyDriverLicenses {
  categoryA?: { active: boolean; expiryDate: string | null };
  categoryB?: { active: boolean; expiryDate: string | null };
}

/** Perfil de usuario y licencias de conducción */
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  activeVehicleId: string;
  driverLicenses: DriverLicenses;
  createdAt: string;
}

/** Entidad vehículo */
export interface Vehicle {
  id: string;
  userId: string;
  type: VehicleType;
  brand: string;
  line: string;
  modelYear: number;
  plate: string;
  cityCode: string;
  currentOdometerKm: number;
  tireTreadDepthMm: number;
  createdAt: string;
}

/** Registro de tanqueos de combustible */
export interface FuelLog {
  id: string;
  vehicleId: string;
  timestamp: string;
  odometerKm: number;
  gallons: number;
  totalCostCop: number;
  isFullTank: boolean;
  stationName?: string;
}

/** Documentos y elementos vencibles (tabla IndexedDB: legalDocuments) */
export interface LegalDocument {
  id: string;
  vehicleId: string;
  type: LegalDocumentType;
  expiryDate: string;
  costCop?: number;
  notes?: string;
  alertDaysBefore: number;
}

/** Alias de dominio para ítems de cumplimiento normativo */
export type ComplianceItem = LegalDocument;

/** Control de impuestos */
export interface TaxRecord {
  id: string;
  vehicleId: string;
  taxYear: number;
  dueDate: string;
  discountDueDate?: string;
  costCop: number;
  status: TaxStatus;
  paymentDate?: string;
}

/** Registro de mantenimientos e intervenciones */
export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceDate: string;
  odometerKm: number;
  title: string;
  details: string;
  costCop: number;
  workshopName?: string;
  invoiceNumber?: string;
  nextServiceKmTarget?: number;
  nextServiceDateTarget?: string;
}

/** Día ISO: 1 = lunes … 7 = domingo */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Regla de pico y placa para un día de la semana */
export interface PicoPlacaDayRule {
  weekday: Weekday;
  digits: number[];
}

/** Calendario de pico y placa por ciudad y tipo de vehículo */
export interface PicoPlacaSchedule {
  id: string;
  cityCode: string;
  vehicleType: VehicleType;
  enabled: boolean;
  dayRules: PicoPlacaDayRule[];
  updatedAt: string;
}
