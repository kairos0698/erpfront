export interface PurchaseOrderItemDto {
  purchaseOrderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  ivaPercentage: number;
  comment?: string;
}

export interface PurchaseOrderItemResponseDto extends PurchaseOrderItemDto {
  id: number;
  totalPrice: number;
  productName?: string;
  productUnit?: string;
}
