export interface EmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  employeeNumber: string;
  positionId?: number;
  employeeTypeId?: number;
  paymentPeriod: string;
  salary: number;
  hireDate: Date;
  rfc: string;
  curp: string;
  nss: string;
  birthDate?: Date;
  employeeStatus: string; // Activo, Inactivo
  
  // Campos de domicilio
  country: string;
  postalCode: string;
  neighborhood: string;
  street: string;
  externalNumber: string;
  internalNumber: string;
  addressInstructions: string;
  
  // Campo legacy para compatibilidad
  address: string;
  
  isAlsoClient: boolean;
  
  // Campos de cliente (opcionales)
  commercialName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientRfc?: string;
  clientAddress?: string;
}

export interface EmployeeResponseDto extends EmployeeDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  clientId?: number;
  positionName?: string;
  employeeTypeName?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface EmployeeFilters {
  search?: string;
  position?: string;
  isAlsoClient?: boolean;
  page?: number;
  pageSize?: number;
}

// Enums para opciones
export enum PaymentPeriod {
  DAILY = 'Daily',
  WEEKLY = 'Weekly',
  BIWEEKLY = 'Biweekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  ANNUALLY = 'Annually'
}

export const PAYMENT_PERIOD_OPTIONS = [
  { label: 'Diario', value: PaymentPeriod.DAILY },
  { label: 'Semanal', value: PaymentPeriod.WEEKLY },
  { label: 'Quincenal', value: PaymentPeriod.BIWEEKLY },
  { label: 'Mensual', value: PaymentPeriod.MONTHLY },
  { label: 'Trimestral', value: PaymentPeriod.QUARTERLY },
  { label: 'Anual', value: PaymentPeriod.ANNUALLY }
];

// Opciones para tipo de contrato
export const CONTRACT_TYPE_OPTIONS = [
  { label: 'Determinado', value: 'Determinado' },
  { label: 'Indeterminado', value: 'Indeterminado' },
  { label: 'Proyecto', value: 'Proyecto' },
  { label: 'Temporada', value: 'Temporada' },
  { label: 'Capacitación Inicial', value: 'Capacitación Inicial' },
  { label: 'Periodo de prueba', value: 'Periodo de prueba' },
  { label: 'Subcontratado', value: 'Subcontratado' }
];

// Opciones para estado del trabajador
export const EMPLOYEE_STATUS_OPTIONS = [
  { label: 'Activo', value: 'Activo' },
  { label: 'Inactivo', value: 'Inactivo' }
];

// Lista de países (puedes expandir esta lista)
export const COUNTRIES_OPTIONS = [
  { label: 'México', value: 'México' },
  { label: 'Estados Unidos', value: 'Estados Unidos' },
  { label: 'Canadá', value: 'Canadá' },
  { label: 'España', value: 'España' },
  { label: 'Argentina', value: 'Argentina' },
  { label: 'Colombia', value: 'Colombia' },
  { label: 'Chile', value: 'Chile' },
  { label: 'Perú', value: 'Perú' },
  { label: 'Venezuela', value: 'Venezuela' },
  { label: 'Brasil', value: 'Brasil' }
];
