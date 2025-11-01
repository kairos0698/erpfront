export enum OrderStatus {
  Pendiente = 'Pendiente',
  EnProceso = 'EnProceso',
  Completado = 'Completado',
  Cancelado = 'Cancelado'
}

export interface OrderItemDto {
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
}

export interface OrderDto {
  customerId: number;
  deliveryAddressId?: number;
  employeeId: number;
  quotationId?: number;
  orderDate: Date;
  status: OrderStatus;
  notes?: string;
  items: OrderItemDto[];
}

export interface OrderItemResponseDto {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  lineTotal: number;
  productName?: string;
}

export interface OrderResponseDto {
  id: number;
  orderNumber: string;
  customerId: number;
  deliveryAddressId?: number;
  employeeId: number;
  quotationId?: number;
  orderDate: Date;
  status: OrderStatus;
  notes?: string;
  subtotal: number;
  discount: number;
  iva: number;
  total: number;
  customerName?: string;
  employeeName?: string;
  deliveryAddressName?: string;
  quotationNumber?: string;
  items: OrderItemResponseDto[];
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ORDER_STATUS_OPTIONS = [
  { label: 'Pendiente', value: OrderStatus.Pendiente },
  { label: 'En Proceso', value: OrderStatus.EnProceso },
  { label: 'Completado', value: OrderStatus.Completado },
  { label: 'Cancelado', value: OrderStatus.Cancelado }
];

