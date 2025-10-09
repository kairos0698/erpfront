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
