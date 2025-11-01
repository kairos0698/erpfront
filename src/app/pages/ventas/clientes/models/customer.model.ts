export interface CustomerDto {
  name: string;
  commercialName?: string;
  email: string;
  phoneNumber: string;
  address?: string;
  rfc?: string;
  assignedEmployeeId?: number;
  customerOriginId?: number;
  priceListId?: number;
  discountType: string; // 'Porcentaje' | 'MontoFijo'
  discountPercentage?: number;
  discountAmount?: number;
  creditDays?: number;
  ivaPercentage?: number;
  comments?: string;
  isActive: boolean;
  isAlsoEmployee: boolean;
  employeeId?: number;
}

export interface CustomerResponseDto extends CustomerDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  assignedEmployeeName?: string;
  customerOriginName?: string;
  priceListName?: string;
  employeeName?: string;
  deliveryAddressesCount: number;
  customerProductsCount: number;
  hasFiscalData: boolean;
}

export const DISCOUNT_TYPE_OPTIONS = [
  { label: 'Porcentaje', value: 'Porcentaje' },
  { label: 'Monto Fijo', value: 'MontoFijo' }
];

