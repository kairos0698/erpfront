export interface CustomerProductDto {
  customerId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  discountAmount?: number;
  isActive: boolean;
}

export interface CustomerProductResponseDto extends CustomerProductDto {
  id: number;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  productName?: string;
  customerName?: string;
  lineTotal: number;
}

