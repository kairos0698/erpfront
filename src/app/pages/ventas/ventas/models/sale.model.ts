export enum PaymentMethod {
  Efectivo = 'Efectivo',
  Tarjeta = 'Tarjeta',
  Transferencia = 'Transferencia',
  Cheque = 'Cheque',
  Otro = 'Otro'
}

export enum PaymentStatus {
  Pagado = 'Pagado',
  Credito = 'Credito',
  Abonos = 'Abonos'
}

export interface SaleItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
}

export interface SaleDto {
  customerId: number;
  employeeId: number;
  orderId?: number;
  saleDate: Date;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  items: SaleItemDto[];
}

export interface SaleItemResponseDto {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  lineTotal: number;
  productName?: string;
}

export interface PaymentDto {
  saleId: number;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface PaymentResponseDto extends PaymentDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  saleNumber?: string;
  saleTotal?: number;
}

export interface SaleResponseDto {
  id: number;
  saleNumber: string;
  customerId: number;
  employeeId: number;
  orderId?: number;
  saleDate: Date;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  subtotal: number;
  discount: number;
  iva: number;
  total: number;
  totalPaid: number;
  pendingBalance: number;
  customerName?: string;
  employeeName?: string;
  orderNumber?: string;
  items: SaleItemResponseDto[];
  payments: PaymentResponseDto[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const PAYMENT_METHOD_OPTIONS = [
  { label: 'Efectivo', value: PaymentMethod.Efectivo },
  { label: 'Tarjeta', value: PaymentMethod.Tarjeta },
  { label: 'Transferencia', value: PaymentMethod.Transferencia },
  { label: 'Cheque', value: PaymentMethod.Cheque },
  { label: 'Otro', value: PaymentMethod.Otro }
];

export const PAYMENT_STATUS_OPTIONS = [
  { label: 'Pagado', value: PaymentStatus.Pagado },
  { label: 'Crédito', value: PaymentStatus.Credito },
  { label: 'Abonos', value: PaymentStatus.Abonos }
];

