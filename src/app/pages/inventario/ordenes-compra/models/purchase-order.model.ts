import { PurchaseOrderItemResponseDto } from './purchase-order-item.model';

export interface PurchaseOrderDto {
  supplierId: number;
  warehouseId: number;
  orderDate: Date;
  status: number; // 0 = Por aprobar, 1 = Aprobado
  notes?: string;
}

export interface PurchaseOrderResponseDto extends PurchaseOrderDto {
  id: number;
  orderNumber: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  totalAmount: number;
  supplierName?: string;
  warehouseName?: string;
  items: PurchaseOrderItemResponseDto[];
}

export enum PurchaseOrderStatus {
  PendingApproval = 0,  // Por aprobar
  Approved = 1,         // Aprobado
  Received = 2,
  Cancelled = 3
}
