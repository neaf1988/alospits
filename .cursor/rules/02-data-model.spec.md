# Spec: Modelo de Datos y Entidades

## TypeScript Interfaces & DB Schema

```typescript
// Perfil de Usuario y Licencias de Conducción
interface UserProfile {
  id: string; // UUID
  email: string;
  activeVehicleId: string; // Vehículo en foco actual
  driverLicenses: {
    categoryA: { active: boolean; expiryDate: string | null }; // Motos (A1/A2)
    categoryB: { active: boolean; expiryDate: string | null }; // Carros Particulares (B1/B2/B3)
  };
  createdAt: string;
}

// Entidad Vehículo
interface Vehicle {
  id: string; // UUID
  userId: string;
  type: 'CAR' | 'MOTORCYCLE';
  brand: string;
  line: string; // Ej: Mazda 3, NKD 125
  modelYear: number;
  plate: string; // Ej: AAA123 o AAA12D
  cityCode: string; // Ej: "BOG", "MDE", "CLO"
  currentOdometerKm: number;
  tireTreadDepthMm: number; // Profundidad de labrado actual en mm
  createdAt: string;
}

// Registro de Tanqueos de Combustible
interface FuelLog {
  id: string;
  vehicleId: string;
  timestamp: string;
  odometerKm: number;
  gallons: number;
  totalCostCop: number;
  isFullTank: boolean; // Necesario para el cálculo exacto de Km/Gal
  stationName?: string;
}

// Documentos y Elementos Vencibles
interface LegalDocument {
  id: string;
  vehicleId: string;
  type: 'SOAT' | 'TECNOMECANICA' | 'SEGURO_TODO_RIESGO' | 'BOTIQUIN' | 'EXTINTOR';
  expiryDate: string; // ISO String. Botiquín maneja 1 sola fecha global
  costCop?: number;
  notes?: string;
  alertDaysBefore: number;
}

// Control de Impuestos
interface TaxRecord {
  id: string;
  vehicleId: string;
  taxYear: number;
  dueDate: string;
  discountDueDate?: string;
  costCop: number;
  status: 'PENDING' | 'PAID';
  paymentDate?: string;
}

// Registro de Mantenimientos e Intervenciones
interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceDate: string;
  odometerKm: number;
  title: string;
  details: string; // Descripción detallada de repuestos/mantenimiento
  costCop: number;
  workshopName?: string;
  invoiceNumber?: string;
  nextServiceKmTarget?: number;
  nextServiceDateTarget?: string;
}