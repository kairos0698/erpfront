export enum QuotationStatus {
  Borrador = 'Borrador',
  Enviada = 'Enviada',
  Aprobada = 'Aprobada',
  Rechazada = 'Rechazada',
  Expirada = 'Expirada'
}

export interface QuotationItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
}

export interface QuotationDto {
  customerId: number;
  deliveryAddressId?: number;
  employeeId: number;
  quotationDate: Date;
  validUntil?: Date;
  status: QuotationStatus;
  notes?: string;
  items: QuotationItemDto[];
}

export interface QuotationItemResponseDto {
  id: number;
  quotationId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  lineTotal: number;
  productName?: string;
}

export interface QuotationResponseDto {
  id: number;
  quotationNumber: string;
  customerId: number;
  deliveryAddressId?: number;
  employeeId: number;
  quotationDate: Date;
  validUntil?: Date;
  status: QuotationStatus;
  isConvertedToOrder: boolean;
  notes?: string;
  subtotal: number;
  discount: number;
  iva: number;
  total: number;
  customerName?: string;
  employeeName?: string;
  deliveryAddressName?: string;
  items: QuotationItemResponseDto[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const QUOTATION_STATUS_OPTIONS = [
  { label: 'Borrador', value: QuotationStatus.Borrador },
  { label: 'Enviada', value: QuotationStatus.Enviada },
  { label: 'Aprobada', value: QuotationStatus.Aprobada },
  { label: 'Rechazada', value: QuotationStatus.Rechazada },
  { label: 'Expirada', value: QuotationStatus.Expirada }
];

